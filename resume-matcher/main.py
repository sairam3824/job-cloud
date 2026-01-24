from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pdfminer.high_level import extract_text
import spacy
from sklearn.feature_extraction.text import CountVectorizer
import re
import io
import json
import os
from openai import OpenAI

app = FastAPI()

# Allow CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load NLP model
try:
    nlp = spacy.load("en_core_web_sm")
except:
    import subprocess
    subprocess.run(["python", "-m", "spacy", "download", "en_core_web_sm"])
    nlp = spacy.load("en_core_web_sm")

def extract_profile_info(text, nlp_doc):
    email = re.findall(r'[\w\.-]+@[\w\.-]+', text)
    phone = re.findall(r'(\d{3}[-\.\s]??\d{3}[-\.\s]??\d{4}|\(\d{3}\)\s*\d{3}[-\.\s]??\d{4}|\d{3}[-\.\s]??\d{4})', text)
    
    # Attempt to find a name (PERSON) and location (GPE) using Spacy
    person_name = None
    location = None
    
    # Heuristic: The first PERSON entity found in the first 500 characters is likely the name
    for ent in nlp_doc.ents:
        if ent.label_ == "PERSON" and not person_name:
            person_name = ent.text
        if ent.label_ == "GPE" and not location:
            location = ent.text
            
    return {
        "email": email[0] if email else None,
        "phone": phone[0] if phone else None,
        "name": person_name,
        "location": location
    }

def extract_keywords_basic(text, n=15):
    """
    Fallback keyword extraction using frequency analysis.
    Exclude common english stop words.
    """
    try:
        # Use simple CountVectorizer to find top frequent words that are not stop words
        vectorizer = CountVectorizer(stop_words='english', max_features=n, ngram_range=(1, 2))
        X = vectorizer.fit_transform([text])
        keywords = vectorizer.get_feature_names_out()
        return list(keywords)
    except:
        return []

def calculate_rule_based_score(text, resume_data):
    """Fallback rule-based scoring"""
    score = 0
    feedback = []
    breakdown = {"contact_info": 0, "structure": 0, "content_length": 0, "keywords": 0, "impact": 0}

    # 1. Contact Info (20 pts)
    if resume_data["email"]:
        score += 10
        breakdown["contact_info"] += 10
    else:
        feedback.append("Missing email address")
    
    if resume_data["phone"]:
        score += 10
        breakdown["contact_info"] += 10
    else:
        feedback.append("Missing phone number")

    # 2. Content Length (20 pts)
    word_count = len(text.split())
    if 400 <= word_count <= 1000:
        score += 20
        breakdown["content_length"] += 20
    elif word_count < 400:
        score += 10
        breakdown["content_length"] += 10
        feedback.append("Resume is too short. Add more details about your experience.")
    else:
        score += 10
        breakdown["content_length"] += 10
        feedback.append("Resume might be too long. Try to keep it concise.")

    # 3. Structure & Sections (20 pts - Adjusted)
    sections = ["experience", "education", "skills", "projects", "summary", "profile"]
    found_sections = [s for s in sections if s in text.lower()]
    section_score = min(len(found_sections) * 4, 20)
    score += section_score
    breakdown["structure"] += section_score
    
    missing_sections = [s for s in sections if s not in text.lower()]
    if missing_sections:
        feedback.append(f"Consider adding these sections: {', '.join(missing_sections)}")

    # 4. Keyword Check (Action Verbs) (20 pts - Adjusted)
    action_verbs = ["managed", "developed", "led", "created", "designed", "implemented", "analyzed", "collaborated", "engineered", "optimized"]
    found_verbs = [v for v in action_verbs if v in text.lower()]
    keyword_score = min(len(found_verbs) * 2, 20)
    score += keyword_score
    breakdown["keywords"] += keyword_score
    
    if len(found_verbs) < 5:
        feedback.append("Use more strong action verbs (e.g., Managed, Developed, Led, Optimized).")

    # 5. Quantifiable Impact (20 pts - NEW)
    # detecting %, $, numbers followed by impact words like 'growth', 'reduction', 'increase'
    metrics = re.findall(r'(\d+%|\$\d+|\d+\s\+)', text)
    impact_words = ["increased", "decreased", "reduced", "improved", "grew", "saved", "generated"]
    found_impact_words = [w for w in impact_words if w in text.lower()]
    
    if len(metrics) >= 3 or (len(metrics) > 0 and len(found_impact_words) > 0):
        score += 20
        breakdown["impact"] += 20
    elif len(metrics) > 0:
        score += 10
        breakdown["impact"] += 10
        feedback.append("Good start with numbers, but try to quantify more results (e.g., 'Increased sales by 20%').")
    else:
        feedback.append("Add quantifiable results! (e.g. use numbers, percentages, and dollar amounts to show impact).")

    return {
        "total_score": score,
        "breakdown": breakdown,
        "feedback": feedback
    }

