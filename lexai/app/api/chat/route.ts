import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { streamChat } from '@/lib/claude'
import type { Message } from '@/types/database'

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { conversationId, message, messages } = await request.json() as {
    conversationId: string | null
    message: string
    messages: Message[]
  }

  if (!message?.trim()) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 })
  }

  const newUserMessage: Message = {
    role: 'user',
    content: message,
    timestamp: new Date().toISOString(),
  }

  const updatedMessages = [...messages, newUserMessage]

  // Stream response from Claude
  const encoder = new TextEncoder()
  let fullResponse = ''

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const claudeMessages = updatedMessages.map((m) => ({
          role: m.role,
          content: m.content,
        }))

        fullResponse = await streamChat({
          messages: claudeMessages,
          onChunk: (text) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
          },
        })

        const assistantMessage: Message = {
          role: 'assistant',
          content: fullResponse,
          timestamp: new Date().toISOString(),
        }

        const finalMessages = [...updatedMessages, assistantMessage]

        // Save to database
        if (conversationId) {
          await supabase
            .from('conversations')
            .update({ messages_json: finalMessages })
            .eq('id', conversationId)
            .eq('user_id', user.id)
        } else {
          // Create new conversation with auto-generated title
          const title = message.slice(0, 60) + (message.length > 60 ? '…' : '')
          const { data: conv } = await supabase
            .from('conversations')
            .insert({
              user_id: user.id,
              title,
              messages_json: finalMessages,
            })
            .select('id')
            .single()

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ conversationId: conv?.id })}\n\n`)
          )
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      } catch (error) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: 'Failed to get AI response' })}\n\n`)
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
