# import os
# import pandas as pd
# from jobspy import scrape_jobs
# from supabase import create_client, Client
# from datetime import datetime, date
# from dotenv import load_dotenv
# import json

# load_dotenv()

# # Supabase Setup
# url: str = os.environ.get("SUPABASE_URL")
# key: str = os.environ.get("SUPABASE_KEY")

# cities = {
#     "Hyderabad": "Hyderabad, Telangana, India",
#     "Bengaluru": "Bengaluru, Karnataka, India",
#     "Chennai": "Chennai, Tamil Nadu, India"
# }

# roles = [
#     "software engineer",
#     "data scientist",
#     "ai engineer",
#     "business analyst"
# ]

# master = []
# print(f"Starting job scrape for date: {date.today()}")

# for r in roles:
#     for c, loc in cities.items():
#         print(f"Scraping {r} in {c}...")
#         try:
#             df = scrape_jobs(
#                 site_name=["indeed", "linkedin", "google"],
#                 search_term=r,
#                 google_search_term=f"{r} jobs near {c} since yesterday",
#                 location=loc,
#                 results_wanted=30,
#                 hours_old=24,
#                 country_indeed="INDIA",
#                 linkedin_fetch_description=True,
#             )
#         except Exception as e:
#             print(f"Error scraping {r} in {c}: {e}")
#             continue

#         if len(df) > 0:
#             # Use user-preferred column names
#             df["role"] = r
#             df["city"] = c
#             master.append(df)

# if not master:
#     print("No jobs found today.")
#     exit(0)

# final = pd.concat(master, ignore_index=True)
# print(f"Total jobs scraped: {len(final)}")

# # --- DATA CLEANING FOR SUPABASE ---

# # 1. Add crawled_date
# final["crawled_date"] = date.today().isoformat()

# # 2. Rename 'id' from jobspy to 'external_id' to avoid conflict with Supabase Primary Key
# if "id" in final.columns:
#     final.rename(columns={"id": "external_id"}, inplace=True)

# # 3. Handle Boolean columns (Supabase expects Python bools or 'true'/'false' strings)
# bool_cols = ["is_remote"]
# for col in bool_cols:
#     if col in final.columns:
#         final[col] = final[col].astype(bool)

# # 4. Handle NaN/Null values (Convert to None for JSON/SQL compatibility)
# # Replace pd.NA and np.nan with None
# final = final.where(pd.notnull(final), None)

# # 5. Convert lists/dicts to strings if strictly needed, or let Supabase handle JSON types
# # 'emails', 'skills' might come as lists. Let's ensure they are strings or compatible.
# for col in ["emails", "skills", "company_addresses", "description"]:
#     if col in final.columns:
#         final[col] = final[col].apply(lambda x: str(x) if isinstance(x, (list, dict)) else x)

# records = final.to_dict(orient="records")

# if url and key:
#     supabase: Client = create_client(url, key)
    
#     batch_size = 100
#     total_inserted = 0
    
#     for i in range(0, len(records), batch_size):
#         batch = records[i:i+batch_size]
#         try:
#             # We use 'ignore_duplicates' strategy if possible, or just standard upsert
#             # Assuming 'job_url' + 'crawled_date' is Unique
#             response = supabase.table("jobs").upsert(batch, on_conflict="job_url, crawled_date").execute()
#             total_inserted += len(batch)
#             print(f"Inserted batch {i//batch_size + 1}")
#         except Exception as e:
#             print(f"Error inserting batch starting at index {i}: {e}")
#             # Optional: Print first record to debug keys
#             # print(batch[0].keys())
            
#     print(f"Successfully inserted {total_inserted} jobs into Supabase.")
# else:
#     print("Skipping Supabase upload (credentials missing). Saving to CSV locally.")
#     final.to_csv("daily_jobs_full.csv", index=False)
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

cities = {
    "Hyderabad": "Hyderabad, Telangana, India",
    "Bengaluru": "Bengaluru, Karnataka, India",
    "Chennai": "Chennai, Tamil Nadu, India"
}

roles = ["software engineer","data scientist","ai engineer","business analyst"]

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
    "job_type","salary_source","interval","min_amount","max_amount","currency","is_remote",
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
