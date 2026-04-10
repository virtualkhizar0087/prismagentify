-- ============================================================
-- LexAI Migration v2
-- Adds full analysis columns to contracts table
-- Run this in your Supabase SQL Editor
-- ============================================================

alter table public.contracts
  add column if not exists red_flags            text[] default '{}',
  add column if not exists missing_protections  text[] default '{}',
  add column if not exists recommendations      text[] default '{}',
  add column if not exists plain_english_summary text;
