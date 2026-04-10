-- ============================================================
-- LexAI Supabase Schema
-- Run this in your Supabase SQL editor
-- ============================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

create type plan_type as enum ('free', 'starter', 'pro', 'team');
create type document_type as enum (
  'nda',
  'service_agreement',
  'employment_contract',
  'privacy_policy',
  'terms_of_service',
  'invoice',
  'cease_and_desist',
  'demand_letter',
  'other'
);

-- ============================================================
-- USERS TABLE
-- Extends Supabase auth.users with app-specific data
-- ============================================================

create table public.users (
  id           uuid references auth.users(id) on delete cascade primary key,
  email        text not null unique,
  full_name    text,
  avatar_url   text,
  plan         plan_type not null default 'free',
  stripe_customer_id      text unique,
  stripe_subscription_id  text unique,
  subscription_status     text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ============================================================
-- CONTRACTS TABLE
-- Uploaded contracts analyzed by Claude
-- ============================================================

create table public.contracts (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.users(id) on delete cascade,
  filename     text not null,
  content      text not null,
  risk_score   integer check (risk_score >= 0 and risk_score <= 100),
  risk_summary text,
  key_clauses  text[],
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ============================================================
-- CONVERSATIONS TABLE
-- Chat sessions with LexAI
-- ============================================================

create table public.conversations (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.users(id) on delete cascade,
  title         text not null default 'New Conversation',
  messages_json jsonb not null default '[]'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================
-- DOCUMENTS GENERATED TABLE
-- AI-generated legal documents
-- ============================================================

create table public.documents_generated (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.users(id) on delete cascade,
  type       document_type not null,
  title      text not null,
  content    text not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- DEADLINES TABLE
-- Time-sensitive dates extracted from contracts
-- ============================================================

create table public.deadlines (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references public.users(id) on delete cascade,
  contract_id         uuid references public.contracts(id) on delete cascade,
  contract_name       text not null,
  deadline_type       text not null check (deadline_type in ('renewal','termination_notice','payment','expiry','other')),
  description         text not null,
  deadline_date       date not null,
  notice_period_days  integer,
  reminder_30_sent    boolean not null default false,
  reminder_7_sent     boolean not null default false,
  reminder_1_sent     boolean not null default false,
  created_at          timestamptz not null default now()
);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger users_updated_at
  before update on public.users
  for each row execute function update_updated_at();

create trigger contracts_updated_at
  before update on public.contracts
  for each row execute function update_updated_at();

create trigger conversations_updated_at
  before update on public.conversations
  for each row execute function update_updated_at();

-- ============================================================
-- AUTO-CREATE USER PROFILE ON SIGNUP
-- ============================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table public.users              enable row level security;
alter table public.contracts          enable row level security;
alter table public.conversations      enable row level security;
alter table public.documents_generated enable row level security;

-- Users: can only read/update their own row
create policy "Users can view own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

-- Contracts: full CRUD for own rows
create policy "Users can manage own contracts"
  on public.contracts for all
  using (auth.uid() = user_id);

-- Conversations: full CRUD for own rows
create policy "Users can manage own conversations"
  on public.conversations for all
  using (auth.uid() = user_id);

-- Documents generated: full CRUD for own rows
create policy "Users can manage own documents"
  on public.documents_generated for all
  using (auth.uid() = user_id);

-- Deadlines: full CRUD for own rows
alter table public.deadlines enable row level security;
create policy "Users can manage own deadlines"
  on public.deadlines for all
  using (auth.uid() = user_id);

-- ============================================================
-- INDEXES (performance)
-- ============================================================

create index idx_contracts_user_id      on public.contracts(user_id);
create index idx_contracts_created_at   on public.contracts(created_at desc);
create index idx_conversations_user_id  on public.conversations(user_id);
create index idx_conversations_created  on public.conversations(created_at desc);
create index idx_documents_user_id      on public.documents_generated(user_id);
create index idx_documents_created_at   on public.documents_generated(created_at desc);
create index idx_deadlines_user_id      on public.deadlines(user_id);
create index idx_deadlines_date         on public.deadlines(deadline_date asc);

-- ============================================================
-- PLAN LIMITS VIEW (helper for enforcement in app)
-- ============================================================

create or replace view plan_limits as
select * from (values
  ('free'::plan_type,    3,   5,   1),
  ('starter'::plan_type, 25,  50,  3),
  ('pro'::plan_type,     100, 200, 10),
  ('team'::plan_type,    -1,  -1,  -1)  -- -1 = unlimited
) as t(plan, max_contracts, max_conversations, max_team_members);

-- ============================================================
-- COURT OF AI — PRECEDENTS, SAVED PRECEDENTS, LEGAL ARGUMENTS
-- Run supabase/precedents_migration.sql for these tables +
-- full-text search function + 60+ Pakistani case law seed data
-- ============================================================
