'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import {
  Microscope, Loader2, Scale, AlertCircle, ChevronDown,
  TrendingUp, TrendingDown, Target, Shield, Zap,
} from 'lucide-react'
import { LAW_CATEGORIES } from '@/types/database'

export default function AnalyzePage() {
  const [facts, setFacts] = useState('')
  const [category, setCategory] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState('')
  const [hasAnalyzed, setHasAnalyzed] = useState(false)

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault()
    if (!facts.trim()) {
      setError('Please provide case facts to analyze.')
      return
    }
    setError('')
    setAnalysis('')
    setIsAnalyzing(true)
    setIsStreaming(true)
    setHasAnalyzed(true)

    try {
      const res = await fetch('/api/precedents/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facts, category }),
      })

      if (!res.ok) throw new Error('Analysis failed')
      if (!res.body) throw new Error('No stream')

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
              if (parsed.text) setAnalysis(prev => prev + parsed.text)
            } catch {}
          }
        }
      }
    } catch {
      setError('Analysis failed. Please try again.')
      setHasAnalyzed(false)
    } finally {
      setIsAnalyzing(false)
      setIsStreaming(false)
    }
  }

  function handleReset() {
    setAnalysis('')
    setFacts('')
    setCategory('')
    setError('')
    setHasAnalyzed(false)
  }

  const ANALYSIS_SECTIONS = [
    { icon: Scale, label: 'Applicable Laws', color: 'text-blue-600', bg: 'bg-blue-50' },
    { icon: BookIcon, label: 'Relevant Precedents', color: 'text-purple-600', bg: 'bg-purple-50' },
    { icon: TrendingUp, label: 'Strengths', color: 'text-green-600', bg: 'bg-green-50' },
    { icon: TrendingDown, label: 'Weaknesses / Risks', color: 'text-red-600', bg: 'bg-red-50' },
    { icon: Target, label: 'Predicted Outcome', color: 'text-lexai-600', bg: 'bg-lexai-50' },
    { icon: Zap, label: 'Recommended Strategy', color: 'text-amber-600', bg: 'bg-amber-50' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white px-6 py-5">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center gap-2 mb-1">
            <Microscope className="h-5 w-5 text-lexai-600" />
            <h1 className="text-xl font-bold text-gray-900">Case Analyzer</h1>
          </div>
          <p className="text-sm text-gray-500">
            Paste your case facts and AI will find relevant precedents, identify applicable laws, and predict the likely outcome.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-6">
        <div className={`grid gap-6 ${hasAnalyzed ? 'lg:grid-cols-5' : 'lg:grid-cols-1 max-w-2xl mx-auto'}`}>
          {/* Input Panel */}
          <div className={hasAnalyzed ? 'lg:col-span-2' : ''}>
            <form onSubmit={handleAnalyze} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Microscope className="h-4 w-4 text-lexai-600" />
                <h2 className="text-sm font-semibold text-gray-700">Describe Your Case</h2>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">Area of Law</label>
                <div className="relative">
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2.5 pr-8 text-sm focus:border-lexai-400 focus:outline-none focus:ring-2 focus:ring-lexai-100"
                  >
                    <option value="">Auto-detect from facts</option>
                    {LAW_CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">
                  Case Facts *
                </label>
                <textarea
                  value={facts}
                  onChange={e => setFacts(e.target.value)}
                  required
                  rows={hasAnalyzed ? 12 : 8}
                  placeholder={`Describe your case facts in detail. For example:

"My client Muhammad Ali purchased a property in Lahore in 2018 for Rs. 5 million. The seller Abdul Karim provided a title deed which later turned out to have a forged mutation. The original owner Haji Akbar has now filed suit for recovery of possession. My client is currently in possession and has made improvements worth Rs. 2 million to the property..."

The more detail you provide, the better the analysis.`}
                  className="w-full resize-y rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-lexai-400 focus:outline-none focus:ring-2 focus:ring-lexai-100"
                />
                <p className="mt-1 text-xs text-gray-400">{facts.length} / 5000 characters</p>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-xs text-red-700">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isAnalyzing || !facts.trim()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-lexai-600 px-5 py-3 text-sm font-semibold text-white hover:bg-lexai-700 disabled:opacity-60 transition-colors"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyzing…
                    </>
                  ) : (
                    <>
                      <Microscope className="h-4 w-4" />
                      Analyze Case
                    </>
                  )}
                </button>
                {hasAnalyzed && (
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

            {/* What you get */}
            {!hasAnalyzed && (
              <div className="mt-4 rounded-xl border border-gray-100 bg-white p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">What you'll receive</p>
                <ul className="space-y-2">
                  {ANALYSIS_SECTIONS.map(s => (
                    <li key={s.label} className="flex items-center gap-2.5 text-xs text-gray-600">
                      <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${s.bg}`}>
                        <s.icon className={`h-3 w-3 ${s.color}`} />
                      </div>
                      {s.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Analysis Output */}
          {hasAnalyzed && (
            <div className="lg:col-span-3">
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-5 py-3 rounded-t-xl">
                  <Shield className="h-4 w-4 text-lexai-600" />
                  <span className="text-sm font-semibold text-gray-700">Case Analysis</span>
                  {isStreaming && (
                    <span className="ml-auto flex items-center gap-1 text-xs text-lexai-500">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Analyzing case law…
                    </span>
                  )}
                </div>

                {isAnalyzing && !analysis ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <Loader2 className="mb-3 h-8 w-8 animate-spin text-lexai-500" />
                    <p className="text-sm">Searching Pakistani case law…</p>
                    <p className="mt-1 text-xs">Finding relevant precedents and analyzing your facts</p>
                  </div>
                ) : (
                  <div className="max-h-[75vh] overflow-y-auto p-5">
                    <div className="prose prose-sm max-w-none text-gray-800">
                      <ReactMarkdown>{analysis}</ReactMarkdown>
                    </div>
                    {isStreaming && (
                      <span className="inline-block h-4 w-0.5 animate-pulse bg-lexai-600 mt-1" />
                    )}
                  </div>
                )}

                {!isStreaming && analysis && (
                  <div className="border-t border-gray-100 px-5 py-3 flex gap-2 flex-wrap">
                    <button
                      onClick={() => navigator.clipboard.writeText(analysis)}
                      className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
                    >
                      Copy Analysis
                    </button>
                    <a
                      href="/precedents/argue"
                      className="rounded-lg bg-lexai-50 px-3 py-1.5 text-xs font-medium text-lexai-700 hover:bg-lexai-100"
                    >
                      Build Full Argument →
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Placeholder for BookIcon since lucide doesn't have it by that name
function BookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  )
}
