-- Row Level Security Policies
-- Run this after schema.sql in Supabase SQL Editor

-- Enable RLS on all tables
alter table public.teams enable row level security;
alter table public.users enable row level security;
alter table public.consultants enable row level security;
alter table public.preference_cards enable row level security;
alter table public.notices enable row level security;

-- Helper function to get user's team_id
create or replace function public.get_user_team_id()
returns uuid as $$
  select team_id from public.users where id = auth.uid()
$$ language sql security definer;

-- ============================================
-- TEAMS POLICIES
-- ============================================

-- Users can view their own team
drop policy if exists "Users can view their team" on public.teams;
create policy "Users can view their team"
  on public.teams for select
  using (id = public.get_user_team_id());

-- Anyone can read teams by invite code (for joining)
drop policy if exists "Anyone can lookup team by invite code" on public.teams;
create policy "Anyone can lookup team by invite code"
  on public.teams for select
  using (true);

-- Authenticated users can create teams
drop policy if exists "Authenticated users can create teams" on public.teams;
create policy "Authenticated users can create teams"
  on public.teams for insert
  with check (auth.role() = 'authenticated');

-- ============================================
-- USERS POLICIES
-- ============================================

-- Users can view their own profile
drop policy if exists "Users can view own profile" on public.users;
create policy "Users can view own profile"
  on public.users for select
  using (id = auth.uid());

-- Users can view teammates
drop policy if exists "Users can view teammates" on public.users;
create policy "Users can view teammates"
  on public.users for select
  using (team_id = public.get_user_team_id());

-- Users can update their own profile
drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile"
  on public.users for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Insert handled by trigger, but allow for profile creation
drop policy if exists "Users can insert own profile" on public.users;
create policy "Users can insert own profile"
  on public.users for insert
  with check (id = auth.uid());

-- ============================================
-- CONSULTANTS POLICIES
-- ============================================

-- Users can view consultants in their team
drop policy if exists "Users can view team consultants" on public.consultants;
create policy "Users can view team consultants"
  on public.consultants for select
  using (team_id = public.get_user_team_id());

-- Users can create consultants in their team
drop policy if exists "Users can create team consultants" on public.consultants;
create policy "Users can create team consultants"
  on public.consultants for insert
  with check (team_id = public.get_user_team_id());

-- Users can update consultants in their team
drop policy if exists "Users can update team consultants" on public.consultants;
create policy "Users can update team consultants"
  on public.consultants for update
  using (team_id = public.get_user_team_id())
  with check (team_id = public.get_user_team_id());

-- Users can delete consultants in their team
drop policy if exists "Users can delete team consultants" on public.consultants;
create policy "Users can delete team consultants"
  on public.consultants for delete
  using (team_id = public.get_user_team_id());

-- ============================================
-- PREFERENCE CARDS POLICIES
-- ============================================

-- Users can view preference cards for consultants in their team
drop policy if exists "Users can view team preference cards" on public.preference_cards;
create policy "Users can view team preference cards"
  on public.preference_cards for select
  using (
    consultant_id in (
      select id from public.consultants
      where team_id = public.get_user_team_id()
    )
  );

-- Users can create preference cards for consultants in their team
drop policy if exists "Users can create team preference cards" on public.preference_cards;
create policy "Users can create team preference cards"
  on public.preference_cards for insert
  with check (
    consultant_id in (
      select id from public.consultants
      where team_id = public.get_user_team_id()
    )
  );

-- Users can update preference cards for consultants in their team
drop policy if exists "Users can update team preference cards" on public.preference_cards;
create policy "Users can update team preference cards"
  on public.preference_cards for update
  using (
    consultant_id in (
      select id from public.consultants
      where team_id = public.get_user_team_id()
    )
  )
  with check (
    consultant_id in (
      select id from public.consultants
      where team_id = public.get_user_team_id()
    )
  );

-- Users can delete preference cards for consultants in their team
drop policy if exists "Users can delete team preference cards" on public.preference_cards;
create policy "Users can delete team preference cards"
  on public.preference_cards for delete
  using (
    consultant_id in (
      select id from public.consultants
      where team_id = public.get_user_team_id()
    )
  );

-- ============================================
-- NOTICES POLICIES
-- ============================================

-- Users can view notices in their team
drop policy if exists "Users can view team notices" on public.notices;
create policy "Users can view team notices"
  on public.notices for select
  using (team_id = public.get_user_team_id());

-- Users can create notices in their team
drop policy if exists "Users can create team notices" on public.notices;
create policy "Users can create team notices"
  on public.notices for insert
  with check (
    team_id = public.get_user_team_id()
    and author_id = auth.uid()
  );

-- Users can update their own notices
drop policy if exists "Users can update own notices" on public.notices;
create policy "Users can update own notices"
  on public.notices for update
  using (
    team_id = public.get_user_team_id()
    and author_id = auth.uid()
  )
  with check (
    team_id = public.get_user_team_id()
    and author_id = auth.uid()
  );

-- Users can delete their own notices
drop policy if exists "Users can delete own notices" on public.notices;
create policy "Users can delete own notices"
  on public.notices for delete
  using (
    team_id = public.get_user_team_id()
    and author_id = auth.uid()
  );

-- ============================================
-- STORAGE POLICIES (NOTICE IMAGES)
-- ============================================

-- Public read for notice images
drop policy if exists "Public can read notice images" on storage.objects;
create policy "Public can read notice images"
  on storage.objects for select
  using (bucket_id = 'notice-images');

-- Users can upload to their own folder in notice-images bucket
drop policy if exists "Users can upload notice images" on storage.objects;
create policy "Users can upload notice images"
  on storage.objects for insert
  with check (
    bucket_id = 'notice-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own notice images
drop policy if exists "Users can delete notice images" on storage.objects;
create policy "Users can delete notice images"
  on storage.objects for delete
  using (
    bucket_id = 'notice-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
