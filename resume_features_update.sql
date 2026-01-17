-- 1. Add column to track last upload time in profiles
alter table profiles 
add column if not exists last_resume_upload_at timestamp with time zone;

-- 2. Create resume_scores table to store history
create table if not exists resume_scores (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  resume_name text,
  total_score numeric not null,
  score_details jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Enable RLS and setup policies for resume_scores
alter table resume_scores enable row level security;

create policy "Users can view their own resume scores"
on resume_scores for select
using (auth.uid() = user_id);

create policy "Users can insert their own resume scores"
on resume_scores for insert
with check (auth.uid() = user_id);
