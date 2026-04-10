const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, PageBreak, TableOfContents,
  LevelFormat
} = require('C:/Users/pc/AppData/Roaming/npm/node_modules/docx');
const fs = require('fs');

// ── Colours ──────────────────────────────────────────────────────────────────
const BLUE      = "1E3A5F";   // dark navy
const ACCENT    = "2563EB";   // vivid blue
const LIGHT_BG  = "EFF6FF";   // very light blue
const MID_BG    = "DBEAFE";   // table header blue
const GRAY_BG   = "F8FAFC";   // alt row
const WHITE     = "FFFFFF";
const DARK_TEXT = "1E293B";
const MID_TEXT  = "475569";
const BORDER_C  = "CBD5E1";

// ── Border helpers ────────────────────────────────────────────────────────────
const cell_border = (color = BORDER_C) => ({
  top:    { style: BorderStyle.SINGLE, size: 1, color },
  bottom: { style: BorderStyle.SINGLE, size: 1, color },
  left:   { style: BorderStyle.SINGLE, size: 1, color },
  right:  { style: BorderStyle.SINGLE, size: 1, color },
});

// ── Text helpers ──────────────────────────────────────────────────────────────
const run = (text, opts = {}) => new TextRun({ text, font: "Arial", color: DARK_TEXT, ...opts });
const bold_run = (text, opts = {}) => run(text, { bold: true, ...opts });
const accent_run = (text, opts = {}) => run(text, { color: ACCENT, bold: true, ...opts });

const para = (children, opts = {}) => new Paragraph({
  children: Array.isArray(children) ? children : [children],
  ...opts,
});

const h1 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  children: [new TextRun({ text, font: "Arial", bold: true, size: 36, color: BLUE })],
  spacing: { before: 400, after: 160 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: ACCENT, space: 4 } },
});

const h2 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  children: [new TextRun({ text, font: "Arial", bold: true, size: 28, color: ACCENT })],
  spacing: { before: 300, after: 120 },
});

const h3 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_3,
  children: [new TextRun({ text, font: "Arial", bold: true, size: 24, color: MID_TEXT })],
  spacing: { before: 200, after: 80 },
});

const body = (text, opts = {}) => para(
  [run(text, { size: 22 })],
  { spacing: { before: 60, after: 60 }, ...opts }
);

const spacer = (lines = 1) => para(
  [run("", { size: 22 })],
  { spacing: { before: 0, after: lines * 120 } }
);

const bullet_item = (text, ref = "bullets") => new Paragraph({
  numbering: { reference: ref, level: 0 },
  children: [run(text, { size: 22 })],
  spacing: { before: 40, after: 40 },
});

const code_line = (text) => para(
  [new TextRun({ text, font: "Courier New", size: 18, color: "1E3A5F" })],
  {
    spacing: { before: 20, after: 20 },
    indent: { left: 360 },
    shading: { fill: "F1F5F9", type: ShadingType.CLEAR },
  }
);

// ── Cell helpers ──────────────────────────────────────────────────────────────
const hdr_cell = (text, width) => new TableCell({
  borders: cell_border(ACCENT),
  width: { size: width, type: WidthType.DXA },
  shading: { fill: MID_BG, type: ShadingType.CLEAR },
  margins: { top: 100, bottom: 100, left: 140, right: 140 },
  verticalAlign: VerticalAlign.CENTER,
  children: [para([bold_run(text, { size: 20, color: BLUE })], { alignment: AlignmentType.CENTER })],
});

const data_cell = (text, width, fill = WHITE, bold = false, align = AlignmentType.LEFT) => new TableCell({
  borders: cell_border(BORDER_C),
  width: { size: width, type: WidthType.DXA },
  shading: { fill, type: ShadingType.CLEAR },
  margins: { top: 80, bottom: 80, left: 140, right: 140 },
  verticalAlign: VerticalAlign.CENTER,
  children: [para(bold ? [bold_run(text, { size: 20 })] : [run(text, { size: 20 })], { alignment: align })],
});

