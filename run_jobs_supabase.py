import os
import pandas as pd
from jobspy import scrape_jobs
from supabase import create_client
from datetime import datetime, date
from dotenv import load_dotenv
import json
from datetime import datetime
import pytz

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

# Load configuration from JSON file
try:
    with open("scraper_config.json", "r") as f:
        config = json.load(f)
        cities = config.get("cities", {})
        roles = config.get("roles", [])
except FileNotFoundError:
    print("Error: scraper_config.json not found.")
    cities = {}
    roles = []
frames = []
print("Scraping started:", date.today())

for r in roles:
    for c, loc in cities.items():
        try:
            print("Scraping", r, c)
            df = scrape_jobs(
                site_name=["indeed","linkedin","google"],
                search_term=r,
                google_search_term=f"{r} jobs near {c} since yesterday",
                location=loc,
                results_wanted=50,
                hours_old=24,
                country_indeed="INDIA",
                linkedin_fetch_description=True
            )
        except:
            continue

        if len(df):
            df["role"] = r
            df["city"] = c
            frames.append(df)

final = pd.concat(frames, ignore_index=True)
IST = pytz.timezone("Asia/Kolkata")
ist_now = datetime.now(IST).date().isoformat()
final["crawled_date"] = ist_now

# Drop duplicates based on job_url to prevent "ON CONFLICT DO UPDATE command cannot affect row a second time"
if not final.empty:
    final = final.drop_duplicates(subset=["job_url"])

# ---- Normalize ----

final = final.astype(object).where(pd.notnull(final), None)

for c in final.columns:
    if "date" in c or "time" in c:
        final[c] = final[c].apply(lambda x: x.isoformat() if isinstance(x,(date,datetime)) else x)

for c in ["emails","skills","company_addresses","description"]:
    if c in final.columns:
        final[c] = final[c].apply(lambda x: json.dumps(x) if isinstance(x,(list,dict)) else x)

# Keep only valid Supabase columns
valid_cols = {
    "site","job_url","job_url_direct","title","company","location","date_posted",
    "job_type","is_remote",
    "job_level","job_function","listing_type","emails","description","company_industry",
    "company_url","company_logo","company_url_direct","company_addresses",
    "company_num_employees","company_revenue","company_description","skills","experience_range",
    "company_rating","company_reviews_count","vacancy_count","work_from_home_type","role","city","crawled_date"
}

raw_cols = [c for c in final.columns if c not in valid_cols]
final["raw_data"] = final[raw_cols].to_dict(orient="records")
final = final[list(valid_cols) + ["raw_data"]]

records = final.to_dict(orient="records")

supabase = create_client(url, key)

for i in range(0, len(records), 100):
    supabase.table("jobs").upsert(
        records[i:i+100],
        on_conflict="job_url,crawled_date"
    ).execute()

print("Inserted", len(records), "jobs successfully.")