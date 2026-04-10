'use client'
import { useEffect, useRef, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, Radio, AlertCircle, ExternalLink } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  agentId: string        // ElevenLabs agent_id
  agentName: string
  vertical: 'restaurant' | 'gym'
  dbAgentId: string      // Our DB agent UUID
}

const TEST_TIPS: Record<string, string[]> = {
  restaurant: [
    'Ask about opening hours',
    'Ask to make a reservation',
    "Ask what's on the menu",
    'Ask about parking',
    'Say something rude — test escalation',
  ],
  gym: [
    'Ask about membership prices',
    'Request a free trial',
    'Ask about opening hours',
    'Ask if there are personal trainers',
    'Say something rude — test escalation',
  ],
}

// Tell TypeScript about the ElevenLabs web component
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

export function AgentTestDialog({ open, onClose, agentId, agentName, vertical, dbAgentId }: Props) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [loadingUrl, setLoadingUrl] = useState(false)
  const [error, setError] = useState('')
  const [appUrl, setAppUrl] = useState('http://localhost:3001')
  const scriptRef = useRef<HTMLScriptElement | null>(null)

  // Detect actual app URL from browser
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAppUrl(window.location.origin)
    }
  }, [])

  // Load the ElevenLabs widget script once
  useEffect(() => {
    if (document.querySelector('script[data-elevenlabs-widget]')) return
    const script = document.createElement('script')
    script.src = 'https://elevenlabs.io/convai-widget/index.js'
    script.async = true
    script.setAttribute('data-elevenlabs-widget', 'true')
    document.head.appendChild(script)
    scriptRef.current = script
  }, [])

  // Fetch signed URL when dialog opens
  useEffect(() => {
    if (!open) return
    setError('')
    setLoadingUrl(true)
    setSignedUrl(null)

    fetch(`/api/agents/${dbAgentId}/conversation-token`)
      .then(r => r.json())
      .then(json => {
        if (json.signedUrl) {
          setSignedUrl(json.signedUrl)
        } else {
          // Fall back to public agent ID
          setSignedUrl('')
        }
      })
      .catch(() => setSignedUrl(''))  // fall back to agent ID on network error
      .finally(() => setLoadingUrl(false))
  }, [open, dbAgentId])

  const tips = TEST_TIPS[vertical] ?? TEST_TIPS.restaurant

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-green-600" />
            Test: {agentName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Open in real browser — primary CTA */}
          <a
            href={`${appUrl}/agents/${dbAgentId}?test=1`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full h-12 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Open in Browser to Test
          </a>

          {/* Why */}
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              The preview pane blocks microphone access. Click <strong>Open in Browser</strong> to open RingPilot in a real Chrome/Edge tab — the voice widget will work there.
            </p>
          </div>

          {/* Embedded widget — works when opened in real browser */}
          <div className="flex flex-col items-center gap-3 bg-gray-50 rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Or talk here if already in a real browser</p>
            {loadingUrl ? (
              <div className="flex items-center gap-2 text-gray-400">
                <Loader2 className="h-5 w-5 animate-spin" />
                <p className="text-sm">Loading widget…</p>
              </div>
            ) : (
              <>
                {signedUrl
                  ? <elevenlabs-convai signed-url={signedUrl} />
                  : <elevenlabs-convai agent-id={agentId} />
                }
              </>
            )}
          </div>

          {/* Tips */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Things to say</p>
            <ul className="space-y-1.5">
              {tips.map(tip => (
                <li key={tip} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-green-500 font-bold shrink-0">›</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-gray-400 text-center">
            Uses your browser mic and speakers. This is exactly what your customers experience.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