// ── Cover page ────────────────────────────────────────────────────────────────
const cover_page = [
  spacer(4),
  para([new TextRun({ text: "RINGPILOT", font: "Arial", bold: true, size: 80, color: BLUE })],
    { alignment: AlignmentType.CENTER }),
  spacer(1),
  para([new TextRun({ text: "AI Receptionist for Restaurants & Gyms", font: "Arial", size: 36, color: ACCENT })],
    { alignment: AlignmentType.CENTER }),
  spacer(1),
  para([new TextRun({ text: "Your AI receptionist. Never misses a call.", font: "Arial", size: 28, color: MID_TEXT, italics: true })],
    { alignment: AlignmentType.CENTER }),
  spacer(3),
  para([new TextRun({ text: "Product Structure Document", font: "Arial", size: 24, color: MID_TEXT })],
    { alignment: AlignmentType.CENTER }),
  spacer(1),
  para([new TextRun({ text: "Version 1.0  |  March 2026", font: "Arial", size: 22, color: MID_TEXT })],
    { alignment: AlignmentType.CENTER }),
  spacer(1),
  para([new TextRun({ text: "Confidential — Internal Use Only", font: "Arial", size: 20, color: "94A3B8", italics: true })],
    { alignment: AlignmentType.CENTER }),
  para([new PageBreak()]),
];

// ── TOC page ──────────────────────────────────────────────────────────────────
const toc_page = [
  h1("Table of Contents"),
  new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-3" }),
  para([new PageBreak()]),
];

// ── Section 1: Product Overview ───────────────────────────────────────────────
const sec1 = [
  h1("1. Product Overview"),
  h2("What Is RingPilot?"),
  body("RingPilot is a Software-as-a-Service (SaaS) platform that provides AI-powered voice agents for small business owners. It eliminates missed calls, lost reservations, and unanswered lead inquiries by deploying an intelligent AI receptionist that answers the phone 24/7 — in the business owner's tone, with their exact information."),
  spacer(),
  h2("How It Works"),
  bullet_item("Owner signs up at ringpilot.com in under 2 minutes"),
  bullet_item("Selects their business vertical: Restaurant or Gym"),
  bullet_item("Answers 5 simple setup questions (name, hours, special instructions)"),
  bullet_item("Receives a dedicated AI phone number instantly"),
  bullet_item("Updates their Google Maps listing with the new number"),
  bullet_item("AI is live and answering calls — within 10 minutes total"),
  spacer(),
  h2("Who It's For"),
  body("RingPilot targets owner-operated small businesses in the USA and Europe with 1–20 staff. These owners are non-technical, time-poor, and losing revenue daily from missed calls. They are not looking for infrastructure — they are buying outcomes."),
  spacer(),
  h2("Core Value Proposition"),

  // Value prop table
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [4680, 4680],
    rows: [
      new TableRow({ children: [hdr_cell("Problem", 4680), hdr_cell("RingPilot Solution", 4680)] }),
      new TableRow({ children: [data_cell("Calls missed during busy hours", 4680, GRAY_BG), data_cell("AI answers every call, every time", 4680, GRAY_BG)] }),
      new TableRow({ children: [data_cell("Leads lost after closing hours", 4680), data_cell("24/7 coverage, no overtime", 4680)] }),
      new TableRow({ children: [data_cell("Hiring & training a receptionist", 4680, GRAY_BG), data_cell("Flat monthly fee, no HR headache", 4680, GRAY_BG)] }),
      new TableRow({ children: [data_cell("No call record or follow-up system", 4680), data_cell("Full transcripts + summaries in dashboard", 4680)] }),
    ],
  }),
  spacer(2),
  para([new PageBreak()]),
];

// ── Section 2: Tech Stack ─────────────────────────────────────────────────────
const sec2 = [
  h1("2. Tech Stack"),
  body("RingPilot is built on a modern, serverless-first stack optimised for rapid development with AI coding tools (Claude Code + Cursor)."),
  spacer(),

  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2600, 3200, 3560],
    rows: [
      new TableRow({ children: [hdr_cell("Layer", 2600), hdr_cell("Technology", 3200), hdr_cell("Purpose", 3560)] }),
      new TableRow({ children: [data_cell("Frontend", 2600, GRAY_BG), data_cell("Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui", 3200, GRAY_BG), data_cell("UI, routing, server components", 3560, GRAY_BG)] }),
      new TableRow({ children: [data_cell("Backend", 2600), data_cell("Next.js API Routes (serverless)", 3200), data_cell("Business logic, webhooks, integrations", 3560)] }),
      new TableRow({ children: [data_cell("Database + Auth", 2600, GRAY_BG), data_cell("Supabase (PostgreSQL + Auth)", 3200, GRAY_BG), data_cell("Data storage, RLS, authentication", 3560, GRAY_BG)] }),
      new TableRow({ children: [data_cell("Voice AI", 2600), data_cell("Retell AI API", 3200), data_cell("Creates and manages AI voice agents", 3560)] }),
      new TableRow({ children: [data_cell("Telephony", 2600, GRAY_BG), data_cell("Twilio", 3200, GRAY_BG), data_cell("Phone numbers and call routing", 3560, GRAY_BG)] }),
      new TableRow({ children: [data_cell("Payments", 2600), data_cell("Stripe", 3200), data_cell("Subscription billing, 3 tiers", 3560)] }),
      new TableRow({ children: [data_cell("Email", 2600, GRAY_BG), data_cell("Resend", 3200, GRAY_BG), data_cell("Transactional emails (welcome, receipts)", 3560, GRAY_BG)] }),
      new TableRow({ children: [data_cell("Hosting", 2600), data_cell("Vercel", 3200), data_cell("Edge deployment, CI/CD", 3560)] }),
      new TableRow({ children: [data_cell("AI Dev Tools", 2600, GRAY_BG), data_cell("Claude Code + Cursor", 3200, GRAY_BG), data_cell("3-5x development speed multiplier", 3560, GRAY_BG)] }),
    ],
  }),
  spacer(2),
  para([new PageBreak()]),
];

