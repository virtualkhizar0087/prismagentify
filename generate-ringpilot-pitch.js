const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, WidthType, BorderStyle, ShadingType,
  PageBreak, TableOfContents, convertInchesToTwip, UnderlineType,
} = require('C:/Users/pc/AppData/Roaming/npm/node_modules/docx')
const fs = require('fs')

// ── Colors ──────────────────────────────────────────────────────────────
const BLUE    = '1D4ED8'
const BLUE_LT = 'DBEAFE'
const GRAY    = '374151'
const GRAY_LT = 'F3F4F6'
const WHITE   = 'FFFFFF'
const GREEN   = '15803D'
const GREEN_LT= 'DCFCE7'
const AMBER   = 'B45309'
const AMBER_LT= 'FEF3C7'
const RED     = 'B91C1C'
const RED_LT  = 'FEE2E2'

// ── Helpers ──────────────────────────────────────────────────────────────
function h(text, level, color = BLUE, size = null) {
  const sizes = { 1: 40, 2: 32, 3: 26, 4: 24 }
  return new Paragraph({
    heading: level,
    spacing: { before: 300, after: 150 },
    children: [new TextRun({
      text,
      bold: true,
      color,
      size: size || sizes[level] || 24,
      font: 'Calibri',
    })],
  })
}

function p(text, opts = {}) {
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    alignment: opts.center ? AlignmentType.CENTER : AlignmentType.LEFT,
    children: [new TextRun({
      text,
      size: opts.size || 22,
      color: opts.color || GRAY,
      bold: opts.bold || false,
      italics: opts.italic || false,
      font: 'Calibri',
    })],
  })
}

function bullet(text, bold_part = '') {
  const runs = []
  if (bold_part) {
    const idx = text.indexOf(bold_part)
    if (idx >= 0) {
      if (idx > 0) runs.push(new TextRun({ text: text.slice(0, idx), size: 21, color: GRAY, font: 'Calibri' }))
      runs.push(new TextRun({ text: bold_part, bold: true, size: 21, color: GRAY, font: 'Calibri' }))
      const after = text.slice(idx + bold_part.length)
      if (after) runs.push(new TextRun({ text: after, size: 21, color: GRAY, font: 'Calibri' }))
    } else {
      runs.push(new TextRun({ text, size: 21, color: GRAY, font: 'Calibri' }))
    }
  } else {
    runs.push(new TextRun({ text, size: 21, color: GRAY, font: 'Calibri' }))
  }
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { before: 60, after: 60 },
    children: runs,
  })
}

function spacer(lines = 1) {
  return new Paragraph({ spacing: { before: lines * 80, after: lines * 80 }, children: [] })
}

function divider() {
  return new Paragraph({
    spacing: { before: 100, after: 100 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BLUE_LT } },
    children: [],
  })
}

function cell(text, opts = {}) {
  return new TableCell({
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    shading: opts.shade ? { type: ShadingType.CLEAR, fill: opts.shade } : undefined,
    margins: { top: 120, bottom: 120, left: 150, right: 150 },
    children: [new Paragraph({
      alignment: opts.center ? AlignmentType.CENTER : AlignmentType.LEFT,
      children: [new TextRun({
        text: String(text),
        bold: opts.bold || false,
        color: opts.color || GRAY,
        size: opts.size || 21,
        font: 'Calibri',
      })],
    })],
  })
}

function twoColRow(label, value, shade = false) {
  return new TableRow({
    children: [
      cell(label, { bold: true, shade: shade ? GRAY_LT : WHITE, width: 40 }),
      cell(value, { shade: shade ? WHITE : GRAY_LT, width: 60 }),
    ],
  })
}

function table(rows, { cols = [] } = {}) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: 'D1D5DB' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: 'D1D5DB' },
      left: { style: BorderStyle.SINGLE, size: 4, color: 'D1D5DB' },
      right: { style: BorderStyle.SINGLE, size: 4, color: 'D1D5DB' },
      insideH: { style: BorderStyle.SINGLE, size: 2, color: 'E5E7EB' },
      insideV: { style: BorderStyle.SINGLE, size: 2, color: 'E5E7EB' },
    },
    rows,
  })
}

function headerRow(cells) {
  return new TableRow({
    tableHeader: true,
    children: cells.map(({ text, width }) =>
      cell(text, { bold: true, shade: BLUE, color: WHITE, center: true, width })
    ),
  })
}

// ══════════════════════════════════════════════════════════════════════════
// DOCUMENT SECTIONS
// ══════════════════════════════════════════════════════════════════════════

// ─── COVER PAGE ───────────────────────────────────────────────────────────
const coverPage = [
  spacer(4),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 200 },
    children: [
      new TextRun({ text: '📞  RingPilot', bold: true, size: 64, color: BLUE, font: 'Calibri' }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 400 },
    children: [
      new TextRun({ text: 'Your AI Receptionist — Never Misses a Call', size: 30, color: GRAY, italics: true, font: 'Calibri' }),
    ],
  }),
  divider(),
  spacer(1),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 100, after: 100 },
    children: [new TextRun({ text: 'INVESTOR & CLIENT PITCH DOCUMENT', bold: true, size: 26, color: BLUE, font: 'Calibri' })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 80, after: 80 },
    children: [new TextRun({ text: 'Confidential — March 2026', size: 20, color: '9CA3AF', font: 'Calibri' })],
  }),
  spacer(2),
  table([
    twoColRow('Product', 'RingPilot — AI Voice Receptionist SaaS'),
    twoColRow('Target Verticals', 'Restaurants & Gyms', true),
    twoColRow('Total Project Budget', '$12,000 USD'),
    twoColRow('Production Cost', '$7,000 USD', true),
    twoColRow('Development Timeline', '3 Months (12 Weeks)'),
    twoColRow('Team Size', '5 Members (3 Backend + 1 Frontend + 1 UI/UX)', true),
    twoColRow('Technology Stack', 'Next.js 14, Supabase, Retell AI, Stripe, Twilio'),
    twoColRow('Revenue Model', 'SaaS Subscription ($149 – $599/month)', true),
  ]),
  new Paragraph({ children: [new PageBreak()] }),
]

