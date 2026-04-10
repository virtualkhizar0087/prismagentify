-- ============================================================
-- RingPilot Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE plan_type AS ENUM ('free', 'starter', 'pro', 'agency');
CREATE TYPE business_type AS ENUM ('restaurant', 'gym');
CREATE TYPE agent_status AS ENUM ('active', 'paused', 'setup');
CREATE TYPE sentiment_type AS ENUM ('positive', 'neutral', 'negative');
CREATE TYPE notification_type AS ENUM ('missed_call', 'booking', 'lead', 'system');

-- ── users ─────────────────────────────────────────────────────────────────────
CREATE TABLE users (
  id                     UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email                  TEXT NOT NULL,
  full_name              TEXT,
  business_name          TEXT,
  business_type          business_type,
  phone                  TEXT,
  plan                   plan_type NOT NULL DEFAULT 'free',
  stripe_customer_id     TEXT,
  stripe_subscription_id TEXT,
  trial_ends_at          TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Auto-create user row on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, trial_ends_at)
  VALUES (NEW.id, NEW.email, NOW() + INTERVAL '14 days');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── agents ────────────────────────────────────────────────────────────────────
CREATE TABLE agents (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name                 TEXT NOT NULL,
  vertical             business_type NOT NULL,
  retell_agent_id      TEXT,
  twilio_phone_number  TEXT,
  voice_id             TEXT NOT NULL DEFAULT 'sarah',
  business_hours       JSONB,
  custom_instructions  TEXT,
  status               agent_status NOT NULL DEFAULT 'setup',
  calls_this_month     INTEGER NOT NULL DEFAULT 0,
  -- Language & bilingual support
  language             TEXT NOT NULL DEFAULT 'en',         -- 'en' | 'es' | 'bilingual'
  -- SMS follow-up after every call
  sms_followup_enabled BOOLEAN NOT NULL DEFAULT false,
  -- Human escalation destination
  escalation_phone     TEXT,
  -- 3rd-party booking integrations
  opentable_id         TEXT,                               -- OpenTable restaurant ID
  mindbody_site_id     TEXT,                               -- Mindbody site ID
  pos_type             TEXT,                               -- 'toast' | 'square' | 'clover' | 'none'
  menu_items           TEXT,                               -- Full menu text for restaurant agents
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own agents" ON agents FOR ALL USING (auth.uid() = user_id);

-- ── calls ─────────────────────────────────────────────────────────────────────
CREATE TABLE calls (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id         UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  call_id          TEXT,
  from_number      TEXT,
  to_number        TEXT,
  duration_seconds INTEGER,
  transcript       TEXT,
  summary          TEXT,
  action_taken     TEXT,
  recording_url    TEXT,
  sentiment        sentiment_type,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own calls" ON calls FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can insert calls" ON calls FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can update calls" ON calls FOR UPDATE USING (true);

-- ── agent_templates ───────────────────────────────────────────────────────────
CREATE TABLE agent_templates (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vertical      business_type NOT NULL,
  template_name TEXT NOT NULL,
  system_prompt TEXT NOT NULL,
  faq_examples  JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE agent_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read templates" ON agent_templates FOR SELECT USING (true);

-- Seed templates
INSERT INTO agent_templates (vertical, template_name, system_prompt, faq_examples) VALUES
(
  'restaurant',
  'Restaurant Receptionist',
  'You are a friendly and professional receptionist for {{business_name}}. Your job is to help customers with reservations, answer menu questions, and provide excellent customer service.

Business hours: {{hours}}
Business address: {{address}}
Special notes: {{custom_instructions}}
Menu: {{menu}}

When taking a reservation, always collect:
- Date and time requested
- Number of guests in the party
- Customer name and callback number
- Any dietary requirements or special requests

When answering menu questions, use the menu information above to answer confidently about dishes, prices, dietary options, allergens, and specials.

Confirm the reservation back to the customer before ending the call.
If a caller is angry, upset, or the matter is urgent, politely let them know you will connect them with the manager.',
  '[
    {"q": "Do you take reservations?", "a": "Yes, we take reservations. I can book one for you right now!"},
    {"q": "What are your hours?", "a": "Our hours are listed in the business hours field."},
    {"q": "Do you have parking?", "a": "Please check your custom instructions for parking info."},
    {"q": "Are you halal/vegan/gluten-free?", "a": "Please check your custom instructions for dietary options."}
  ]'
),
(
  'gym',
  'Gym Receptionist',
  'You are an enthusiastic and helpful receptionist for {{business_name}} gym. Your job is to help people learn about our memberships, book trial visits, and answer any questions they have.

Business hours: {{hours}}
Business address: {{address}}
Special notes: {{custom_instructions}}

When someone asks about pricing or wants to join:
- Explain our membership options warmly
- Offer to book a free trial session
- Collect their name, email, and preferred visit time

For serious complaints or urgent matters, let the caller know you will connect them with the manager.',
  '[
    {"q": "What memberships do you offer?", "a": "We have several membership options. I can walk you through them or book you a free trial visit!"},
    {"q": "Do you offer a free trial?", "a": "Yes! We offer a free trial session. I can book one for you right now."},
    {"q": "What classes do you have?", "a": "Please check your custom instructions for class schedule info."},
    {"q": "What are your hours?", "a": "Our hours are listed in the business hours field."}
  ]'
);

-- ── notifications ─────────────────────────────────────────────────────────────
CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       notification_type NOT NULL,
  message    TEXT NOT NULL,
  read       BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service role can insert notifications" ON notifications FOR INSERT WITH CHECK (true);

-- ── increment_calls RPC ───────────────────────────────────────────────────────
-- Called from retell webhook after each call ends
CREATE OR REPLACE FUNCTION increment_calls(agent_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE agents SET calls_this_month = calls_this_month + 1 WHERE id = agent_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Monthly call count reset ───────────────────────────────────────────────────
-- Schedule via Supabase cron or pg_cron:
-- SELECT cron.schedule('reset-monthly-calls', '0 0 1 * *', 'UPDATE agents SET calls_this_month = 0');

-- ── campaigns (outbound re-engagement) ────────────────────────────────────────
CREATE TABLE campaigns (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  type             TEXT NOT NULL DEFAULT 're_engagement',  -- 're_engagement' | 'reminder' | 'promo'
  vertical         business_type NOT NULL,
  message_template TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'draft',          -- 'draft' | 'active' | 'paused' | 'completed'
  total_contacts   INTEGER NOT NULL DEFAULT 0,
  sent_count       INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own campaigns" ON campaigns FOR ALL USING (auth.uid() = user_id);

-- ── campaign_contacts ──────────────────────────────────────────────────────────
CREATE TABLE campaign_contacts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT,
  phone       TEXT NOT NULL,
  email       TEXT,
  status      TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'called' | 'answered' | 'opted_out'
  called_at   TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE campaign_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own contacts" ON campaign_contacts FOR ALL USING (auth.uid() = user_id);