// ── Section 3: Database Schema ────────────────────────────────────────────────
const mk_schema_table = (cols, widths) => new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: widths,
  rows: [
    new TableRow({ children: ["Column", "Type", "Description"].map((h, i) => hdr_cell(h, widths[i])) }),
    ...cols.map(([col, type, desc], idx) => new TableRow({
      children: [
        data_cell(col, widths[0], idx % 2 === 0 ? GRAY_BG : WHITE, true),
        data_cell(type, widths[1], idx % 2 === 0 ? GRAY_BG : WHITE),
        data_cell(desc, widths[2], idx % 2 === 0 ? GRAY_BG : WHITE),
      ],
    })),
  ],
});

const sec3 = [
  h1("3. Database Schema"),
  body("All tables use Supabase (PostgreSQL). Row-Level Security (RLS) is enforced on every table: users can only access rows where user_id = auth.uid()."),
  spacer(),

  h2("Table: users"),
  mk_schema_table([
    ["id", "uuid PK", "References auth.users — primary identity"],
    ["email", "text", "User email address"],
    ["full_name", "text", "Owner full name"],
    ["business_name", "text", "Name of the business"],
    ["business_type", "enum", "restaurant | gym"],
    ["phone", "text", "Owner private phone (forwarding backup)"],
    ["plan", "enum", "free | starter | pro | agency (default: free)"],
    ["stripe_customer_id", "text", "Stripe customer reference"],
    ["stripe_subscription_id", "text", "Active Stripe subscription"],
    ["trial_ends_at", "timestamp", "14-day free trial expiry"],
    ["created_at", "timestamp", "Account creation time"],
  ], [2000, 1800, 5560]),
  spacer(),

  h2("Table: agents"),
  mk_schema_table([
    ["id", "uuid PK", "Agent unique identifier"],
    ["user_id", "uuid FK", "References users.id"],
    ["name", "text", "e.g. Mario's Restaurant AI"],
    ["vertical", "enum", "restaurant | gym"],
    ["retell_agent_id", "text", "Retell AI agent ID (external)"],
    ["twilio_phone_number", "text", "AI phone number shown to owner"],
    ["voice_id", "text", "Selected ElevenLabs/Retell voice"],
    ["business_hours", "jsonb", "{mon:{open:'09:00',close:'22:00'}, ...}"],
    ["custom_instructions", "text", "Owner-provided extra AI instructions"],
    ["status", "enum", "active | paused | setup"],
    ["calls_this_month", "int", "Running call count (resets monthly)"],
    ["created_at", "timestamp", "Agent creation time"],
  ], [2200, 1800, 5360]),
  spacer(),

  h2("Table: calls"),
  mk_schema_table([
    ["id", "uuid PK", "Call record identifier"],
    ["agent_id", "uuid FK", "References agents.id"],
    ["user_id", "uuid FK", "References users.id (for fast RLS)"],
    ["call_id", "text", "Retell AI call ID (external)"],
    ["from_number", "text", "Caller phone number"],
    ["to_number", "text", "AI phone number dialled"],
    ["duration_seconds", "int", "Total call duration"],
    ["transcript", "text", "Full conversation transcript"],
    ["summary", "text", "AI-generated 1-line call summary"],
    ["action_taken", "text", "e.g. Booked reservation for 4, Friday 7pm"],
    ["recording_url", "text", "Audio recording URL (Pro+ only)"],
    ["sentiment", "enum", "positive | neutral | negative"],
    ["created_at", "timestamp", "Call timestamp"],
  ], [2400, 1800, 5160]),
  spacer(),

  h2("Table: agent_templates"),
  mk_schema_table([
    ["id", "uuid PK", "Template identifier"],
    ["vertical", "enum", "restaurant | gym"],
    ["template_name", "text", "Human-readable template name"],
    ["system_prompt", "text", "Base AI prompt for this vertical"],
    ["faq_examples", "jsonb", "Array of common Q&A pairs"],
    ["created_at", "timestamp", "Template creation time"],
  ], [2200, 1800, 5360]),
  spacer(),

  h2("Table: notifications"),
  mk_schema_table([
    ["id", "uuid PK", "Notification identifier"],
    ["user_id", "uuid FK", "References users.id"],
    ["type", "enum", "missed_call | booking | lead | system"],
    ["message", "text", "Notification body text"],
    ["read", "boolean", "False until owner views it (default: false)"],
    ["created_at", "timestamp", "Notification time"],
  ], [2200, 1800, 5360]),
  spacer(2),
  para([new PageBreak()]),
];