// ─── SECTION 1: EXECUTIVE SUMMARY ─────────────────────────────────────────
const section1 = [
  h('1. Executive Summary', HeadingLevel.HEADING_1),
  divider(),
  spacer(1),
  p('RingPilot is a B2B Software-as-a-Service (SaaS) platform that deploys AI-powered voice receptionists for small and medium-sized businesses — starting with restaurants and gyms. Every missed phone call is a missed customer. RingPilot ensures businesses never miss a call again.'),
  spacer(1),
  p('The global AI in the call center market is projected to reach $7.5 billion by 2027. Small businesses — restaurants, gyms, salons, clinics — lose an estimated $75 billion annually to unanswered calls. RingPilot captures this opportunity by offering an affordable, plug-and-play AI receptionist that answers calls, takes reservations, books appointments, and qualifies leads 24/7.'),
  spacer(1),
  h('Key Value Proposition', HeadingLevel.HEADING_3, BLUE),
  bullet('AI answers every call in under 3 seconds — 24 hours a day, 7 days a week'),
  bullet('Books reservations and appointments automatically without human involvement'),
  bullet('Saves businesses $1,200+/month compared to hiring a human receptionist'),
  bullet('Set up in 10 minutes — no technical knowledge required'),
  bullet('SaaS model: recurring monthly revenue, low churn, high lifetime value'),
  spacer(1),
  new Paragraph({ children: [new PageBreak()] }),
]

// ─── SECTION 2: PROBLEM & SOLUTION ────────────────────────────────────────
const section2 = [
  h('2. Problem & Solution', HeadingLevel.HEADING_1),
  divider(),
  spacer(1),
  h('The Problem', HeadingLevel.HEADING_2, RED),
  p('Small business owners — particularly in food & beverage and fitness — face a relentless operational challenge: the phone never stops ringing, but there is never enough staff to answer it.'),
  spacer(1),
  table([
    headerRow([
      { text: 'Pain Point', width: 35 },
      { text: 'Impact', width: 65 },
    ]),
    new TableRow({ children: [
      cell('Missed calls during peak hours', { shade: RED_LT }),
      cell('73% of callers don\'t leave voicemail — they call a competitor instead'),
    ]}),
    new TableRow({ children: [
      cell('Staff cost for phone duty', { shade: RED_LT }),
      cell('A dedicated receptionist costs $2,500–$4,000/month in salary + benefits'),
    ]}),
    new TableRow({ children: [
      cell('No after-hours coverage', { shade: RED_LT }),
      cell('Restaurants miss dinner reservations; gyms miss membership inquiries at night'),
    ]}),
    new TableRow({ children: [
      cell('Inconsistent customer experience', { shade: RED_LT }),
      cell('Stressed staff give poor service on calls — hurts reviews and reputation'),
    ]}),
    new TableRow({ children: [
      cell('Language barriers', { shade: RED_LT }),
      cell('Many SMB owners are non-native speakers — customers hang up frustrated'),
    ]}),
  ]),
  spacer(2),
  h('The Solution', HeadingLevel.HEADING_2, GREEN),
  p('RingPilot provides a dedicated AI phone number that replaces or supplements the front desk. When a customer calls, a professional AI voice answers instantly, handles the conversation naturally, and logs everything to the dashboard.'),
  spacer(1),
  table([
    headerRow([
      { text: 'Feature', width: 35 },
      { text: 'Business Benefit', width: 65 },
    ]),
    new TableRow({ children: [
      cell('24/7 AI Voice Answering', { shade: GREEN_LT }),
      cell('Zero missed calls — revenue captured even at 2am'),
    ]}),
    new TableRow({ children: [
      cell('Automated Reservation Booking', { shade: GREEN_LT }),
      cell('Restaurants fill tables without lifting a finger'),
    ]}),
    new TableRow({ children: [
      cell('Lead Qualification', { shade: GREEN_LT }),
      cell('Gyms collect member info and book free trials automatically'),
    ]}),
    new TableRow({ children: [
      cell('Call Transcripts & Summaries', { shade: GREEN_LT }),
      cell('Owner reviews every call in seconds — no guesswork'),
    ]}),
    new TableRow({ children: [
      cell('Sentiment Analysis', { shade: GREEN_LT }),
      cell('Instantly flags unhappy callers for follow-up'),
    ]}),
    new TableRow({ children: [
      cell('Instant Notifications', { shade: GREEN_LT }),
      cell('Push alerts for missed calls, bookings, and new leads'),
    ]}),
  ]),
  spacer(1),
  new Paragraph({ children: [new PageBreak()] }),
]

