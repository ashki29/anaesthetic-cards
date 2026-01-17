-- Anaesthetic Preference Cards Database Schema
-- Run this in Supabase SQL Editor to set up your database

-- Enable UUID extension (usually enabled by default in Supabase)
create extension if not exists "uuid-ossp";

-- Teams table
create table if not exists public.teams (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  invite_code text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Users table (extends Supabase auth.users)
create table if not exists public.users (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  display_name text not null,
  team_id uuid references public.teams on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Consultants table
create table if not exists public.consultants (
  id uuid default uuid_generate_v4() primary key,
  team_id uuid references public.teams on delete cascade not null,
  name text not null,
  specialty text not null default '',
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Preference cards table
create table if not exists public.preference_cards (
  id uuid default uuid_generate_v4() primary key,
  consultant_id uuid references public.consultants on delete cascade not null,
  procedure_name text not null,
  procedure_category text,
  drugs jsonb default '{}'::jsonb not null,
  equipment jsonb default '{}'::jsonb not null,
  positioning jsonb default '{}'::jsonb not null,
  notes text,
  last_edited_by uuid references public.users on delete set null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Notices table (team announcements)
create table if not exists public.notices (
  id uuid default uuid_generate_v4() primary key,
  team_id uuid references public.teams on delete cascade not null,
  author_id uuid references public.users on delete cascade not null,
  content text not null,
  images text[] default '{}'::text[] not null,
  is_pinned boolean default false not null,
  is_archived boolean default false not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for common queries
create index if not exists idx_consultants_team_id on public.consultants(team_id);
create index if not exists idx_consultants_name on public.consultants(name);
create index if not exists idx_consultants_specialty on public.consultants(specialty);
create index if not exists idx_preference_cards_consultant_id on public.preference_cards(consultant_id);
create index if not exists idx_preference_cards_procedure_name on public.preference_cards(procedure_name);
create index if not exists idx_users_team_id on public.users(team_id);
create index if not exists idx_notices_team_id on public.notices(team_id);
create index if not exists idx_notices_created_at on public.notices(created_at);
create index if not exists idx_notices_pinned on public.notices(is_pinned);

-- Full-text search index for procedures and consultant names
create index if not exists idx_preference_cards_search on public.preference_cards
  using gin(to_tsvector('english', procedure_name || ' ' || coalesce(notes, '')));
create index if not exists idx_consultants_search on public.consultants
  using gin(to_tsvector('english', name || ' ' || specialty || ' ' || coalesce(notes, '')));

-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Trigger for preference_cards updated_at
drop trigger if exists set_preference_cards_updated_at on public.preference_cards;
create trigger set_preference_cards_updated_at
  before update on public.preference_cards
  for each row
  execute function public.handle_updated_at();

-- Trigger for notices updated_at
drop trigger if exists set_notices_updated_at on public.notices;
create trigger set_notices_updated_at
  before update on public.notices
  for each row
  execute function public.handle_updated_at();

-- Function to generate random invite codes
create or replace function public.generate_invite_code()
returns text as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i integer;
begin
  for i in 1..6 loop
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  end loop;
  return result;
end;
$$ language plpgsql;

-- Function to create user profile after signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create user profile on signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Storage bucket for notice images (public read)
insert into storage.buckets (id, name, public)
values ('notice-images', 'notice-images', true)
on conflict (id) do nothing;