// ── Section 4: App Routes ─────────────────────────────────────────────────────
const route_table = (rows) => new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [3000, 6360],
  rows: [
    new TableRow({ children: [hdr_cell("Route", 3000), hdr_cell("Purpose", 6360)] }),
    ...rows.map(([route, purpose], idx) => new TableRow({
      children: [
        data_cell(route, 3000, idx % 2 === 0 ? GRAY_BG : WHITE, true),
        data_cell(purpose, 6360, idx % 2 === 0 ? GRAY_BG : WHITE),
      ],
    })),
  ],
});

const sec4 = [
  h1("4. App Routes"),
  h2("Public Routes (No Login Required)"),
  route_table([
    ["/", "Landing page — hero, features, pricing, demo video, CTA button"],
    ["/restaurant", "Restaurant-specific landing page with tailored copy and demo"],
    ["/gym", "Gym-specific landing page with tailored copy and demo"],
    ["/pricing", "Full pricing page with plan comparison table"],
    ["/login", "Login page — email/password + Google OAuth"],
    ["/signup", "Sign-up page — creates account and starts free trial"],
    ["/auth/callback", "Supabase OAuth callback handler"],
  ]),
  spacer(),
  h2("Protected Routes (Login Required)"),
  route_table([
    ["/dashboard", "Home — AI status indicator, today's call stats, quick action buttons"],
    ["/calls", "Full call log — transcripts, recordings, summaries, sentiment badges"],
    ["/agents", "List all AI agents the user has created with status indicators"],
    ["/agents/new", "5-step onboarding wizard to create a new AI agent"],
    ["/agents/[id]", "Agent detail — edit scripts, change voice, view per-agent stats"],
    ["/agents/[id]/settings", "Advanced settings — business hours, custom AI instructions"],
    ["/billing", "Subscription management — upgrade, downgrade, invoice history"],
    ["/settings", "Profile settings — name, email, notification preferences"],
  ]),
  spacer(2),
  para([new PageBreak()]),
];

// ── Section 5: API Routes ─────────────────────────────────────────────────────
const api_table = (rows) => new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [1400, 3000, 4960],
  rows: [
    new TableRow({ children: [hdr_cell("Method", 1400), hdr_cell("Endpoint", 3000), hdr_cell("Description", 4960)] }),
    ...rows.map(([method, endpoint, desc], idx) => new TableRow({
      children: [
        data_cell(method, 1400, idx % 2 === 0 ? GRAY_BG : WHITE, true, AlignmentType.CENTER),
        data_cell(endpoint, 3000, idx % 2 === 0 ? GRAY_BG : WHITE, true),
        data_cell(desc, 4960, idx % 2 === 0 ? GRAY_BG : WHITE),
      ],
    })),
  ],
});

const sec5 = [
  h1("5. API Routes"),
  h2("Agent Management"),
  api_table([
    ["POST", "/api/agents", "Create new agent — calls Retell AI + assigns Twilio number"],
    ["GET", "/api/agents", "List all agents for the authenticated user"],
    ["PATCH", "/api/agents/[id]", "Update agent name, voice, hours, or instructions"],
    ["DELETE", "/api/agents/[id]", "Delete agent and release phone number back to pool"],
  ]),
  spacer(),
  h2("Call History"),
  api_table([
    ["GET", "/api/calls", "Paginated call history with filters (date, sentiment, agent)"],
    ["GET", "/api/calls/[id]", "Single call detail — full transcript + recording URL"],
  ]),
  spacer(),
  h2("Webhooks"),
  api_table([
    ["POST", "/api/retell/webhook", "Receive Retell AI events: call_started, call_ended, transcript_ready"],
    ["POST", "/api/twilio/webhook", "Handle Twilio call routing events and transfers"],
  ]),
  spacer(),
  h2("Billing"),
  api_table([
    ["POST", "/api/stripe/checkout", "Create Stripe checkout session for plan upgrade"],
    ["POST", "/api/stripe/portal", "Open Stripe billing portal for self-serve management"],
    ["POST", "/api/stripe/webhook", "Handle Stripe events — update plan in DB + send email"],
  ]),
  spacer(),
  h2("Dashboard"),
  api_table([
    ["GET", "/api/dashboard/stats", "Aggregate stats: calls today, bookings this week, estimated savings"],
  ]),
  spacer(2),
  para([new PageBreak()]),
];