// ─── SECTION 3: PRODUCT OVERVIEW ──────────────────────────────────────────
const section3 = [
  h('3. Product Overview', HeadingLevel.HEADING_1),
  divider(),
  spacer(1),
  h('How RingPilot Works (4 Simple Steps)', HeadingLevel.HEADING_2, BLUE),
  table([
    headerRow([
      { text: 'Step', width: 10 },
      { text: 'Action', width: 30 },
      { text: 'What Happens', width: 60 },
    ]),
    new TableRow({ children: [
      cell('1', { center: true, bold: true, shade: BLUE_LT, color: BLUE }),
      cell('Sign Up & Choose Vertical', { bold: true }),
      cell('Business owner creates account and selects Restaurant or Gym template'),
    ]}),
    new TableRow({ children: [
      cell('2', { center: true, bold: true, shade: BLUE_LT, color: BLUE }),
      cell('Configure in 10 Minutes', { bold: true }),
      cell('Enter business name, hours, and any special instructions — wizard-guided'),
    ]}),
    new TableRow({ children: [
      cell('3', { center: true, bold: true, shade: BLUE_LT, color: BLUE }),
      cell('Get Your AI Phone Number', { bold: true }),
      cell('A dedicated phone number is provisioned automatically via Retell AI + Twilio'),
    ]}),
    new TableRow({ children: [
      cell('4', { center: true, bold: true, shade: BLUE_LT, color: BLUE }),
      cell('Go Live — AI Answers All Calls', { bold: true }),
      cell('Share the number on Google, website, and cards. AI handles every call instantly'),
    ]}),
  ]),
  spacer(2),
  h('Dashboard Features', HeadingLevel.HEADING_2, BLUE),
  bullet('Real-time call log with transcripts, recordings, and AI summaries'),
  bullet('Sentiment analysis — positive / neutral / negative per call'),
  bullet('Analytics: calls per day, peak hours heatmap, sentiment trends'),
  bullet('Agent management: create, pause, edit, or delete AI agents'),
  bullet('Notification center: missed calls, new bookings, new leads'),
  bullet('Billing portal: upgrade/downgrade plans, view invoices'),
  spacer(1),
  h('Supported Verticals (MVP)', HeadingLevel.HEADING_2, BLUE),
  table([
    headerRow([{ text: 'Vertical', width: 25 }, { text: 'Primary Use Case', width: 40 }, { text: 'Key Capability', width: 35 }]),
    new TableRow({ children: [
      cell('🍽️  Restaurant', { bold: true }),
      cell('Table reservation booking'),
      cell('Collects party size, date, time, name, contact'),
    ]}),
    new TableRow({ children: [
      cell('🏋️  Gym / Fitness', { bold: true }),
      cell('Membership inquiries & trial booking'),
      cell('Qualifies leads, books free trial sessions'),
    ]}),
  ]),
  spacer(1),
  new Paragraph({ children: [new PageBreak()] }),
]

// ─── SECTION 4: MARKET OPPORTUNITY ────────────────────────────────────────
const section4 = [
  h('4. Market Opportunity', HeadingLevel.HEADING_1),
  divider(),
  spacer(1),
  table([
    headerRow([{ text: 'Market Segment', width: 40 }, { text: 'Size / Data Point', width: 60 }]),
    new TableRow({ children: [
      cell('Restaurants in the US', { shade: GRAY_LT }),
      cell('1,000,000+ establishments — 73% miss calls during peak hours'),
    ]}),
    new TableRow({ children: [
      cell('Gyms & Fitness Studios in the US', { shade: GRAY_LT }),
      cell('41,000+ gyms — average lose 15+ leads/week to unanswered calls'),
    ]}),
    new TableRow({ children: [
      cell('Global AI Call Center Market', { shade: GRAY_LT }),
      cell('$7.5B by 2027 — CAGR of 21.3%'),
    ]}),
    new TableRow({ children: [
      cell('US SMB Annual Loss (Missed Calls)', { shade: GRAY_LT }),
      cell('$75 billion estimated revenue loss'),
    ]}),
    new TableRow({ children: [
      cell('Average Human Receptionist Cost', { shade: GRAY_LT }),
      cell('$2,500–$4,000/month salary + benefits + turnover'),
    ]}),
    new TableRow({ children: [
      cell('RingPilot vs. Human Receptionist', { shade: GRAY_LT }),
      cell('83–94% cost savings for businesses ($149–$599 vs. $3,000+)'),
    ]}),
  ]),
  spacer(2),
  h('Revenue Projection (Conservative)', HeadingLevel.HEADING_2, BLUE),
  table([
    headerRow([{ text: 'Milestone', width: 30 }, { text: 'Customers', width: 20 }, { text: 'Avg Plan', width: 20 }, { text: 'Monthly ARR', width: 30 }]),
    new TableRow({ children: [
      cell('Month 3 (Launch)', { shade: GRAY_LT }),
      cell('20', { center: true, shade: GRAY_LT }),
      cell('Starter $149', { shade: GRAY_LT }),
      cell('$2,980 / month', { bold: true, shade: GRAY_LT }),
    ]}),
    new TableRow({ children: [
      cell('Month 6'),
      cell('75', { center: true }),
      cell('$200 avg'),
      cell('$15,000 / month', { bold: true }),
    ]}),
    new TableRow({ children: [
      cell('Month 12', { shade: GRAY_LT }),
      cell('200', { center: true, shade: GRAY_LT }),
      cell('$250 avg', { shade: GRAY_LT }),
      cell('$50,000 / month', { bold: true, shade: BLUE_LT, color: BLUE }),
    ]}),
  ]),
  spacer(1),
  new Paragraph({ children: [new PageBreak()] }),
]

