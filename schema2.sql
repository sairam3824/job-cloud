-- ==========================================
-- 1. Create a public 'profiles' table to hold custom user data (roles)
-- ==========================================
create table public.profiles (
  id uuid references auth.users(id) on delete cascade not null primary key,
  email text,
  first_name text,
  last_name text,
  role text default 'user' check (role in ('user', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for profiles
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Trigger to create a profile entry automatically when a new user signs up in Supabase Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, first_name, last_name, role)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'first_name', 
    new.raw_user_meta_data->>'last_name', 
    'user'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ==========================================
-- 2. Create saved_jobs table (As previously requested)
-- ==========================================
create table public.saved_jobs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  job_id uuid references public.jobs(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Prevent duplicate saves
  unique(user_id, job_id)
);

-- RLS for saved_jobs
alter table public.saved_jobs enable row level security;

-- Users can view their own saved jobs
create policy "Users can view own saved jobs"
on public.saved_jobs for select
using (auth.uid() = user_id);

-- Users can save jobs
create policy "Users can insert own saved jobs"
on public.saved_jobs for insert
with check (auth.uid() = user_id);

-- Users can delete their own saved jobs
create policy "Users can delete own saved jobs"
on public.saved_jobs for delete
using (auth.uid() = user_id);


-- ==========================================
-- 3. FIX: Grant Access to Jobs Table for Authenticated Users
-- ==========================================
-- Previous policy only allowed 'anon' (unauthenticated) users.
-- We must update it to include 'authenticated' users as well.

drop policy if exists "Allow public read access" on public.jobs;

create policy "Allow everyone read access"
  on public.jobs for select
  to anon, authenticated
  using (true);


-- ==========================================
-- INSTRUCTIONS FOR ADMIN ACCESS
-- ==========================================
-- To make a user an admin, run this SQL command in the Supabase Editor:
-- update public.profiles set role = 'admin' where email = 'user@example.com';