// ── Section 6: Onboarding Flow ────────────────────────────────────────────────
const step_box = (num, title, bullets) => [
  new Paragraph({
    children: [
      new TextRun({ text: `  Step ${num}  `, font: "Arial", bold: true, size: 22, color: WHITE, highlight: undefined }),
      new TextRun({ text: `  ${title}`, font: "Arial", bold: true, size: 22, color: BLUE }),
    ],
    shading: { fill: MID_BG, type: ShadingType.CLEAR },
    spacing: { before: 160, after: 60 },
    indent: { left: 0 },
    border: {
      left: { style: BorderStyle.SINGLE, size: 16, color: ACCENT, space: 8 },
    },
  }),
  ...bullets.map(b => bullet_item(b)),
  spacer(),
];

const sec6 = [
  h1("6. Onboarding Flow — 5-Step Wizard"),
  body("Every new user is guided through a 5-step wizard immediately after signup. The wizard requires no technical knowledge and takes under 10 minutes to complete."),
  spacer(),
  ...step_box(1, "Choose Your Business Type", [
    "Two large clickable cards presented side by side: Restaurant | Gym",
    "Selected card highlights in accent blue",
    "Single click advances to Step 2 automatically",
  ]),
  ...step_box(2, "Business Info", [
    "Business name (required)",
    "Owner's current phone number — kept private, used only for urgent call transfers",
    "Business address (optional — AI uses this to answer location questions)",
    "Website URL (optional — AI can reference for FAQs)",
  ]),
  ...step_box(3, "Business Hours", [
    "Visual day-by-day time selector (Monday through Sunday)",
    "Toggle individual days open or closed",
    'Shortcut: "Same hours every day" fills all rows instantly',
    "Hours saved as JSONB in database",
  ]),
  ...step_box(4, "Customize Your AI", [
    "Choose AI voice: Sarah (friendly), James (professional), Aria (warm)",
    "Preview each voice with a 10-second sample audio clip",
    "Add special instructions: e.g. 'Always mention we have free parking', 'We are halal certified'",
    "Instructions are appended to the base system prompt",
  ]),
  ...step_box(5, "Go Live", [
    "New AI phone number displayed prominently (assigned via Twilio)",
    "Checklist shown: Update Google Maps listing | Update website | Make a test call",
    "One-click test call button — owner can call their AI immediately",
    "Confetti animation on completion",
    "Dashboard unlocked — owner lands on their live dashboard",
  ]),
  para([new PageBreak()]),
];

// ── Section 7: Agent Templates ────────────────────────────────────────────────
const sec7 = [
  h1("7. Agent Templates"),
  h2("Restaurant Agent"),
  h3("Capabilities"),
  bullet_item("Take and confirm table reservations (date, time, party size, name, phone number)"),
  bullet_item("Answer FAQs: hours, location, parking, cuisine type, dietary options (halal, vegan, gluten-free)"),
  bullet_item("Handle reservation cancellations and modifications"),
  bullet_item("Take messages when the owner is unavailable"),
  bullet_item("Detect urgent calls and live-transfer to the owner's private phone"),
  bullet_item("Match the restaurant's tone — formal or casual, based on custom instructions"),
  spacer(),
  h3("System Prompt Template"),
  code_line("You are a friendly and professional receptionist for {business_name}."),
  code_line("Your job is to help customers with reservations, answer questions"),
  code_line("about the restaurant, and provide excellent customer service."),
  code_line(""),
  code_line("Business hours: {hours}"),
  code_line("Business address: {address}"),
  code_line("Special notes: {custom_instructions}"),
  code_line(""),
  code_line("When taking a reservation, always collect:"),
  code_line("  - Date and time requested"),
  code_line("  - Number of guests in the party"),
  code_line("  - Customer name and callback number"),
  code_line("  - Any dietary requirements or special requests"),
  code_line(""),
  code_line("If a caller is angry, upset, or needs urgent help,"),
  code_line("transfer the call to the owner immediately."),
  spacer(2),

  h2("Gym Agent"),
  h3("Capabilities"),
  bullet_item("Answer questions about membership plans and monthly pricing"),
  bullet_item("Book free trial sessions and guided gym tours"),
  bullet_item("Answer FAQs: opening hours, equipment, classes, parking, location"),
  bullet_item("Handle membership cancellations — collect reason for churn data"),
  bullet_item("Follow up on leads with outbound calls (Pro+ feature)"),
  bullet_item("Detect serious complaints and transfer to the manager"),
  spacer(),
  h3("System Prompt Template"),
  code_line("You are an enthusiastic and helpful receptionist for {business_name}."),
  code_line("Your job is to help people learn about our memberships, book"),
  code_line("trial visits, and answer any questions they have."),
  code_line(""),
  code_line("Business hours: {hours}"),
  code_line("Business address: {address}"),
  code_line("Special notes: {custom_instructions}"),
  code_line(""),
  code_line("When someone asks about pricing or wants to join:"),
  code_line("  - Explain our membership options warmly"),
  code_line("  - Offer to book a free trial session"),
  code_line("  - Collect their name, email, and preferred visit time"),
  code_line(""),
  code_line("For serious complaints or urgent matters,"),
  code_line("transfer the call to the manager immediately."),
  spacer(2),
  para([new PageBreak()]),
];