// ─── SECTION 5: PRICING ────────────────────────────────────────────────────
const section5 = [
  h('5. Pricing Model', HeadingLevel.HEADING_1),
  divider(),
  spacer(1),
  p('RingPilot uses a tiered SaaS subscription model. All plans include a dedicated AI phone number, call transcripts, sentiment analysis, and the full dashboard.'),
  spacer(1),
  table([
    headerRow([
      { text: 'Plan', width: 15 },
      { text: 'Monthly Price', width: 18 },
      { text: 'Call Limit', width: 17 },
      { text: 'AI Agents', width: 15 },
      { text: 'Best For', width: 35 },
    ]),
    new TableRow({ children: [
      cell('Starter', { bold: true }),
      cell('$149 / mo', { bold: true, color: BLUE }),
      cell('500 calls'),
      cell('1 agent'),
      cell('Single-location restaurant or gym'),
    ]}),
    new TableRow({ children: [
      cell('Pro', { bold: true, shade: BLUE_LT }),
      cell('$299 / mo', { bold: true, color: BLUE, shade: BLUE_LT }),
      cell('2,000 calls', { shade: BLUE_LT }),
      cell('3 agents', { shade: BLUE_LT }),
      cell('Growing business with multiple lines', { shade: BLUE_LT }),
    ]}),
    new TableRow({ children: [
      cell('Agency', { bold: true }),
      cell('$599 / mo', { bold: true, color: BLUE }),
      cell('Unlimited'),
      cell('Unlimited'),
      cell('Agencies managing multiple client businesses'),
    ]}),
  ]),
  spacer(1),
  p('14-day free trial on all plans. No credit card required. Cancel anytime.', { italic: true, color: '6B7280' }),
  spacer(1),
  new Paragraph({ children: [new PageBreak()] }),
]

// ─── SECTION 6: TEAM STRUCTURE ─────────────────────────────────────────────
const section6 = [
  h('6. Project Team Structure', HeadingLevel.HEADING_1),
  divider(),
  spacer(1),
  p('RingPilot will be built by a focused 5-person team over 3 months (12 weeks) without reliance on AI coding tools — all code written by hand by experienced developers.'),
  spacer(1),
  table([
    headerRow([
      { text: 'Role', width: 30 },
      { text: 'Count', width: 10 },
      { text: 'Responsibilities', width: 60 },
    ]),
    new TableRow({ children: [
      cell('Backend Developer', { bold: true, shade: GRAY_LT }),
      cell('3', { center: true, bold: true, shade: GRAY_LT }),
      cell('API routes, Supabase schema & RLS, Retell AI integration, Twilio webhooks, Stripe billing, Resend email, performance & security', { shade: GRAY_LT }),
    ]}),
    new TableRow({ children: [
      cell('Frontend Developer', { bold: true }),
      cell('1', { center: true, bold: true }),
      cell('Next.js App Router, React components, dashboard UI, onboarding wizard, real-time updates, responsive design'),
    ]}),
    new TableRow({ children: [
      cell('UI/UX Designer', { bold: true, shade: GRAY_LT }),
      cell('1', { center: true, bold: true, shade: GRAY_LT }),
      cell('Wireframes, design system, component library, landing page design, user flow prototyping, Figma handoff', { shade: GRAY_LT }),
    ]}),
  ]),
  spacer(2),
  h('Backend Developer Responsibilities (Breakdown)', HeadingLevel.HEADING_3, BLUE),
  bullet('Backend Dev 1 — Core API & Auth: Supabase auth, middleware, user management, agent CRUD, plan enforcement'),
  bullet('Backend Dev 2 — Integrations: Retell AI REST API, Twilio number provisioning, webhook handler (call events)'),
  bullet('Backend Dev 3 — Billing & Email: Stripe checkout/webhook/portal, Resend transactional emails, analytics API'),
  spacer(1),
  h('Frontend Developer Responsibilities', HeadingLevel.HEADING_3, BLUE),
  bullet('All React/Next.js pages: landing, auth, dashboard, agents, calls, analytics, billing, settings'),
  bullet('5-step onboarding wizard with validation and API integration'),
  bullet('Real-time notification bell, call transcript viewer, charts'),
  spacer(1),
  h('UI/UX Designer Responsibilities', HeadingLevel.HEADING_3, BLUE),
  bullet('User research and competitor analysis (Week 1)'),
  bullet('Wireframes for all 15+ pages and flows (Week 1–2)'),
  bullet('High-fidelity Figma designs with RingPilot brand system (Week 2–4)'),
  bullet('Design tokens, component library, responsive breakpoints'),
  bullet('Ongoing design QA and refinement through development'),
  spacer(1),
  new Paragraph({ children: [new PageBreak()] }),
]

