import csv
import pandas as pd
from jobspy import scrape_jobs

cities = {
    "Hyderabad": "Hyderabad, Telangana, India",
    "Bengaluru": "Bengaluru, Karnataka, India",
    "Chennai": "Chennai, Tamil Nadu, India"
}

roles = [
    "software engineer",
    "machine learning engineer",
    "data scientist",
    "backend developer",
    "frontend developer",
    "full stack developer",
    "devops engineer",
    "cloud engineer",
    "ai engineer",
    "product manager",
    "business analyst"
]

master = []

for r in roles:
    for c, loc in cities.items():
        print(f"Scraping {r} in {c}...")

        df = scrape_jobs(
            site_name=["indeed", "linkedin", "zip_recruiter", "google"],
            search_term=r,
            google_search_term=f"{r} jobs near {c} since yesterday",
            location=loc,
            results_wanted=50,
            hours_old=24,
            country_indeed="INDIA",
            linkedin_fetch_description=True,
        )

        if len(df) > 0:
            df["role"] = r
            df["city"] = c
            master.append(df)

final = pd.concat(master, ignore_index=True)

print("Total jobs scraped:", len(final))
print(final.head())

final.to_csv(
    "jobs.csv",
    quoting=csv.QUOTE_NONNUMERIC,
    escapechar="\\",
    index=False
)
