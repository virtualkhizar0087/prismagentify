import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anthropic } from '@/lib/claude'

const ARGUMENT_SYSTEM = `You are Court of AI, an expert Pakistani legal AI assisting licensed advocates. Build comprehensive, professionally structured legal arguments for Pakistani courts.

Structure every argument as follows:

## 1. Introduction & Position
State the client's position and the nature of the case.

## 2. Applicable Laws & Statutory Framework
Cite specific sections of Pakistani statutes (PPC, CPC, CrPC, Contract Act, etc.) that apply.

## 3. Supporting Precedents
Cite PLD/SCMR cases with exact holdings. Format: **Case Name** (Citation) — state the relevant holding.

## 4. Legal Arguments
Number each argument. Be specific and cite both law and precedent.

## 5. Counter-Arguments & Responses
Anticipate opposing arguments and provide responses.

## 6. Prayer / Relief Sought
State the specific relief being sought.

Guidelines:
- Be formal and use proper legal language
- Cite real Pakistani cases and statutes
- Use PLD, SCMR, CLC, PCrLJ citations where applicable
- Note any limitations: "I am an AI. This argument requires review by a licensed advocate (وکیل) before filing."`

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { position, category, disputeType, facts, parties, relief } = await request.json()

  if (!facts?.trim()) {
    return NextResponse.json({ error: 'Case facts are required' }, { status: 400 })
  }

  // Search for relevant precedents to include in the prompt
  let precedentsContext = ''
  try {
    const searchRes = await fetch(
      new URL('/api/precedents/search', request.url).toString(),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: request.headers.get('cookie') ?? '' },
        body: JSON.stringify({ query: `${disputeType} ${facts.slice(0, 200)}`, category, limit: 5 }),
      }
    )
    if (searchRes.ok) {
      const searchData = await searchRes.json()
      if (searchData.results?.length > 0) {
        precedentsContext = '\n\nRelevant precedents found in database:\n' +
          searchData.results.slice(0, 5).map((c: any) =>
            `- ${c.case_name} (${c.citation}): ${c.holding?.slice(0, 200) ?? 'No holding available'}`
          ).join('\n')
      }
    }
  } catch {
    // Silently continue without precedents context
  }

  const userMessage = `Build a comprehensive legal argument for the following case:

**Position**: ${position}
**Area of Law**: ${category || 'General'}
**Type of Dispute**: ${disputeType || 'Not specified'}
**Relevant Parties**: ${parties || 'Not specified'}
**Relief Sought**: ${relief || 'Not specified'}

**Case Facts**:
${facts}
${precedentsContext}

Build a complete, professionally structured legal argument suitable for filing in a Pakistani court.`

  const encoder = new TextEncoder()
  let fullArgument = ''

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const claudeStream = anthropic.messages.stream({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          system: ARGUMENT_SYSTEM,
          messages: [{ role: 'user', content: userMessage }],
        })

        for await (const event of claudeStream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            fullArgument += event.delta.text
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`)
            )
          }
        }

        // Save the argument to the database (fire and forget)
        const title = `${position} — ${disputeType || category || 'Legal Argument'} (${new Date().toLocaleDateString()})`
        supabase
          .from('legal_arguments')
          .insert({
            user_id: user.id,
            title,
            query: facts.slice(0, 500),
            case_facts: facts,
            argument_text: fullArgument,
            cited_precedent_ids: [],
            law_category: category || null,
          })
          .then(() => {})

        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      } catch (error) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: 'Failed to build argument' })}\n\n`)
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