// ── Section 8: Pricing Plans ──────────────────────────────────────────────────
const sec8 = [
  h1("8. Pricing Plans"),
  body("Three subscription tiers managed via Stripe. All plans include a 14-day free trial — no credit card required to start."),
  spacer(),

  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2600, 2200, 2200, 2360],
    rows: [
      new TableRow({
        children: [
          hdr_cell("Feature", 2600),
          hdr_cell("Starter  $149/mo", 2200),
          hdr_cell("Pro  $299/mo", 2200),
          hdr_cell("Agency  $599/mo", 2360),
        ],
      }),
      ...[
        ["Calls per month", "500", "2,000", "Unlimited"],
        ["AI agents", "1", "3", "10"],
        ["Phone numbers", "1", "3", "10"],
        ["Call transcripts", "Yes", "Yes", "Yes"],
        ["Call recordings", "No", "Yes", "Yes"],
        ["SMS summaries to owner", "No", "Yes", "Yes"],
        ["Outbound lead follow-up", "No", "Yes", "Yes"],
        ["White-label dashboard", "No", "No", "Yes"],
        ["Custom branding", "No", "No", "Yes"],
        ["API access", "No", "No", "Yes"],
        ["Support", "Email", "Priority", "Dedicated Manager"],
        ["Free trial", "14 days", "14 days", "14 days"],
      ].map(([feat, s, p, a], idx) => new TableRow({
        children: [
          data_cell(feat, 2600, idx % 2 === 0 ? GRAY_BG : WHITE, true),
          data_cell(s, 2200, idx % 2 === 0 ? GRAY_BG : WHITE, false, AlignmentType.CENTER),
          data_cell(p, 2200, idx % 2 === 0 ? "#EFF6FF" : "#DBEAFE", false, AlignmentType.CENTER),
          data_cell(a, 2360, idx % 2 === 0 ? GRAY_BG : WHITE, false, AlignmentType.CENTER),
        ],
      })),
    ],
  }),
  spacer(2),
  para([new PageBreak()]),
];

// ── Section 9: Call Flow ──────────────────────────────────────────────────────
const flow_step = (num, text) => new Paragraph({
  children: [
    new TextRun({ text: `[${num}]  ${text}`, font: "Arial", size: 22, color: DARK_TEXT }),
  ],
  spacing: { before: 80, after: 80 },
  indent: { left: 200 },
  border: { left: { style: BorderStyle.SINGLE, size: 12, color: ACCENT, space: 6 } },
});

const sec9 = [
  h1("9. Call Flow"),
  body("This is the exact sequence of events from the moment a customer calls to the owner seeing the result in their dashboard."),
  spacer(),
  flow_step(1, "Customer dials the AI phone number (provided by Twilio, shown on Google Maps)"),
  flow_step(2, "Twilio receives the call and routes it to the Retell AI agent via webhook"),
  flow_step(3, "Retell AI agent answers using the configured voice and system prompt"),
  flow_step(4, "AI handles the full conversation: reservation, FAQ, lead capture, or transfer"),
  flow_step(5, "On call end: Retell fires a webhook to /api/retell/webhook"),
  flow_step(6, "System saves transcript, generates AI summary, logs call in the database"),
  flow_step(7, "Owner sees the call in their dashboard within 60 seconds"),
  flow_step(8, "If call resulted in a booking: SMS/email notification sent to owner"),
  flow_step(9, "If call was urgent: real-time transfer to owner's private backup phone"),
  spacer(2),
  para([new PageBreak()]),
];

