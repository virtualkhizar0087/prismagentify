import Anthropic from '@anthropic-ai/sdk'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

const MODEL = 'claude-sonnet-4-20250514'

const LEXAI_SYSTEM_PROMPT = `You are Court of AI, an expert AI legal co-pilot for small businesses in Pakistan and globally.
You help business owners, freelancers, and entrepreneurs understand, analyze, and draft legal documents.

Your capabilities:
- Analyze contracts and identify risks, red flags, and important clauses
- Explain complex legal language in plain, simple language
- Draft legal documents like NDAs, service agreements, and employment contracts
- Answer general legal questions relevant to small business operations
- Identify missing protections in contracts
- Provide guidance on Pakistani law including SECP regulations, FBR tax compliance, FERA, and the Personal Data Protection Act
- Help freelancers on Upwork/Fiverr/Freelancer.com with client contracts and payment protection

LANGUAGE INSTRUCTIONS — CRITICAL:
- If the user writes in Urdu (or mixes Urdu and English), you MUST respond entirely in Urdu (using Nastaliq/standard Urdu script)
- If the user writes in English, respond in English
- If the user asks you to switch language, do so immediately
- When responding in Urdu, use simple, everyday Urdu that non-lawyers can understand — avoid complex legal Urdu jargon
- You can say "آپ کا AI قانونی معاون" (Your AI Legal Assistant) when greeting Urdu users

Pakistan Legal Context:
- Companies Ordinance 2016 (SECP) — company registration and governance
- Contract Act 1872 — fundamental contract law in Pakistan
- Sale of Goods Act 1930 — commercial transactions
- Electronic Transactions Ordinance 2002 — digital contract validity
- Personal Data Protection Act (upcoming) — privacy and data handling
- FERA 1947 — foreign exchange and international payments
- Income Tax Ordinance 2001 (FBR) — tax obligations
- Copyright Ordinance 1962 — intellectual property
- Freelancers: Pakistan's IT ministry freelancer support policies

Important guidelines:
- Always clarify you are an AI, not a licensed attorney (وکیل نہیں ہوں)
- Recommend consulting a licensed attorney (وکیل) for complex matters
- Be thorough but accessible — explain legal concepts in plain language
- Focus on practical implications for small business owners and freelancers
- Highlight both risks and protections in contracts
- Be concise and actionable in your responses`

// ============================================================
// CONTRACT ANALYSIS
// ============================================================

export interface ContractAnalysis {
  riskScore: number
  riskSummary: string
  keyClauses: string[]
  redFlags: string[]
  missingProtections: string[]
  recommendations: string[]
  plainEnglishSummary: string
}

export async function analyzeContract(contractText: string): Promise<ContractAnalysis> {
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: LEXAI_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Analyze this contract and respond with a JSON object (no markdown, just raw JSON) with the following structure:
{
  "riskScore": <0-100 integer, where 0=very favorable, 50=neutral, 100=very risky>,
  "riskSummary": "<2-3 sentence overall risk assessment>",
  "keyClauses": ["<list of the most important clauses found>"],
  "redFlags": ["<list of concerning provisions that need attention>"],
  "missingProtections": ["<list of standard protections that are absent>"],
  "recommendations": ["<list of actionable recommendations>"],
  "plainEnglishSummary": "<plain English explanation of what this contract means for the business owner>"
}

CONTRACT TEXT:
${contractText}`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')

  const parsed = JSON.parse(content.text) as ContractAnalysis
  return parsed
}

// ============================================================
// CHAT (streaming)
// ============================================================

export async function streamChat({
  messages,
  onChunk,
}: {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  onChunk: (text: string) => void
}): Promise<string> {
  let fullResponse = ''

  const stream = anthropic.messages.stream({
    model: MODEL,
    max_tokens: 2048,
    system: LEXAI_SYSTEM_PROMPT,
    messages,
  })

  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      onChunk(event.delta.text)
      fullResponse += event.delta.text
    }
  }

  return fullResponse
}

// ============================================================
// DOCUMENT GENERATION
// ============================================================

export interface DocumentGenerationParams {
  type: string
  details: Record<string, string>
}

export async function generateLegalDocument({
  type,
  details,
}: DocumentGenerationParams): Promise<string> {
  const detailsText = Object.entries(details)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 8192,
    system: LEXAI_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Generate a professional ${type} document based on these details:

${detailsText}

Create a complete, legally-sound document with proper formatting. Include all standard clauses for this document type. Use clear, professional language. Add placeholders in [BRACKETS] for any information not provided.`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')
  return content.text
}

// ============================================================
// DEADLINE EXTRACTION
// ============================================================