// ─── SECTION 7: DEVELOPMENT TIMELINE ──────────────────────────────────────
const section7 = [
  h('7. Development Timeline (12 Weeks)', HeadingLevel.HEADING_1),
  divider(),
  spacer(1),
  table([
    headerRow([
      { text: 'Phase', width: 8 },
      { text: 'Weeks', width: 12 },
      { text: 'Work Items', width: 55 },
      { text: 'Deliverable', width: 25 },
    ]),
    new TableRow({ children: [
      cell('1', { center: true, bold: true, shade: BLUE_LT, color: BLUE }),
      cell('1–2', { center: true, shade: BLUE_LT }),
      cell('Project setup, tech stack, DB schema, design system, wireframes, Supabase + Retell + Stripe accounts setup', { shade: BLUE_LT }),
      cell('Foundation ready', { shade: BLUE_LT }),
    ]}),
    new TableRow({ children: [
      cell('2', { center: true, bold: true }),
      cell('3–4', { center: true }),
      cell('Auth (login/signup/OAuth), middleware, types, Supabase client, all lib helpers (stripe, retell, resend, utils)'),
      cell('Auth + backend libs'),
    ]}),
    new TableRow({ children: [
      cell('3', { center: true, bold: true, shade: BLUE_LT, color: BLUE }),
      cell('5–6', { center: true, shade: BLUE_LT }),
      cell('Landing page, restaurant/gym vertical pages, pricing page — all public-facing marketing pages', { shade: BLUE_LT }),
      cell('Public website live', { shade: BLUE_LT }),
    ]}),
    new TableRow({ children: [
      cell('4', { center: true, bold: true }),
      cell('7–8', { center: true }),
      cell('Dashboard shell, sidebar nav, agent list/detail/settings pages, 5-step onboarding wizard, calls log page'),
      cell('Dashboard functional'),
    ]}),
    new TableRow({ children: [
      cell('5', { center: true, bold: true, shade: BLUE_LT, color: BLUE }),
      cell('9–10', { center: true, shade: BLUE_LT }),
      cell('All API routes (agents, calls, retell webhook, stripe checkout/webhook/portal, dashboard stats, notifications), Retell + Twilio live integration', { shade: BLUE_LT }),
      cell('Full integration', { shade: BLUE_LT }),
    ]}),
    new TableRow({ children: [
      cell('6', { center: true, bold: true }),
      cell('11–12', { center: true }),
      cell('Analytics page, notification bell, error boundaries, QA testing, bug fixes, security audit, performance optimization, deployment to Vercel'),
      cell('Production launch'),
    ]}),
  ]),
  spacer(2),
  h('Key Milestones', HeadingLevel.HEADING_3, BLUE),
  table([
    headerRow([{ text: 'Milestone', width: 50 }, { text: 'Target Date', width: 25 }, { text: 'Owner', width: 25 }]),
    new TableRow({ children: [cell('Design system + wireframes complete'), cell('End of Week 2'), cell('UI/UX Designer')] }),
    new TableRow({ children: [cell('Auth + DB live on Supabase', {}), cell('End of Week 4', {}), cell('Backend Dev 1', {})] }),
    new TableRow({ children: [cell('Public landing page deployed'), cell('End of Week 6'), cell('Frontend Dev')] }),
    new TableRow({ children: [cell('Retell AI first call end-to-end test', {}), cell('End of Week 8', {}), cell('Backend Dev 2', {})] }),
    new TableRow({ children: [cell('Stripe billing fully functional'), cell('End of Week 10'), cell('Backend Dev 3')] }),
    new TableRow({ children: [cell('Full QA pass + production deployment', {}), cell('End of Week 12', {}), cell('All Team', {})] }),
  ]),
  spacer(1),
  new Paragraph({ children: [new PageBreak()] }),
]