// ── Section 10: Infrastructure Cost ──────────────────────────────────────────
const sec10 = [
  h1("10. Infrastructure Cost Per Customer"),
  body("Based on a Pro plan customer making approximately 200 inbound calls per month at an average of 3 minutes each (600 total minutes)."),
  spacer(),

  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [3200, 3200, 2960],
    rows: [
      new TableRow({ children: [hdr_cell("Service", 3200), hdr_cell("Calculation", 3200), hdr_cell("Monthly Cost", 2960)] }),
      new TableRow({ children: [data_cell("Retell AI", 3200, GRAY_BG), data_cell("$0.07/min × 600 min", 3200, GRAY_BG), data_cell("$42.00", 2960, GRAY_BG, false, AlignmentType.RIGHT)] }),
      new TableRow({ children: [data_cell("Twilio phone number", 3200), data_cell("$1.15 flat per number", 3200), data_cell("$1.15", 2960, WHITE, false, AlignmentType.RIGHT)] }),
      new TableRow({ children: [data_cell("Twilio per-minute", 3200, GRAY_BG), data_cell("$0.014/min × 600 min", 3200, GRAY_BG), data_cell("$8.40", 2960, GRAY_BG, false, AlignmentType.RIGHT)] }),
      new TableRow({ children: [data_cell("Supabase + Vercel", 3200), data_cell("Pro plan shared across users", 3200), data_cell("~$0.50", 2960, WHITE, false, AlignmentType.RIGHT)] }),
      new TableRow({
        children: [
          data_cell("TOTAL COST", 3200, MID_BG, true),
          data_cell("", 3200, MID_BG),
          data_cell("~$52.05", 2960, MID_BG, true, AlignmentType.RIGHT),
        ],
      }),
    ],
  }),
  spacer(),

  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [4680, 4680],
    rows: [
      new TableRow({ children: [hdr_cell("Metric", 4680), hdr_cell("Value", 4680)] }),
      new TableRow({ children: [data_cell("Pro Plan Revenue", 4680, GRAY_BG), data_cell("$299.00 / month", 4680, GRAY_BG, true, AlignmentType.RIGHT)] }),
      new TableRow({ children: [data_cell("Infrastructure Cost", 4680), data_cell("$52.05 / month", 4680, WHITE, false, AlignmentType.RIGHT)] }),
      new TableRow({ children: [data_cell("Gross Profit", 4680, GRAY_BG), data_cell("$246.95 / month", 4680, GRAY_BG, true, AlignmentType.RIGHT)] }),
      new TableRow({ children: [data_cell("Gross Margin", 4680), data_cell("83%", 4680, WHITE, true, AlignmentType.RIGHT)] }),
    ],
  }),
  spacer(2),
  para([new PageBreak()]),
];

// ── Section 11: Feature Roadmap ───────────────────────────────────────────────
const roadmap_table = (rows) => new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [1800, 2400, 5160],
  rows: [
    new TableRow({ children: [hdr_cell("Phase", 1800), hdr_cell("Feature", 2400), hdr_cell("Description", 5160)] }),
    ...rows.map(([phase, feat, desc], idx) => new TableRow({
      children: [
        data_cell(phase, 1800, idx % 2 === 0 ? GRAY_BG : WHITE),
        data_cell(feat, 2400, idx % 2 === 0 ? GRAY_BG : WHITE, true),
        data_cell(desc, 5160, idx % 2 === 0 ? GRAY_BG : WHITE),
      ],
    })),
  ],
});

const sec11 = [
  h1("11. Feature Roadmap"),
  roadmap_table([
    ["Month 1–2", "Auth + Onboarding", "Full signup flow, 5-step wizard, Supabase auth"],
    ["Month 1–2", "Agent Templates", "Pre-built restaurant and gym agent scripts"],
    ["Month 1–2", "Retell AI Integration", "Agent creation, phone assignment, call handling"],
    ["Month 1–2", "Call Logs + Transcripts", "Dashboard showing all calls with transcripts"],
    ["Month 1–2", "Stripe Billing", "3 plan tiers with free trial and webhooks"],
    ["Month 3–4", "SMS Summaries", "Owner gets SMS after every call with action summary"],
    ["Month 3–4", "Outbound Calling", "AI follows up on leads who left contact info"],
    ["Month 3–4", "OpenTable Sync", "Restaurant bookings auto-sync to OpenTable (restaurants)"],
    ["Month 3–4", "Mindbody Sync", "Gym class bookings sync to Mindbody (gyms)"],
    ["Month 3–4", "Analytics Dashboard", "Conversion rate, peak hours, sentiment trends"],
    ["Month 5–6", "White-Label", "Agency plan — custom branding for resellers"],
    ["Month 5–6", "Multi-Location", "One account managing multiple business locations"],
    ["Month 5–6", "Real Estate Vertical", "New agent template for real estate agents"],
    ["Month 5–6", "Doctor's Vertical", "Clinic agent with HIPAA-compliant data handling"],
    ["Month 5–6", "Mobile App", "React Native companion app for on-the-go owners"],
  ]),
  spacer(2),
  para([new PageBreak()]),
];