export interface ExtractedDeadline {
  deadlineType: 'renewal' | 'termination_notice' | 'payment' | 'expiry' | 'other'
  description: string
  deadlineDate: string // ISO date string YYYY-MM-DD
  noticePeriodDays?: number // e.g. 30 if "must cancel 30 days before renewal"
}

export async function extractDeadlines(contractText: string): Promise<ExtractedDeadline[]> {
  const today = new Date().toISOString().split('T')[0]

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: LEXAI_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Today's date is ${today}.

Extract all time-sensitive deadlines, dates, and notice periods from this contract.

Look for:
- Auto-renewal dates
- Contract expiry / end dates
- Termination notice windows (e.g. "must cancel 60 days before renewal")
- Payment due dates or milestones
- Probation / review periods
- Any other date-critical obligations

Respond with a JSON array (no markdown, raw JSON only). If no deadlines are found, return [].

Format:
[
  {
    "deadlineType": "renewal" | "termination_notice" | "payment" | "expiry" | "other",
    "description": "<plain English description of the deadline>",
    "deadlineDate": "<YYYY-MM-DD — the actual deadline date. If relative like 'one year from signing', estimate from today>",
    "noticePeriodDays": <number of days advance notice required, or null if not applicable>
  }
]

CONTRACT TEXT:
${contractText.slice(0, 60_000)}`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')

  const text = content.text.trim()
  // handle empty / non-JSON gracefully
  if (!text || text === '[]') return []
  return JSON.parse(text) as ExtractedDeadline[]
}

// ============================================================
// CONTRACT REDLINING / NEGOTIATION
// ============================================================

export interface NegotiationResult {
  originalClause: string
  negotiatedClause: string
  explanation: string
  favorabilityImprovement: string
}

export async function negotiateClause({
  redFlag,
  contractText,
}: {
  redFlag: string
  contractText: string
}): Promise<NegotiationResult> {
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: LEXAI_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `You are reviewing a contract on behalf of the party who will SIGN it (the weaker party / small business owner).

The following red flag was identified:
"${redFlag}"

Your task:
1. Find the exact clause or sentence in the contract that creates this red flag.
2. Rewrite it to be fair and protective of the signing party — not the drafter.
3. Explain plainly what you changed and why it benefits the signer.

Respond with a JSON object (no markdown, raw JSON only):
{
  "originalClause": "<exact problematic text from the contract>",
  "negotiatedClause": "<your rewritten version that protects the signer>",
  "explanation": "<1-2 sentences: what you changed and why it helps the signer>",
  "favorabilityImprovement": "<short label like 'Removes unlimited liability' or 'Adds 30-day cure period'>"
}

CONTRACT TEXT:
${contractText.slice(0, 60_000)}`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')
  return JSON.parse(content.text) as NegotiationResult
}

// ============================================================
// CONTRACT COMPARISON
// ============================================================

export interface ClauseComparison {
  aspect: string
  contractA: string
  contractB: string
  winner: 'a' | 'b' | 'tie'
  explanation: string
}

export interface ContractComparison {
  winner: 'a' | 'b' | 'tie'
  overallAssessment: string
  scoreA: number
  scoreB: number
  clauseComparisons: ClauseComparison[]
  recommendation: string
}

export async function compareContracts({
  contractAText,
  contractBText,
  contractAName,
  contractBName,
}: {
  contractAText: string
  contractBText: string
  contractAName: string
  contractBName: string
}): Promise<ContractComparison> {
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: LEXAI_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Compare these two contracts from the perspective of the party who will SIGN them (the small business owner / weaker party). Determine which contract is more favorable to the signer.

CONTRACT A ("${contractAName}"):
${contractAText.slice(0, 30_000)}

---

CONTRACT B ("${contractBName}"):
${contractBText.slice(0, 30_000)}

Respond with a JSON object (no markdown, raw JSON only):
{
  "winner": "a" | "b" | "tie",
  "overallAssessment": "<2-3 sentence summary of which contract is better and why>",
  "scoreA": <0-100 favorability score for the signer, higher = better for signer>,
  "scoreB": <0-100 favorability score for the signer, higher = better for signer>,
  "clauseComparisons": [
    {
      "aspect": "<what is being compared, e.g. 'Liability Cap', 'Termination Rights', 'Payment Terms'>",
      "contractA": "<how Contract A handles this>",
      "contractB": "<how Contract B handles this>",
      "winner": "a" | "b" | "tie",
      "explanation": "<why one is better for the signer>"
    }
  ],
  "recommendation": "<1-2 sentences: clear recommendation on which to sign and what to negotiate>"
}

Include 5-8 clause comparisons covering the most important aspects.`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')
  return JSON.parse(content.text) as ContractComparison
}

// ============================================================
// QUICK LEGAL QUESTION (non-streaming)
// ============================================================

export async function askLegalQuestion(question: string): Promise<string> {
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: LEXAI_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: question }],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')
  return content.text
}
