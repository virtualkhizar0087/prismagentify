'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import {
  Wand2, Loader2, Scale, ChevronDown, AlertCircle, Clock,
  BookOpen, ArrowRight, Trash2,
} from 'lucide-react'
import type { LegalArgument } from '@/types/database'
import { LAW_CATEGORIES } from '@/types/database'

const POSITIONS = [
  'Plaintiff', 'Defendant', 'Prosecution', 'Defence',
  'Petitioner', 'Respondent', 'Appellant',
]

export default function ArguePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const prefillCaseId = searchParams.get('caseId')

  const [position, setPosition] = useState('Petitioner')
  const [category, setCategory] = useState('')
  const [disputeType, setDisputeType] = useState('')
  const [facts, setFacts] = useState('')
  const [parties, setParties] = useState('')
  const [relief, setRelief] = useState('')

  const [isBuilding, setIsBuilding] = useState(false)
  const [argument, setArgument] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState('')

  const [savedArguments, setSavedArguments] = useState<LegalArgument[]>([])
  const [isLoadingSaved, setIsLoadingSaved] = useState(true)

  useEffect(() => {
    async function loadSaved() {
      try {
        const res = await fetch('/api/precedents/saved-arguments')
        if (res.ok) {
          const data = await res.json()
          setSavedArguments(data.arguments ?? [])
        }
      } catch {}
      setIsLoadingSaved(false)
    }
    loadSaved()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!facts.trim()) {
      setError('Please provide case facts.')
      return
    }
    setError('')
    setArgument('')
    setIsBuilding(true)
    setIsStreaming(true)

    try {
      const res = await fetch('/api/precedents/argue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position, category, disputeType, facts, parties, relief }),
      })

      if (!res.ok) throw new Error('Failed to build argument')
      if (!res.body) throw new Error('No response stream')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') break
            try {
              const parsed = JSON.parse(data)
              if (parsed.text) setArgument(prev => prev + parsed.text)
            } catch {}
          }
        }
      }

      // Refresh saved arguments
      const savedRes = await fetch('/api/precedents/saved-arguments')
      if (savedRes.ok) {
        const saved = await savedRes.json()
        setSavedArguments(saved.arguments ?? [])
      }
    } catch (err) {
      setError('Failed to build argument. Please try again.')
    } finally {
      setIsBuilding(false)
      setIsStreaming(false)
    }
  }

  function handleReset() {
    setArgument('')
    setPosition('Petitioner')
    setCategory('')
    setDisputeType('')
    setFacts('')
    setParties('')
    setRelief('')
    setError('')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white px-6 py-5">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center gap-2 mb-1">
            <Wand2 className="h-5 w-5 text-lexai-600" />
            <h1 className="text-xl font-bold text-gray-900">AI Legal Argument Builder</h1>
          </div>
          <p className="text-sm text-gray-500">
            Describe your case and AI will build a comprehensive legal argument citing Pakistani precedents and statutes.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Form */}
          <div>
            <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-semibold text-gray-700">Case Details</h2>

              {/* Position */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">Your Position *</label>
                <div className="relative">
                  <select
                    value={position}
                    onChange={e => setPosition(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2.5 pr-8 text-sm focus:border-lexai-400 focus:outline-none focus:ring-2 focus:ring-lexai-100"
                  >
                    {POSITIONS.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">Area of Law</label>
                <div className="relative">
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2.5 pr-8 text-sm focus:border-lexai-400 focus:outline-none focus:ring-2 focus:ring-lexai-100"
                  >
                    <option value="">Select area of law…</option>
                    {LAW_CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              {/* Dispute Type */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">Type of Dispute</label>
                <input
                  type="text"
                  value={disputeType}
                  onChange={e => setDisputeType(e.target.value)}
                  placeholder="e.g. property dispute, murder trial, divorce proceedings"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-lexai-400 focus:outline-none focus:ring-2 focus:ring-lexai-100"
                />
              </div>

              {/* Case Facts */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">
                  Case Facts *{' '}
                  <span className="font-normal text-gray-400">(the more detail, the better the argument)</span>
                </label>
                <textarea
                  value={facts}
                  onChange={e => setFacts(e.target.value)}
                  required
                  rows={6}
                  placeholder="Describe the facts of your case in detail. Include key events, dates, parties involved, what happened, what the dispute is about, and what evidence is available..."
                  className="w-full resize-y rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-lexai-400 focus:outline-none focus:ring-2 focus:ring-lexai-100"
                />
                <p className="mt-1 text-xs text-gray-400">{facts.length} characters</p>
              </div>

              {/* Relevant Parties */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">Relevant Parties</label>
                <input
                  type="text"
                  value={parties}
                  onChange={e => setParties(e.target.value)}
                  placeholder="e.g. Muhammad Ali (plaintiff), XYZ Company (defendant)"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-lexai-400 focus:outline-none focus:ring-2 focus:ring-lexai-100"
                />
              </div>

              {/* Relief Sought */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">Relief Sought</label>
                <input
                  type="text"
                  value={relief}
                  onChange={e => setRelief(e.target.value)}
                  placeholder="e.g. injunction, damages of Rs. 5 million, acquittal, dissolution of marriage"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-lexai-400 focus:outline-none focus:ring-2 focus:ring-lexai-100"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-xs text-red-700">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isBuilding || !facts.trim()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-lexai-600 px-5 py-3 text-sm font-semibold text-white hover:bg-lexai-700 disabled:opacity-60 transition-colors"
                >
                  {isBuilding ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Building Argument…
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4" />
                      Build Legal Argument
                    </>
                  )}
                </button>
                {argument && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-500 hover:bg-gray-50"
                  >
                    Reset
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Output */}
          <div className="space-y-4">
            {(argument || isStreaming) ? (
              <div className="rounded-xl border border-lexai-200 bg-white shadow-sm">
                <div className="flex items-center gap-2 border-b border-lexai-100 bg-lexai-50 px-5 py-3 rounded-t-xl">
                  <Scale className="h-4 w-4 text-lexai-600" />
                  <span className="text-sm font-semibold text-lexai-700">Legal Argument</span>
                  {isStreaming && (
                    <span className="ml-auto flex items-center gap-1 text-xs text-lexai-500">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Building…
                    </span>
                  )}
                </div>
                <div className="max-h-[70vh] overflow-y-auto p-5">
                  <div className="prose prose-sm max-w-none text-gray-800">
                    <ReactMarkdown>{argument}</ReactMarkdown>
                  </div>
                  {isStreaming && (
                    <span className="inline-block h-4 w-0.5 animate-pulse bg-lexai-600 mt-1" />
                  )}
                </div>
                {!isStreaming && argument && (
                  <div className="border-t border-gray-100 px-5 py-3 flex gap-2">
                    <button
                      onClick={() => navigator.clipboard.writeText(argument)}
                      className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
                    >
                      Copy Argument
                    </button>
                    <button
                      onClick={() => router.push('/precedents')}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                    >
                      Search More Cases
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-200 bg-white p-8 text-center">
                <Wand2 className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                <p className="text-sm font-medium text-gray-500">Your argument will appear here</p>
                <p className="mt-1 text-xs text-gray-400">
                  Fill in the case details and click "Build Legal Argument"
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Saved Arguments */}
        {savedArguments.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-4 text-base font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              Previous Arguments
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {savedArguments.map(arg => (
                <div
                  key={arg.id}
                  className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <p className="mb-1 text-sm font-medium text-gray-900 line-clamp-1">{arg.title}</p>
                  <p className="mb-2 text-xs text-gray-400 line-clamp-2">{arg.query}</p>
                  <div className="flex items-center justify-between">
                    {arg.law_category && (
                      <span className="rounded-full bg-lexai-50 px-2 py-0.5 text-[10px] text-lexai-700">
                        {arg.law_category}
                      </span>
                    )}
                    <span className="text-[10px] text-gray-400">
                      {new Date(arg.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {arg.argument_text && (
                    <button
                      onClick={() => setArgument(arg.argument_text!)}
                      className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg bg-gray-50 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100"
                    >
                      <BookOpen className="h-3 w-3" />
                      View Argument
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