// ── Section 12: Success Metrics ───────────────────────────────────────────────
const sec12 = [
  h1("12. Success Metrics"),
  body("Track these metrics religiously. They tell you whether to accelerate, pivot, or fix before spending more on ads."),
  spacer(),

  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2000, 2600, 2400, 2360],
    rows: [
      new TableRow({ children: [hdr_cell("Metric", 2000), hdr_cell("When to Track", 2600), hdr_cell("Target", 2400), hdr_cell("Red Flag", 2360)] }),
      ...[
        ["Free trial signups/day", "Week 1 onwards", ">3/day by Week 4", "<1/day — fix ads"],
        ["Trial → Paid conversion", "Month 1–3", ">20%", "<10% — fix onboarding"],
        ["MRR", "Monthly", "+$1,500/mo growth", "Flat 2 months in a row"],
        ["Churn rate", "Always", "<5% per month", ">8% — product problem"],
        ["Calls handled / customer", "Always", ">100 calls/mo", "<20 — low engagement"],
        ["NPS score", "Day 30 survey", ">50", "<30 — fix core product"],
        ["Avg revenue per user", "Monthly", ">$220", "<$149 — pricing issue"],
      ].map(([metric, when_, target, red], idx) => new TableRow({
        children: [
          data_cell(metric, 2000, idx % 2 === 0 ? GRAY_BG : WHITE, true),
          data_cell(when_, 2600, idx % 2 === 0 ? GRAY_BG : WHITE),
          data_cell(target, 2400, idx % 2 === 0 ? GRAY_BG : WHITE),
          data_cell(red, 2360, idx % 2 === 0 ? "#FEF2F2" : "#FEF2F2"),
        ],
      })),
    ],
  }),
  spacer(2),
];

// ── Build document ────────────────────────────────────────────────────────────
const doc = new Document({
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: "\u2022",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
    ],
  },
  styles: {
    default: {
      document: { run: { font: "Arial", size: 22, color: DARK_TEXT } },
    },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, font: "Arial", color: BLUE },
        paragraph: { spacing: { before: 400, after: 160 }, outlineLevel: 0 },
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Arial", color: ACCENT },
        paragraph: { spacing: { before: 300, after: 120 }, outlineLevel: 1 },
      },
      {
        id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Arial", color: MID_TEXT },
        paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 2 },
      },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      },
    },
    headers: {
      default: new Header({
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: "RINGPILOT", font: "Arial", bold: true, size: 18, color: BLUE }),
              new TextRun({ text: "   |   Product Structure Document   |   Confidential", font: "Arial", size: 18, color: MID_TEXT }),
            ],
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: ACCENT, space: 4 } },
          }),
        ],
      }),
    },
    footers: {
      default: new Footer({
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: "ringpilot.com   |   March 2026", font: "Arial", size: 16, color: MID_TEXT }),
              new TextRun({ text: "     Page ", font: "Arial", size: 16, color: MID_TEXT }),
              new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 16, color: MID_TEXT }),
            ],
            alignment: AlignmentType.RIGHT,
            border: { top: { style: BorderStyle.SINGLE, size: 4, color: ACCENT, space: 4 } },
          }),
        ],
      }),
    },
    children: [
      ...cover_page,
      ...toc_page,
      ...sec1,
      ...sec2,
      ...sec3,
      ...sec4,
      ...sec5,
      ...sec6,
      ...sec7,
      ...sec8,
      ...sec9,
      ...sec10,
      ...sec11,
      ...sec12,
    ],
  }],
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("D:/my startup/ai-calling-agent-product-structure.docx", buffer);
  console.log("SUCCESS: Document saved to D:/my startup/ai-calling-agent-product-structure.docx");
}).catch(err => {
  console.error("ERROR:", err.message);
  process.exit(1);
});