// ─── SECTION 8: BUDGET BREAKDOWN ──────────────────────────────────────────
const section8 = [
  h('8. Budget Breakdown', HeadingLevel.HEADING_1),
  divider(),
  spacer(1),
  new Paragraph({
    spacing: { before: 100, after: 200 },
    children: [
      new TextRun({ text: 'Total Project Budget: ', bold: true, size: 28, color: GRAY, font: 'Calibri' }),
      new TextRun({ text: '$12,000 USD', bold: true, size: 28, color: BLUE, font: 'Calibri' }),
      new TextRun({ text: '    |    Production Cost: ', bold: true, size: 28, color: GRAY, font: 'Calibri' }),
      new TextRun({ text: '$7,000 USD', bold: true, size: 28, color: GREEN, font: 'Calibri' }),
      new TextRun({ text: '    |    Timeline: ', bold: true, size: 28, color: GRAY, font: 'Calibri' }),
      new TextRun({ text: '3 Months', bold: true, size: 28, color: AMBER, font: 'Calibri' }),
    ],
  }),

  h('A. Production Cost — Human Resource ($7,000)', HeadingLevel.HEADING_2, GREEN),
  p('All code is written manually by dedicated developers. No AI coding tools (GitHub Copilot, ChatGPT, etc.) are used. This reflects authentic development cost and intellectual property ownership.'),
  spacer(1),
  table([
    headerRow([
      { text: 'Role', width: 30 },
      { text: 'Count', width: 10 },
      { text: 'Rate / Month', width: 20 },
      { text: 'Months', width: 15 },
      { text: 'Total', width: 25 },
    ]),
    new TableRow({ children: [
      cell('Backend Developer', { shade: GRAY_LT }),
      cell('3', { center: true, shade: GRAY_LT }),
      cell('$467 / month', { shade: GRAY_LT }),
      cell('3', { center: true, shade: GRAY_LT }),
      cell('$4,200', { bold: true, shade: GRAY_LT }),
    ]}),
    new TableRow({ children: [
      cell('Frontend Developer'),
      cell('1', { center: true }),
      cell('$500 / month'),
      cell('3', { center: true }),
      cell('$1,500', { bold: true }),
    ]}),
    new TableRow({ children: [
      cell('UI/UX Designer', { shade: GRAY_LT }),
      cell('1', { center: true, shade: GRAY_LT }),
      cell('$433 / month', { shade: GRAY_LT }),
      cell('3', { center: true, shade: GRAY_LT }),
      cell('$1,300', { bold: true, shade: GRAY_LT }),
    ]}),
    new TableRow({ children: [
      cell('TOTAL PRODUCTION COST', { bold: true, shade: GREEN_LT, color: GREEN }),
      cell('5', { center: true, bold: true, shade: GREEN_LT }),
      cell('', { shade: GREEN_LT }),
      cell('3 months', { center: true, shade: GREEN_LT }),
      cell('$7,000', { bold: true, shade: GREEN_LT, color: GREEN }),
    ]}),
  ]),
  spacer(2),

  h('B. Non-Production Cost ($5,000)', HeadingLevel.HEADING_2, AMBER),
  table([
    headerRow([
      { text: 'Category', width: 40 },
      { text: 'Details', width: 40 },
      { text: 'Amount', width: 20 },
    ]),
    new TableRow({ children: [
      cell('Cloud Infrastructure', { shade: AMBER_LT }),
      cell('Vercel Pro, Supabase Pro (3 months), domain name', { shade: AMBER_LT }),
      cell('$600', { bold: true, shade: AMBER_LT }),
    ]}),
    new TableRow({ children: [
      cell('Third-Party API Credits'),
      cell('Retell AI usage, Twilio phone number + minutes, Resend email'),
      cell('$500', { bold: true }),
    ]}),
    new TableRow({ children: [
      cell('Design Tools', { shade: AMBER_LT }),
      cell('Figma Professional license (3 months)', { shade: AMBER_LT }),
      cell('$135', { bold: true, shade: AMBER_LT }),
    ]}),
    new TableRow({ children: [
      cell('QA & Testing'),
      cell('Manual QA across browsers, load testing, security audit'),
      cell('$365', { bold: true }),
    ]}),
    new TableRow({ children: [
      cell('Project Management', { shade: AMBER_LT }),
      cell('Coordination, client updates, documentation, sprint planning', { shade: AMBER_LT }),
      cell('$500', { bold: true, shade: AMBER_LT }),
    ]}),
    new TableRow({ children: [
      cell('Legal & IP'),
      cell('Terms of service, privacy policy, NDA templates'),
      cell('$200', { bold: true }),
    ]}),
    new TableRow({ children: [
      cell('Contingency Reserve', { shade: AMBER_LT }),
      cell('Buffer for unexpected issues, integration delays, revisions', { shade: AMBER_LT }),
      cell('$700', { bold: true, shade: AMBER_LT }),
    ]}),
    new TableRow({ children: [
      cell('Company Margin / Profit'),
      cell('Business overhead, sales, account management, support setup'),
      cell('$2,000', { bold: true }),
    ]}),
    new TableRow({ children: [
      cell('TOTAL NON-PRODUCTION', { bold: true, shade: AMBER_LT, color: AMBER }),
      cell('', { shade: AMBER_LT }),
      cell('$5,000', { bold: true, shade: AMBER_LT, color: AMBER }),
    ]}),
  ]),
  spacer(2),

  h('C. Budget Summary', HeadingLevel.HEADING_2, BLUE),
  table([
    headerRow([{ text: 'Cost Category', width: 60 }, { text: 'Amount', width: 20 }, { text: '% of Budget', width: 20 }]),
    new TableRow({ children: [
      cell('Production Cost (Human Resources)', { shade: GREEN_LT }),
      cell('$7,000', { bold: true, shade: GREEN_LT, color: GREEN }),
      cell('58.3%', { center: true, shade: GREEN_LT }),
    ]}),
    new TableRow({ children: [
      cell('Cloud & API Infrastructure'),
      cell('$1,100', { bold: true }),
      cell('9.2%', { center: true }),
    ]}),
    new TableRow({ children: [
      cell('Tools, QA & Legal', { shade: GRAY_LT }),
      cell('$700', { bold: true, shade: GRAY_LT }),
      cell('5.8%', { center: true, shade: GRAY_LT }),
    ]}),
    new TableRow({ children: [
      cell('Project Management & Contingency'),
      cell('$1,200', { bold: true }),
      cell('10.0%', { center: true }),
    ]}),
    new TableRow({ children: [
      cell('Company Margin', { shade: GRAY_LT }),
      cell('$2,000', { bold: true, shade: GRAY_LT }),
      cell('16.7%', { center: true, shade: GRAY_LT }),
    ]}),
    new TableRow({ children: [
      cell('TOTAL PROJECT BUDGET', { bold: true, shade: BLUE_LT, color: BLUE }),
      cell('$12,000', { bold: true, shade: BLUE_LT, color: BLUE }),
      cell('100%', { center: true, bold: true, shade: BLUE_LT, color: BLUE }),
    ]}),
  ]),
  spacer(1),
  new Paragraph({ children: [new PageBreak()] }),
]

