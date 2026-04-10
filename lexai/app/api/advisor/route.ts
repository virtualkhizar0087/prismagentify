import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { situationType, description, facts, desiredOutcome, language } = await req.json()

  if (!description?.trim()) {
    return NextResponse.json({ error: 'Description is required' }, { status: 400 })
  }

  const isUrdu = language === 'ur'

  const systemPrompt = `You are a senior legal advisor specializing in Pakistani law with 20 years of experience. You help individuals and small businesses understand their legal situation, rights, and options under Pakistani law.

Your expertise includes:
- Pakistan Contract Act 1872
- Sale of Goods Act 1930
- Pakistan Penal Code 1860
- Code of Civil Procedure 1908
- Arbitration Act 1940
- Companies Act 2017
- SECP regulations
- FBR / tax law
- Punjab/Sindh/KPK/Balochistan/ICT local laws
- Labor laws (Industrial Relations Act, EOBI, SESSI)
- Intellectual Property (Copyright Ordinance 1962, Trademark Ordinance 2001)
- Pakistan Personal Data Protection Act (PDPA)
- Electronic Transactions Ordinance 2002
- Cyber Crime Act (PECA 2016)

Always:
1. Cite specific law sections (e.g., "Under Section 73 of the Contract Act 1872...")
2. Be practical — give actionable advice
3. Note when the situation requires a licensed attorney in person
4. Keep language clear and accessible
5. ${isUrdu ? 'Respond in Urdu (nastaliq script)' : 'Respond in English'}

Important: You are an AI tool, not a licensed attorney. Always recommend consulting a lawyer for complex or high-stakes matters.`

  const userPrompt = `A user needs legal guidance on the following situation:

SITUATION TYPE: ${situationType}

DESCRIPTION:
${description}

${facts ? `ADDITIONAL FACTS:\n${facts}\n` : ''}
${desiredOutcome ? `DESIRED OUTCOME:\n${desiredOutcome}\n` : ''}

Please provide a structured legal brief with the following sections:

## 1. Situation Summary
Brief summary of the legal situation in 2-3 sentences.

## 2. Legal Analysis
Analyze the situation under applicable Pakistani law. Cite specific laws and sections.

## 3. Your Legal Rights & Position
What rights does this person have? What is their legal position?

## 4. Recommended Actions
Numbered step-by-step recommended actions (most urgent first).

## 5. What to Document
List what the person should collect, save, or document as evidence.

## 6. Draft Communication
Write a short, professional letter or notice they can send (if applicable) to the other party.

## 7. When to See a Lawyer
Note when professional legal representation is essential.

Be specific, practical, and cite Pakistani law sections where applicable.`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    temperature: 0.3,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const brief = (message.content[0] as { type: string; text: string }).text

  return NextResponse.json({ brief })
}
