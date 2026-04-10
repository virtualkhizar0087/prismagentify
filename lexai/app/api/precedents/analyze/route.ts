import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anthropic } from '@/lib/claude'

const ANALYSIS_SYSTEM = `You are Court of AI, an expert Pakistani legal analyst. Analyze the provided case facts and provide a comprehensive legal analysis.

Structure your analysis as follows:

## ⚖️ Applicable Laws & Statutory Framework
List the specific Pakistani statutes and sections that apply to this case.

## 📚 Relevant Precedents
List the most relevant Pakistani case law (PLD/SCMR citations) with their holdings and how they apply to these facts.

## ✅ Strengths of the Position
List the strongest legal arguments in favor of the party.

## ⚠️ Weaknesses & Risks
Identify the weaknesses in the case and potential risks.

## 🎯 Predicted Outcome
Based on the law and precedents, predict the likely outcome. Provide a confidence assessment (High/Medium/Low) with reasoning.

## 💡 Recommended Strategy
Provide specific strategic recommendations for proceeding with this case.

---
*Note: I am an AI. This analysis is for informational purposes only. Please consult a licensed Pakistani advocate (وکیل) before taking any legal action.*`

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { facts, category } = await request.json()

  if (!facts?.trim()) {
    return NextResponse.json({ error: 'Case facts are required' }, { status: 400 })
  }

  // Search for relevant precedents
  let precedentsContext = ''
  try {
    const searchRes = await fetch(
      new URL('/api/precedents/search', request.url).toString(),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: request.headers.get('cookie') ?? '' },
        body: JSON.stringify({ query: facts.slice(0, 300), category, limit: 8 }),
      }
    )
    if (searchRes.ok) {
      const searchData = await searchRes.json()
      if (searchData.results?.length > 0) {
        precedentsContext = '\n\nRelevant cases from Pakistani legal database:\n' +
          searchData.results.slice(0, 8).map((c: any) =>
            `- **${c.case_name}** (${c.citation ?? 'No citation'})\n  Court: ${c.court_code} | Year: ${c.year}\n  Holding: ${c.holding?.slice(0, 300) ?? 'N/A'}`
          ).join('\n\n')
      }
    }
  } catch {
    // Continue without precedents
  }

  const userMessage = `Analyze the following case facts:

${facts}
${category ? `\nArea of Law: ${category}` : ''}
${precedentsContext}

Provide a comprehensive legal analysis including applicable Pakistani laws, relevant precedents, strengths, weaknesses, predicted outcome with confidence level, and recommended strategy.`

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const claudeStream = anthropic.messages.stream({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 3000,
          system: ANALYSIS_SYSTEM,
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
          encoder.encode(`data: ${JSON.stringify({ error: 'Analysis failed' })}\n\n`)
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
