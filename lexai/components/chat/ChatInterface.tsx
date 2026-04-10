'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Plus, MessageSquare } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { formatDate } from '@/lib/utils'
import type { Message } from '@/types/database'

interface ConversationSummary {
  id: string
  title: string
  created_at: string
  updated_at: string
}

interface Props {
  userId: string
  initialConversations: ConversationSummary[]
}

const STARTERS = [
  'What should be in an NDA for a software contractor?',
  'What are common red flags in a lease agreement?',
  'Do I need a separate privacy policy for my website?',
  'What\'s the difference between an employee and a contractor?',
  'How do I protect my intellectual property when working with freelancers?',
]

export function ChatInterface({ userId, initialConversations }: Props) {
  const [conversations, setConversations] = useState(initialConversations)
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return

    const userMsg: Message = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsStreaming(true)
    setStreamingText('')

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeConvId,
          message: text,
          messages,
        }),
      })

      if (!res.body) throw new Error('No stream')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''
      let newConvId: string | null = null

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter((l) => l.startsWith('data: '))

        for (const line of lines) {
          const data = line.slice(6)
          if (data === '[DONE]') continue

          try {
            const parsed = JSON.parse(data)
            if (parsed.text) {
              accumulated += parsed.text
              setStreamingText(accumulated)
            }
            if (parsed.conversationId) {
              newConvId = parsed.conversationId
            }
            if (parsed.error) {
              throw new Error(parsed.error)
            }
          } catch {}
        }
      }

      const assistantMsg: Message = {
        role: 'assistant',
        content: accumulated,
        timestamp: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, assistantMsg])
      setStreamingText('')

      if (newConvId) {
        setActiveConvId(newConvId)
        const newConv: ConversationSummary = {
          id: newConvId,
          title: text.slice(0, 60),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        setConversations((prev) => [newConv, ...prev])
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date().toISOString(),
        },
      ])
    } finally {
      setIsStreaming(false)
    }
  }, [activeConvId, messages, isStreaming])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  function startNewConversation() {
    setActiveConvId(null)
    setMessages([])
    setInput('')
    setStreamingText('')
  }

  async function loadConversation(convId: string) {
    try {
      const res = await fetch(`/api/chat/conversation/${convId}`)
      const data = await res.json()
      if (data.messages) {
        setMessages(data.messages)
        setActiveConvId(convId)
      }
    } catch {}
  }

  return (
    <div className="flex h-[calc(100vh-160px)] gap-4">
      {/* Conversations sidebar */}
      <div className="w-56 shrink-0 flex flex-col gap-2">
        <button
          onClick={startNewConversation}
          className="flex items-center gap-2 rounded-lg bg-lexai-600 px-3 py-2 text-sm font-medium text-white hover:bg-lexai-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New chat
        </button>

        <div className="flex-1 overflow-y-auto space-y-1">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => loadConversation(conv.id)}
              className={`w-full rounded-lg px-3 py-2 text-left transition-colors ${
                activeConvId === conv.id
                  ? 'bg-lexai-50 ring-1 ring-lexai-200'
                  : 'hover:bg-gray-100'
              }`}
            >
              <p className="truncate text-xs font-medium text-gray-800">{conv.title}</p>
              <p className="text-[10px] text-gray-400">{formatDate(conv.updated_at)}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex flex-1 flex-col rounded-xl bg-white ring-1 ring-gray-200 overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !isStreaming && (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <MessageSquare className="mb-4 h-12 w-12 text-gray-200" />
              <h3 className="text-lg font-semibold text-gray-700">Ask your AI legal co-pilot</h3>
              <p className="mt-2 text-sm text-gray-400 max-w-sm">
                Get clear guidance on contracts, business law, and legal documents.
              </p>
              <div className="mt-6 grid gap-2 w-full max-w-md">
                {STARTERS.map((starter) => (
                  <button
                    key={starter}
                    onClick={() => sendMessage(starter)}
                    className="rounded-lg bg-gray-50 px-3 py-2 text-left text-sm text-gray-600 hover:bg-lexai-50 hover:text-lexai-700 transition-colors ring-1 ring-gray-200"
                  >
                    {starter}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-lexai-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <div className="prose-legal">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm">{msg.content}</p>
                )}
              </div>
            </div>
          ))}

          {/* Streaming response */}
          {isStreaming && streamingText && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-xl bg-gray-100 px-4 py-3">
                <div className="prose-legal">
                  <ReactMarkdown>{streamingText}</ReactMarkdown>
                </div>
                <span className="inline-block h-4 w-0.5 bg-lexai-500 animate-pulse ml-0.5" />
              </div>
            </div>
          )}

          {isStreaming && !streamingText && (
            <div className="flex justify-start">
              <div className="rounded-xl bg-gray-100 px-4 py-3">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-2 w-2 rounded-full bg-gray-400 animate-bounce"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-100 p-3">
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a legal question… (Enter to send, Shift+Enter for new line)"
              rows={2}
              disabled={isStreaming}
              className="flex-1 resize-none rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-lexai-500 disabled:opacity-50"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isStreaming}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-lexai-600 text-white hover:bg-lexai-700 disabled:opacity-40 transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-1.5 text-[11px] text-gray-400">
            Court of AI is an AI, not a lawyer. Consult a licensed attorney for important legal decisions.
          </p>
        </div>
      </div>
    </div>
  )
}
