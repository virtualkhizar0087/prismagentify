import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { anthropic } from '@/lib/claude'
import type { Precedent } from '@/types/database'

const COURT_AI_SYSTEM = `You are Court of AI, Pakistan's AI legal co-pilot and case law expert. You provide authoritative, precise legal analysis for Pakistani lawyers, judges, and legal professionals.

When answering questions about Pakistani case law:
- Cite specific PLD/SCMR/CLC citations with year and court
- State the exact holding and ratio decidendi of each case
- Explain the practical implications for Pakistani legal practice
- Note if a case has been overruled, distinguished, or followed
- Structure your answer with clear headers
- Be bilingual-aware: if the user asks in Urdu, respond in Urdu
- Note any dissenting opinions if significant
- Always clarify you are an AI and complex matters require a licensed advocate (وکیل)`

function formatCaseForPrompt(c: Precedent): string {
  return `**${c.case_name}** (${c.citation ?? 'No citation'})
Court: ${c.court} | Year: ${c.year ?? 'Unknown'}
Category: ${c.law_category}${c.law_subcategory ? ` — ${c.law_subcategory}` : ''}
Holding: ${c.holding ?? 'Not available'}
${c.is_landmark ? '★ LANDMARK CASE' : ''}`
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { query, cases } = await request.json() as {
    query: string
    cases: Precedent[]
  }

  if (!query?.trim()) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 })
  }

  const casesText = (cases ?? [])
    .slice(0, 10)
    .map(formatCaseForPrompt)
    .join('\n\n---\n\n')

  const userMessage = `Question: ${query}

Relevant Cases Found:
${casesText}

Please provide a comprehensive legal analysis answering the question, synthesizing insights from the above cases. Cite each case with its full citation. Explain the legal principles established and their practical implications for Pakistani legal practice.`

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const claudeStream = anthropic.messages.stream({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2048,
          system: COURT_AI_SYSTEM,
          messages: [{ role: 'user', content: userMessage }],
        })

        for await (const event of claudeStream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`)
            )
          }
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      } catch (error) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: 'Failed to generate answer' })}\n\n`)
        )
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