async def get_ai_analysis(text):
    """Complete analysis using OpenAI if available"""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None

    client = OpenAI(api_key=api_key)

    prompt = f"""
    You are an expert ATS and Tech Recruiter. 
    Analyze the following resume text. Provide a JSON response with the following structure:
    {{
        "total_score": <number 0-100>,
        "breakdown": {{
             "contact_info": <number 0-20>,
             "structure": <number 0-20>,
             "content_length": <number 0-20>,
             "keywords": <number 0-20>,
             "impact": <number 0-20>
        }},
        "feedback": [<list of strings, specific improvements>],
        "extracted_keywords": [<list of strings, top 10-15 most important technical skills found.>],
        "soft_skills": [<list of strings, top 5 soft skills found.>],
        "missing_skills": [<list of strings, crucial skills missing for the apparent role>],
        "predicted_roles": [<list of strings, top 3-5 job titles this candidate is best suited for (e.g. "Software Engineer", "Backend Developer", "Data Scientist")>],
        "summary_critique": <string, brief critique of the professional summary>
    }}
    
    Focus on "Impact" - look for quantifiable results (numbers, metrics) in the Work Experience.
    
    Resume Text:
    {text[:4000]} 
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        content = response.choices[0].message.content
        return json.loads(content)
    except Exception as e:
        print(f"AI Analysis failed: {e}")
        return None

@app.post("/api/parser")
async def parse_resume(file: UploadFile = File(...)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    content = await file.read()
    
    try:
        # Extract Text
        text = extract_text(io.BytesIO(content))
        
        # NLP Processing for Entity Extraction
        doc = nlp(text)
        profile = extract_profile_info(text, doc)
        
        # 1. Calculate Rule-Based Score (Baseline)
        rule_score = calculate_rule_based_score(text, profile)
        
        # 2. Try AI Analysis
        ai_score = await get_ai_analysis(text)
        
        # Merge Results
        final_scoring = rule_score
        keywords = extract_keywords_basic(text) # Default fallback keywords
        soft_skills = []

        if ai_score:
            final_scoring = {
                "total_score": ai_score.get("total_score", rule_score["total_score"]),
                "breakdown": ai_score.get("breakdown", rule_score["breakdown"]),
                "feedback": ai_score.get("feedback", rule_score["feedback"])
            }
            if "missing_skills" in ai_score:
                final_scoring["feedback"].append(f"Recommended Skills: {', '.join(ai_score['missing_skills'][:5])}")
            
            # Use AI extracted keywords if available
            if "extracted_keywords" in ai_score and ai_score["extracted_keywords"]:
                keywords = ai_score["extracted_keywords"]
                
            if "soft_skills" in ai_score:
                soft_skills = ai_score["soft_skills"]
        
        return {
            "resume": {
                "profile": profile,
                "text": text[:500] + "..."
            },
            "score": {
                "totalScore": final_scoring["total_score"],
                "breakdown": {
                    "contactInfo": final_scoring["breakdown"].get("contact_info", 0),
                    "structure": final_scoring["breakdown"].get("structure", 0),
                    "experience": final_scoring["breakdown"].get("content_length", 0),
                    "keywords": final_scoring["breakdown"].get("keywords", 0),
                    "impact": final_scoring["breakdown"].get("impact", 0)
                },
                "feedback": final_scoring["feedback"]
            },
            "keywords": keywords,
            "softSkills": soft_skills,
            "predictedRoles": ai_score.get("predicted_roles", []) if ai_score else []
        }
        
    except Exception as e:
        print(f"Error parsing PDF: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to parse PDF: {str(e)}")

@app.get("/health")
def health_check():
    return {"status": "ok"}
