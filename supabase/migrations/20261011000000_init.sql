-- ==============================================================================
-- MUNDANE — Supabase PostgreSQL Schema & Row Level Security Policies
-- Migration: 20261011000000_init.sql
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table (Optional Auth integration)
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- 2. Investigations Table
create table if not exists public.investigations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  title text not null,
  central_question text not null,
  category text not null,
  why_worth_investigating text not null,
  observable_phenomena jsonb not null default '[]'::jsonb,
  field_procedure jsonb not null default '[]'::jsonb,
  time_estimate_minutes integer not null default 15,
  difficulty text not null default 'moderate',
  safety_considerations jsonb not null default '[]'::jsonb,
  status text not null default 'in_progress', -- in_progress | completed | paused
  conclusion text,
  conclusion_status text, -- supported_by_observations | plausible_unverified | inconclusive | contradicted_by_observations
  remaining_uncertainties text,
  personal_reflections text,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists investigations_user_id_idx on public.investigations(user_id);
create index if not exists investigations_status_idx on public.investigations(status);
create index if not exists investigations_created_at_idx on public.investigations(created_at desc);

alter table public.investigations enable row level security;

create policy "Users can read own investigations"
  on public.investigations for select
  using (auth.uid() = user_id or auth.uid() is null);

create policy "Users can create own investigations"
  on public.investigations for insert
  with check (auth.uid() = user_id or auth.uid() is null);

create policy "Users can update own investigations"
  on public.investigations for update
  using (auth.uid() = user_id or auth.uid() is null);

create policy "Users can delete own investigations"
  on public.investigations for delete
  using (auth.uid() = user_id or auth.uid() is null);

-- 3. Observations Table
create table if not exists public.observations (
  id uuid primary key default gen_random_uuid(),
  investigation_id uuid not null references public.investigations(id) on delete cascade,
  user_id uuid references auth.users on delete cascade,
  step_number integer not null default 1,
  prompt text not null,
  notes text not null default '',
  is_uncertain boolean not null default false,
  environmental_context jsonb not null default '{}'::jsonb,
  photo_url text,
  ai_analysis jsonb,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists observations_investigation_id_idx on public.observations(investigation_id);

alter table public.observations enable row level security;

create policy "Users can read own observations"
  on public.observations for select
  using (auth.uid() = user_id or auth.uid() is null);

create policy "Users can create own observations"
  on public.observations for insert
  with check (auth.uid() = user_id or auth.uid() is null);

create policy "Users can update own observations"
  on public.observations for update
  using (auth.uid() = user_id or auth.uid() is null);

create policy "Users can delete own observations"
  on public.observations for delete
  using (auth.uid() = user_id or auth.uid() is null);

-- 4. Hypotheses Table
create table if not exists public.hypotheses (
  id uuid primary key default gen_random_uuid(),
  investigation_id uuid not null references public.investigations(id) on delete cascade,
  user_id uuid references auth.users on delete cascade,
  statement text not null,
  source text not null default 'user', -- user | ai
  verdict text not null default 'pending', -- pending | supported | plausible_unverified | inconclusive | contradicted
  supporting_evidence text default '',
  contradicting_evidence text default '',
  created_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists hypotheses_investigation_id_idx on public.hypotheses(investigation_id);

alter table public.hypotheses enable row level security;

create policy "Users can read own hypotheses"
  on public.hypotheses for select
  using (auth.uid() = user_id or auth.uid() is null);

create policy "Users can create own hypotheses"
  on public.hypotheses for insert
  with check (auth.uid() = user_id or auth.uid() is null);

create policy "Users can update own hypotheses"
  on public.hypotheses for update
  using (auth.uid() = user_id or auth.uid() is null);

create policy "Users can delete own hypotheses"
  on public.hypotheses for delete
  using (auth.uid() = user_id or auth.uid() is null);
