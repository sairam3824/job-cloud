-- Safe Policy Creation Helper
-- (Supabase doesn't have "CREATE POLICY IF NOT EXISTS", so we make a helper)
create or replace function create_policy_if_not_exists (
    policy_name text,
    table_name text,
    operation text,
    cmd text -- 'USING (auth.uid() = user_id)'
) returns void as $$
begin
    if not exists (
        select 1 from pg_policies 
        where schemaname = 'public' 
        and tablename = table_name 
        and policyname = policy_name
    ) then
        execute format('create policy %I on %I for %s %s', policy_name, table_name, operation, cmd);
    end if;
end;
$$ language plpgsql;


-- 1. JOBS TABLE
create table if not exists public.jobs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  crawled_date date not null,
  site text,
  job_url text,
  job_url_direct text,
  title text,
  company text,
  location text,
  description text,
  date_posted text,
  role text,
  city text,
  job_type text,
  salary_source text,
  interval text,
  min_amount numeric,
  max_amount numeric,
  currency text,
  is_remote boolean,
  job_level text,
  job_function text,
  listing_type text,
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
  emails text,
  skills text,
  experience_range text,
  vacancy_count numeric,
  work_from_home_type text,
  raw_data jsonb,
  unique(job_url, crawled_date)
);

alter table public.jobs enable row level security;
select create_policy_if_not_exists('Allow everyone read access', 'jobs', 'select', 'using (true)');
select create_policy_if_not_exists('Allow authenticated upload', 'jobs', 'insert', 'with check (true)');


-- 2. PROFILES TABLE
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade not null primary key,
  email text,
  first_name text,
  last_name text,
  role text default 'user' check (role in ('user', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_resume_upload_at timestamp with time zone -- Added from resume_features
);

alter table public.profiles enable row level security;
select create_policy_if_not_exists('Public profiles are viewable by everyone', 'profiles', 'select', 'using (true)');
select create_policy_if_not_exists('Users can update own profile', 'profiles', 'update', 'using (auth.uid() = id)');

-- Profile Trigger
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, first_name, last_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'last_name', 'user')
  on conflict (id) do nothing; -- Safe on conflict
  return new;
end;
$$ language plpgsql security definer;

-- Trigger Drop/Create
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();


-- 3. SAVED JOBS
create table if not exists public.saved_jobs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  job_id uuid references public.jobs(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, job_id)
);

alter table public.saved_jobs enable row level security;
select create_policy_if_not_exists('Users can view own saved jobs', 'saved_jobs', 'select', 'using (auth.uid() = user_id)');
select create_policy_if_not_exists('Users can insert own saved jobs', 'saved_jobs', 'insert', 'with check (auth.uid() = user_id)');
select create_policy_if_not_exists('Users can delete own saved jobs', 'saved_jobs', 'delete', 'using (auth.uid() = user_id)');


-- 4. SAVED COMPANIES
create table if not exists public.saved_companies (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  company_name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, company_name)
);

alter table public.saved_companies enable row level security;
select create_policy_if_not_exists('Users can view their own saved companies', 'saved_companies', 'select', 'using (auth.uid() = user_id)');
select create_policy_if_not_exists('Users can insert their own saved companies', 'saved_companies', 'insert', 'with check (auth.uid() = user_id)');
select create_policy_if_not_exists('Users can delete their own saved companies', 'saved_companies', 'delete', 'using (auth.uid() = user_id)');


-- 5. RESUME SCORES
create table if not exists public.resume_scores (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  resume_name text,
  total_score numeric not null,
  score_details jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.resume_scores enable row level security;
select create_policy_if_not_exists('Users can view their own resume scores', 'resume_scores', 'select', 'using (auth.uid() = user_id)');
select create_policy_if_not_exists('Users can insert their own resume scores', 'resume_scores', 'insert', 'with check (auth.uid() = user_id)');


-- 6. APPLIED JOBS (With Idempotent Columns)
create table if not exists public.applied_jobs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  job_id uuid references jobs(id) on delete set null,
  applied_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, job_id)
);

-- Add extra columns safely
alter table applied_jobs add column if not exists job_title text;
alter table applied_jobs add column if not exists company_name text;
alter table applied_jobs add column if not exists job_url text;
alter table applied_jobs add column if not exists location text;

-- Ensure constraints allow deleted jobs (SET NULL)
do $$
begin
  if exists (select 1 from information_schema.table_constraints where constraint_name = 'applied_jobs_job_id_fkey') then
    alter table applied_jobs drop constraint applied_jobs_job_id_fkey;
  end if;
end $$;

alter table applied_jobs 
add constraint applied_jobs_job_id_fkey 
foreign key (job_id) references jobs(id) on delete set null;

alter table applied_jobs alter column job_id drop not null;

alter table applied_jobs enable row level security;
select create_policy_if_not_exists('Users can view their own applied jobs', 'applied_jobs', 'select', 'using (auth.uid() = user_id)');
select create_policy_if_not_exists('Users can insert their own applied jobs', 'applied_jobs', 'insert', 'with check (auth.uid() = user_id)');
select create_policy_if_not_exists('Users can delete their own applied jobs', 'applied_jobs', 'delete', 'using (auth.uid() = user_id)');
