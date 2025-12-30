-- Re-create the table with ALL columns from jobspy
drop table if exists public.jobs;

create table public.jobs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  crawled_date date not null,
  
  -- Core Fields
  site text,
  job_url text,
  job_url_direct text,
  title text,
  company text,
  location text,
  description text,
  date_posted text,
  
  -- Search Metadata (renamed to match your CSV preference)
  role text,
  city text,
  
  -- Salary & Type
  job_type text,
  salary_source text,
  interval text, -- 'interval' matches jobspy output
  min_amount numeric,
  max_amount numeric,
  currency text,
  
  -- Remote / Level / Function
  is_remote boolean,
  job_level text,
  job_function text,
  listing_type text,
  
  -- Company Details
  company_industry text,
  company_url text,
  company_logo text,
  company_url_direct text,
  company_addresses text,
  company_num_employees text,
  company_revenue text,
  company_description text,
  company_rating numeric,
  company_reviews_count numeric,
  
  -- Extras
  emails text,
  skills text, -- This often comes as a list, but storing as text/JSON is fine
  experience_range text,
  vacancy_count numeric,
  work_from_home_type text,
  
  -- Safety net for any extra fields
  raw_data jsonb,
  
  -- Constraint: Unique job per day
  unique(job_url, crawled_date)
);

-- RLS Policies
alter table public.jobs enable row level security;

create policy "Allow public read access"
on public.jobs for select to anon using (true);

create policy "Allow authenticated upload"
on public.jobs for insert to service_role with check (true);

create policy "Allow authenticated update"
on public.jobs for update to service_role using (true);

-- Index
create index idx_jobs_crawled_date on public.jobs(crawled_date);
