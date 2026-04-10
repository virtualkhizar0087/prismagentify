'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Radio, Loader2, AlertCircle } from 'lucide-react'
import Script from 'next/script'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'elevenlabs-convai': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        'agent-id'?: string
        'signed-url'?: string
      }, HTMLElement>
    }
  }
}

const TIPS: Record<string, { q: string }[]> = {
  restaurant: [
    { q: 'What time do you close?' },
    { q: 'Can I make a reservation for 2 tonight?' },
    { q: 'Do you have vegan options?' },
    { q: 'Where are you located?' },
    { q: 'Is there parking nearby?' },
  ],
  gym: [
    { q: 'How much is a monthly membership?' },
    { q: 'Can I get a free trial?' },
    { q: 'What are your opening hours?' },
    { q: 'Do you have personal trainers?' },
    { q: 'Is there a joining fee?' },
  ],
}

export default function AgentTestPage() {
  const { id } = useParams<{ id: string }>()
  const [agentId, setAgentId] = useState<string | null>(null)   // ElevenLabs agent_id
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [agentName, setAgentName] = useState('Your Agent')
  const [vertical, setVertical] = useState<'restaurant' | 'gym'>('restaurant')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function init() {
      try {
        // Load agent info + make agent shareable + get signed URL in parallel
        const [agentRes, tokenRes] = await Promise.all([
          fetch(`/api/agents?id=${id}`).then(r => r.json()),
          fetch(`/api/agents/${id}/conversation-token`).then(r => r.json()),
        ])

        if (agentRes.agents?.length) {
          const a = agentRes.agents.find((x: any) => x.id === id) ?? agentRes.agents[0]
          setAgentName(a.name)
          setVertical(a.vertical)
        }

        if (tokenRes.error) {
          setError(tokenRes.error)
        } else {
          // Prefer agent-id (shareable) over signed-url — agent-id is simpler and more reliable
          if (tokenRes.agentId) setAgentId(tokenRes.agentId)
          if (tokenRes.signedUrl) setSignedUrl(tokenRes.signedUrl)
          if (!tokenRes.agentId && !tokenRes.signedUrl) {
            setError('Could not get agent credentials')
          }
        }
      } catch (e: any) {
        setError(e.message || 'Failed to load')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [id])

  const tips = TIPS[vertical] ?? TIPS.restaurant

  return (
    <>
      <Script src="https://elevenlabs.io/convai-widget/index.js" strategy="afterInteractive" />

      <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href={`/agents/${id}`}>
            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <ArrowLeft className="h-4 w-4 text-gray-500" />
            </button>
          </Link>
          <div className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-green-600" />
            <h1 className="text-xl font-bold text-gray-900">Test: {agentName}</h1>
          </div>
        </div>

        {/* Main widget card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100 px-6 py-4">
            <p className="text-sm font-semibold text-green-800">Live voice test</p>
            <p className="text-xs text-green-600 mt-0.5">Click the mic button to start talking. Your agent will respond with voice.</p>
          </div>

          <div className="flex flex-col items-center justify-center py-10 px-6 min-h-[200px]">
            {loading ? (
              <div className="flex flex-col items-center gap-3 text-gray-400">
                <Loader2 className="h-10 w-10 animate-spin" />
                <p className="text-sm">Preparing your agent…</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-3 text-center max-w-xs">
                <AlertCircle className="h-10 w-10 text-red-400" />
                <p className="text-sm font-semibold text-red-700">Could not connect</p>
                <p className="text-xs text-red-500">{error}</p>
                <p className="text-xs text-gray-400">Make sure your ELEVENLABS_API_KEY is set in .env.local and the agent is provisioned.</p>
              </div>
            ) : agentId ? (
              <div className="flex flex-col items-center gap-4">
                {/* Use agent-id directly — agent was made shareable by the server */}
                <elevenlabs-convai agent-id={agentId} />
                <p className="text-xs text-gray-400">Allow microphone access when your browser asks</p>
              </div>
            ) : signedUrl ? (
              <div className="flex flex-col items-center gap-4">
                <elevenlabs-convai signed-url={signedUrl} />
                <p className="text-xs text-gray-400">Allow microphone access when your browser asks</p>
              </div>
            ) : null}
          </div>
        </div>

        {/* Tips */}
        <div className="bg-gray-50 rounded-2xl p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Things to test</p>
          <div className="space-y-2">
            {tips.map(t => (
              <div key={t.q} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-green-600 text-xs font-bold">›</span>
                </div>
                <p className="text-sm text-gray-700">"{t.q}"</p>
              </div>
            ))}
            <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100">
              <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                <span className="text-red-500 text-xs font-bold">!</span>
              </div>
              <p className="text-sm text-gray-700">Say something rude — check it escalates to your number</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