// ─── SECTION 9: ROI FOR CLIENT ─────────────────────────────────────────────
const section9 = [
  h('9. Return on Investment for the Client', HeadingLevel.HEADING_1),
  divider(),
  spacer(1),
  p('For the business owner investing $12,000 in RingPilot, the SaaS model provides extremely compelling economics:'),
  spacer(1),
  table([
    headerRow([{ text: 'Metric', width: 50 }, { text: 'Value', width: 50 }]),
    new TableRow({ children: [
      cell('Break-even point (at 80 customers @ $149/mo)', { shade: GRAY_LT }),
      cell('Month 5–6 post-launch', { bold: true, shade: GRAY_LT }),
    ]}),
    new TableRow({ children: [
      cell('Monthly recurring revenue at 200 customers'),
      cell('$30,000–$50,000 / month', { bold: true, color: GREEN }),
    ]}),
    new TableRow({ children: [
      cell('Customer acquisition cost (estimated)', { shade: GRAY_LT }),
      cell('$50–$150 per customer (outbound + local SEO)', { shade: GRAY_LT }),
    ]}),
    new TableRow({ children: [
      cell('Average customer LTV (12-month retention)'),
      cell('$1,800–$7,200 per customer', { bold: true }),
    ]}),
    new TableRow({ children: [
      cell('Gross margin (per subscription)', { shade: GRAY_LT }),
      cell('~70–80% after API costs', { shade: GRAY_LT }),
    ]}),
    new TableRow({ children: [
      cell('Development cost vs. 1-year revenue potential'),
      cell('$12,000 → $360,000–$600,000 ARR potential', { bold: true, color: BLUE }),
    ]}),
  ]),
  spacer(2),
  h('Value to End Businesses (RingPilot\'s Customers)', HeadingLevel.HEADING_2, BLUE),
  table([
    headerRow([{ text: 'Comparison', width: 40 }, { text: 'Human Receptionist', width: 30 }, { text: 'RingPilot AI', width: 30 }]),
    new TableRow({ children: [
      cell('Monthly Cost', { shade: GRAY_LT }),
      cell('$2,500–$4,000', { shade: RED_LT, bold: true, color: RED }),
      cell('$149–$599', { shade: GREEN_LT, bold: true, color: GREEN }),
    ]}),
    new TableRow({ children: [
      cell('Availability'),
      cell('8 hrs/day, 5 days/week'),
      cell('24/7/365', { bold: true, color: GREEN }),
    ]}),
    new TableRow({ children: [
      cell('Missed Call Rate', { shade: GRAY_LT }),
      cell('High during peak hours', { shade: RED_LT, color: RED }),
      cell('0% — every call answered', { shade: GREEN_LT, color: GREEN }),
    ]}),
    new TableRow({ children: [
      cell('Call Transcript/Summary'),
      cell('None'),
      cell('Automatic, searchable', { bold: true, color: GREEN }),
    ]}),
    new TableRow({ children: [
      cell('Setup Time', { shade: GRAY_LT }),
      cell('2–4 weeks hiring', { shade: RED_LT, color: RED }),
      cell('10 minutes', { shade: GREEN_LT, color: GREEN }),
    ]}),
    new TableRow({ children: [
      cell('Annual Savings'),
      cell('Baseline'),
      cell('$27,600–$41,400/year saved', { bold: true, color: GREEN }),
    ]}),
  ]),
  spacer(1),
  new Paragraph({ children: [new PageBreak()] }),
]

// ─── SECTION 10: TECH STACK ────────────────────────────────────────────────
const section10 = [
  h('10. Technology Stack', HeadingLevel.HEADING_1),
  divider(),
  spacer(1),
  table([
    headerRow([{ text: 'Layer', width: 25 }, { text: 'Technology', width: 25 }, { text: 'Purpose', width: 50 }]),
    new TableRow({ children: [
      cell('Frontend Framework', { shade: GRAY_LT }),
      cell('Next.js 14 (App Router)', { bold: true, shade: GRAY_LT }),
      cell('Full-stack React framework, SSR, API routes, file-based routing', { shade: GRAY_LT }),
    ]}),
    new TableRow({ children: [
      cell('Language'),
      cell('TypeScript', { bold: true }),
      cell('Type safety, reduced bugs, better IDE support'),
    ]}),
    new TableRow({ children: [
      cell('Styling', { shade: GRAY_LT }),
      cell('Tailwind CSS + shadcn/ui', { bold: true, shade: GRAY_LT }),
      cell('Utility-first CSS, pre-built accessible components', { shade: GRAY_LT }),
    ]}),
    new TableRow({ children: [
      cell('Database + Auth'),
      cell('Supabase (PostgreSQL)', { bold: true }),
      cell('Managed DB, Row Level Security, real-time, auth with OAuth'),
    ]}),
    new TableRow({ children: [
      cell('AI Voice Platform', { shade: GRAY_LT }),
      cell('Retell AI', { bold: true, shade: GRAY_LT }),
      cell('AI voice agents, phone number provisioning, call webhooks', { shade: GRAY_LT }),
    ]}),
    new TableRow({ children: [
      cell('Telephony'),
      cell('Twilio (via Retell)', { bold: true }),
      cell('PSTN phone numbers, call routing, SIP trunking'),
    ]}),
    new TableRow({ children: [
      cell('Payments', { shade: GRAY_LT }),
      cell('Stripe', { bold: true, shade: GRAY_LT }),
      cell('Subscription billing, checkout, customer portal, webhooks', { shade: GRAY_LT }),
    ]}),
    new TableRow({ children: [
      cell('Email'),
      cell('Resend', { bold: true }),
      cell('Transactional emails — welcome, call summaries, upgrade alerts'),
    ]}),
    new TableRow({ children: [
      cell('Deployment', { shade: GRAY_LT }),
      cell('Vercel', { bold: true, shade: GRAY_LT }),
      cell('Edge network, automatic HTTPS, CI/CD, serverless functions', { shade: GRAY_LT }),
    ]}),
  ]),
  spacer(1),
  new Paragraph({ children: [new PageBreak()] }),
]

