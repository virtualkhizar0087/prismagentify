-- AnalystAI Database Schema
-- Run this entire file in your Supabase SQL Editor

-- 1. PROFILES TABLE
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  plan text not null default 'free' check (plan in ('free', 'starter', 'pro', 'enterprise')),
  stripe_customer_id text,
  stripe_subscription_id text,
  analyses_today integer not null default 0,
  last_reset_date date not null default current_date,
  total_analyses integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- 2. ANALYSES TABLE
create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  module text not null,
  input jsonb,
  result text not null,
  created_at timestamptz not null default now()
);

alter table public.analyses enable row level security;

create policy "Users can read own analyses"
  on public.analyses for select using (auth.uid() = user_id);

create policy "Users can insert own analyses"
  on public.analyses for insert with check (auth.uid() = user_id);

-- 3. AUTO-CREATE PROFILE ON SIGNUP
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. INCREMENT ANALYSIS COUNT RPC
create or replace function public.increment_analysis_count(uid uuid)
returns void language plpgsql security definer as $$
begin
  update public.profiles
  set analyses_today = analyses_today + 1,
      total_analyses = total_analyses + 1
  where id = uid;
end;
$$;
