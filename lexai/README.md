# ⚖️ LexAI — AI Legal Co-Pilot for Small Businesses

LexAI is a SaaS product that gives small business owners access to AI-powered legal guidance, contract analysis, and document generation — without the $500/hour attorney fees.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database & Auth | Supabase (PostgreSQL + RLS) |
| Payments | Stripe (subscriptions) |
| AI | Anthropic Claude (`claude-sonnet-4-20250514`) |
| Email | Resend |

## Features

- **Contract Analysis** — Upload any contract, get a 0-100 risk score, red flags, missing protections, and a plain-English summary
- **AI Legal Chat** — Streaming chat with Claude, contextualized as a legal expert for small businesses
- **Document Generation** — NDA, service agreement, employment contract, privacy policy, T&S, cease & desist
- **3-Tier Subscriptions** — Starter ($49), Pro ($99), Team ($299) via Stripe
- **Auth** — Email/password + Google OAuth via Supabase

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment variables
```bash
cp .env.local.example .env.local
# Fill in all values (Supabase, Stripe, Anthropic, Resend)
```

### 3. Set up Supabase
1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the SQL editor
3. Enable **Google OAuth** in Authentication → Providers → Google
4. Add your site URL and callback URL: `https://yourdomain.com/auth/callback`

### 4. Set up Stripe
1. Create 3 products in your Stripe dashboard:
   - Starter — $49/month
   - Pro — $99/month
   - Team — $299/month
2. Copy the **Price IDs** to your `.env.local`
3. Set up a webhook pointing to `/api/stripe/webhook` with these events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`

### 5. Run dev server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
lexai/
├── app/
│   ├── (auth)/           # Login, signup, OAuth callback
│   ├── (dashboard)/      # Protected app pages
│   │   ├── dashboard/
│   │   ├── contracts/
│   │   ├── chat/
│   │   ├── documents/
│   │   ├── billing/
│   │   └── settings/
│   ├── api/
│   │   ├── contracts/    # Contract analysis endpoint
│   │   ├── chat/         # Streaming AI chat (SSE)
│   │   ├── documents/    # Document generation
│   │   └── stripe/       # Checkout, portal, webhook
│   ├── layout.tsx
│   └── page.tsx          # Landing page
├── components/
│   ├── layout/           # Sidebar
│   ├── contracts/        # Upload + list components
│   ├── chat/             # Chat interface (streaming)
│   ├── documents/        # Document generator
│   └── settings/         # Settings form
├── lib/
│   ├── supabase/         # Client, server, middleware
│   ├── claude.ts         # Claude API wrapper
│   ├── stripe.ts         # Stripe helpers + plan config
│   ├── resend.ts         # Transactional email templates
│   └── utils.ts          # Shared utilities
├── types/
│   └── database.ts       # TypeScript types for DB
└── supabase/
    └── schema.sql        # Full database schema
```

## Database Schema

- **users** — Extends `auth.users`, stores plan, Stripe IDs
- **contracts** — Uploaded contracts with AI analysis results
- **conversations** — Chat sessions with `messages_json` (JSONB)
- **documents_generated** — AI-generated legal documents

All tables have Row Level Security (RLS) enforced.

## Deployment

Deploy to [Vercel](https://vercel.com):

```bash
vercel deploy
```

Add all environment variables in the Vercel dashboard. Update your Stripe webhook URL and Supabase auth callback URL to use your production domain.

---

> **Legal Disclaimer**: LexAI is an AI assistant, not a licensed attorney. All output is for informational purposes only. Users should consult a qualified attorney before making legal decisions.