// ─── SECTION 11: COMPETITIVE ADVANTAGE ────────────────────────────────────
const section11 = [
  h('11. Competitive Landscape', HeadingLevel.HEADING_1),
  divider(),
  spacer(1),
  table([
    headerRow([
      { text: 'Competitor', width: 22 },
      { text: 'Price', width: 15 },
      { text: 'Weakness', width: 33 },
      { text: 'RingPilot Advantage', width: 30 },
    ]),
    new TableRow({ children: [
      cell('Answering Service (Human)', { shade: GRAY_LT }),
      cell('$300–$800/mo', { shade: GRAY_LT }),
      cell('Slow, inconsistent, business hours only, expensive', { shade: GRAY_LT }),
      cell('24/7 AI, instant, 83% cheaper', { shade: GREEN_LT }),
    ]}),
    new TableRow({ children: [
      cell('Bland AI / Vapi'),
      cell('$0.09/min'),
      cell('Developer-focused, no SMB onboarding, no dashboard'),
      cell('10-min setup, no-code, SMB-optimized', { shade: GREEN_LT }),
    ]}),
    new TableRow({ children: [
      cell('Aloware / JustCall', { shade: GRAY_LT }),
      cell('$29–$99/mo', { shade: GRAY_LT }),
      cell('General CRM tools, not AI voice, steep learning curve', { shade: GRAY_LT }),
      cell('Purpose-built for restaurants & gyms', { shade: GREEN_LT }),
    ]}),
    new TableRow({ children: [
      cell('OpenPhone / Grasshopper'),
      cell('$15–$40/mo'),
      cell('Call forwarding only — no AI, no automation'),
      cell('Full AI conversation handling + bookings', { shade: GREEN_LT }),
    ]}),
  ]),
  spacer(2),
  h('RingPilot\'s Moat', HeadingLevel.HEADING_2, BLUE),
  bullet('Vertical-specific AI prompts trained for restaurant + gym workflows'),
  bullet('Turnkey setup — provisioned phone number in 10 minutes'),
  bullet('Full-stack ownership — not dependent on expensive third-party CRM platforms'),
  bullet('Network effects — more call data → better AI performance → better outcomes'),
  spacer(1),
  new Paragraph({ children: [new PageBreak()] }),
]

// ─── SECTION 12: NEXT STEPS / CTA ─────────────────────────────────────────
const section12 = [
  h('12. Next Steps', HeadingLevel.HEADING_1),
  divider(),
  spacer(1),
  table([
    headerRow([{ text: 'Step', width: 10 }, { text: 'Action', width: 45 }, { text: 'Timeline', width: 25 }, { text: 'Owner', width: 20 }]),
    new TableRow({ children: [
      cell('1', { center: true, bold: true, shade: BLUE_LT, color: BLUE }),
      cell('Sign project agreement and NDA'),
      cell('Day 1'),
      cell('Client + Team'),
    ]}),
    new TableRow({ children: [
      cell('2', { center: true, bold: true, shade: BLUE_LT, color: BLUE }),
      cell('50% upfront payment ($6,000) to initiate development'),
      cell('Day 1–2'),
      cell('Client'),
    ]}),
    new TableRow({ children: [
      cell('3', { center: true, bold: true, shade: BLUE_LT, color: BLUE }),
      cell('Kickoff meeting — finalize requirements, access credentials, accounts'),
      cell('Day 3'),
      cell('All Parties'),
    ]}),
    new TableRow({ children: [
      cell('4', { center: true, bold: true, shade: BLUE_LT, color: BLUE }),
      cell('Development begins — weekly progress reports'),
      cell('Week 1'),
      cell('Dev Team'),
    ]}),
    new TableRow({ children: [
      cell('5', { center: true, bold: true, shade: BLUE_LT, color: BLUE }),
      cell('Milestone review and 50% balance payment ($6,000)'),
      cell('Week 8'),
      cell('Client'),
    ]}),
    new TableRow({ children: [
      cell('6', { center: true, bold: true, shade: BLUE_LT, color: BLUE }),
      cell('Final delivery, deployment, handoff documentation, and training'),
      cell('Week 12'),
      cell('All Parties'),
    ]}),
  ]),
  spacer(2),
  h('Payment Terms', HeadingLevel.HEADING_3, BLUE),
  bullet('50% upfront ($6,000) — project kickoff'),
  bullet('50% on delivery ($6,000) — after Week 12 final handoff'),
  bullet('30-day post-launch support included at no additional cost'),
  spacer(2),
  divider(),
  spacer(1),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 100 },
    children: [new TextRun({ text: 'Ready to never miss a call again?', bold: true, size: 28, color: BLUE, font: 'Calibri' })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 200 },
    children: [new TextRun({ text: 'Contact us to schedule a demo or begin the project immediately.', size: 22, color: GRAY, font: 'Calibri' })],
  }),
  spacer(2),
]

// ══════════════════════════════════════════════════════════════════════════
// ASSEMBLE DOCUMENT
// ══════════════════════════════════════════════════════════════════════════
const doc = new Document({
  numbering: {
    config: [{
      reference: 'bullet-list',
      levels: [{
        level: 0,
        format: 'bullet',
        text: '•',
        alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 360, hanging: 360 } } },
      }],
    }],
  },
  sections: [{
    properties: { page: { margin: { top: 1080, bottom: 1080, left: 1200, right: 1200 } } },
    children: [
      ...coverPage,
      ...section1,
      ...section2,
      ...section3,
      ...section4,
      ...section5,
      ...section6,
      ...section7,
      ...section8,
      ...section9,
      ...section10,
      ...section11,
      ...section12,
    ],
  }],
})

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync('D:/my startup/RingPilot-Client-Pitch.docx', buf)
  console.log('✅ Generated: D:/my startup/RingPilot-Client-Pitch.docx')
}).catch(err => {
  console.error('❌ Error:', err.message)
})
