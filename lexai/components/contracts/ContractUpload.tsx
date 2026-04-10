'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, FileText, AlertCircle, CheckCircle, Sparkles } from 'lucide-react'
import { getRiskColor, getRiskLabel } from '@/lib/utils'
import type { ContractAnalysis, NegotiationResult } from '@/lib/claude'
import type { Plan } from '@/types/database'
import { NegotiationPanel } from './NegotiationPanel'

interface Props {
  userPlan: Plan
}

export function ContractUpload({ userPlan }: Props) {
  const router = useRouter()
  const [isDragging, setIsDragging] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<ContractAnalysis | null>(null)
  const [contractText, setContractText] = useState<string>('')
  const [pastedText, setPastedText] = useState('')
  const [mode, setMode] = useState<'upload' | 'paste'>('upload')

  // Per-flag negotiation state: flagIndex -> result | 'loading' | null
  const [negotiations, setNegotiations] = useState<
    Record<number, NegotiationResult | 'loading' | null>
  >({})

  const analyze = useCallback(
    async (formData: FormData, rawText: string) => {
      setIsAnalyzing(true)
      setError(null)
      setAnalysis(null)
      setContractText(rawText)
      setNegotiations({})

      try {
        const res = await fetch('/api/contracts', {
          method: 'POST',
          body: formData,
        })

        const data = await res.json()

        if (!res.ok) {
          setError(data.error ?? 'Analysis failed')
          return
        }

        setAnalysis(data.analysis)
        router.refresh()
      } catch {
        setError('Network error. Please try again.')
      } finally {
        setIsAnalyzing(false)
      }
    },
    [router]
  )

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.name.match(/\.(txt|pdf|doc|docx|md)$/i)) {
        setError('Please upload a .txt, .pdf, .doc, .docx, or .md file')
        return
      }
      const rawText = await file.text()
      const fd = new FormData()
      fd.append('file', file)
      analyze(fd, rawText)
    },
    [analyze]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handlePasteAnalyze = () => {
    if (!pastedText.trim()) {
      setError('Please paste some contract text first')
      return
    }
    const fd = new FormData()
    fd.append('text', pastedText)
    analyze(fd, pastedText)
  }

  const handleNegotiate = async (flagIndex: number, redFlag: string) => {
    // Toggle off if already showing
    if (negotiations[flagIndex] && negotiations[flagIndex] !== 'loading') {
      setNegotiations((prev) => ({ ...prev, [flagIndex]: null }))
      return
    }

    setNegotiations((prev) => ({ ...prev, [flagIndex]: 'loading' }))

    try {
      const res = await fetch('/api/contracts/negotiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ redFlag, contractText }),
      })

      const data = await res.json()

      if (!res.ok) {
        setNegotiations((prev) => ({ ...prev, [flagIndex]: null }))
        setError(data.error ?? 'Negotiation failed')
        return
      }

      setNegotiations((prev) => ({ ...prev, [flagIndex]: data as NegotiationResult }))
    } catch {
      setNegotiations((prev) => ({ ...prev, [flagIndex]: null }))
      setError('Network error during negotiation. Please try again.')
    }
  }

  const isPaidPlan = userPlan !== 'free'

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex gap-2">
        {(['upload', 'paste'] as const).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m)
              setError(null)
              setAnalysis(null)
            }}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors capitalize ${
              mode === m
                ? 'bg-lexai-600 text-white'
                : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'
            }`}
          >
            {m === 'upload' ? '⬆ Upload file' : '📋 Paste text'}
          </button>
        ))}
      </div>

      {mode === 'upload' ? (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
            isDragging
              ? 'border-lexai-400 bg-lexai-50'
              : 'border-gray-200 bg-white hover:border-lexai-300 hover:bg-lexai-50/30'
          }`}
        >
          <Upload className="mb-3 h-10 w-10 text-gray-300" />
          <p className="text-sm font-medium text-gray-700">
            Drop your contract here or{' '}
            <label className="cursor-pointer text-lexai-600 hover:underline">
              browse
              <input
                type="file"
                accept=".txt,.pdf,.doc,.docx,.md"
                className="sr-only"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </label>
          </p>
          <p className="mt-1 text-xs text-gray-400">TXT, PDF, DOC, DOCX, MD — max 10MB</p>
        </div>
      ) : (
        <div className="rounded-xl bg-white ring-1 ring-gray-200 p-4">
          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder="Paste your contract text here…"
            rows={8}
            className="w-full resize-none rounded-lg border border-gray-200 p-3 text-sm outline-none focus:ring-2 focus:ring-lexai-500"
          />
          <button
            onClick={handlePasteAnalyze}
            disabled={isAnalyzing}
            className="mt-3 rounded-lg bg-lexai-600 px-4 py-2 text-sm font-medium text-white hover:bg-lexai-700 disabled:opacity-50 transition-colors"
          >
            {isAnalyzing ? 'Analyzing…' : 'Analyze Contract'}
          </button>
        </div>
      )}

      {/* Loading state */}
      {isAnalyzing && (
        <div className="flex items-center gap-3 rounded-xl bg-lexai-50 p-5 ring-1 ring-lexai-200">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-lexai-600 border-t-transparent" />
          <div>
            <p className="font-medium text-lexai-800">Analyzing your contract…</p>
            <p className="text-sm text-lexai-600">
              Claude is reviewing clauses, identifying risks, and scoring the contract. This takes ~15
              seconds.
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl bg-red-50 p-4 ring-1 ring-red-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Analysis results */}
      {analysis && (
        <div className="animate-fade-in rounded-xl bg-white ring-1 ring-gray-200 overflow-hidden">
          {/* Risk score header */}
          <div
            className={`p-6 ${
              analysis.riskScore >= 70
                ? 'bg-red-50'
                : analysis.riskScore >= 40
                ? 'bg-amber-50'
                : 'bg-emerald-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Risk Score</p>
                <p className={`text-5xl font-bold mt-1 ${getRiskColor(analysis.riskScore)}`}>
                  {analysis.riskScore}
                  <span className="text-2xl">/100</span>
                </p>
                <p className={`mt-1 text-sm font-semibold ${getRiskColor(analysis.riskScore)}`}>
                  {getRiskLabel(analysis.riskScore)}
                </p>
              </div>
              <CheckCircle className="h-12 w-12 text-emerald-400 opacity-50" />
            </div>
            <p className="mt-3 text-sm text-gray-700">{analysis.riskSummary}</p>
          </div>

          <div className="grid gap-0 divide-y divide-gray-100 md:grid-cols-2 md:divide-x md:divide-y-0">
            {/* Red flags — with Negotiate button per flag */}
            <div className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-red-700">🚩 Red Flags</h4>
                {isPaidPlan && analysis.redFlags.length > 0 && (
                  <span className="text-xs text-gray-400 italic">Click ⚖️ to negotiate</span>
                )}
              </div>

              {analysis.redFlags.length > 0 ? (
                <ul className="space-y-3">
                  {analysis.redFlags.map((flag, i) => (
                    <li key={i} className="space-y-1">
                      <div className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                        <span className="flex-1 text-sm text-gray-700">{flag}</span>

                        {/* Negotiate button — paid plans only */}
                        {isPaidPlan && (
                          <button
                            onClick={() => handleNegotiate(i, flag)}
                            disabled={negotiations[i] === 'loading'}
                            title="Negotiate this clause with AI"
                            className={`flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                              negotiations[i] && negotiations[i] !== 'loading'
                                ? 'bg-lexai-100 text-lexai-700 hover:bg-lexai-200'
                                : 'bg-white text-lexai-600 ring-1 ring-lexai-200 hover:bg-lexai-50'
                            } disabled:opacity-50`}
                          >
                            {negotiations[i] === 'loading' ? (
                              <span className="h-3 w-3 animate-spin rounded-full border border-lexai-500 border-t-transparent" />
                            ) : (
                              <Sparkles className="h-3 w-3" />
                            )}
                            {negotiations[i] === 'loading'
                              ? 'Negotiating…'
                              : negotiations[i]
                              ? 'Hide'
                              : 'Negotiate'}
                          </button>
                        )}
                      </div>

                      {/* Inline negotiation result */}
                      {negotiations[i] && negotiations[i] !== 'loading' && (
                        <div className="ml-3">
                          <NegotiationPanel
                            result={negotiations[i] as NegotiationResult}
                            onClose={() =>
                              setNegotiations((prev) => ({ ...prev, [i]: null }))
                            }
                          />
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400">No major red flags found.</p>
              )}

              {/* Upsell for free users */}
              {!isPaidPlan && analysis.redFlags.length > 0 && (
                <div className="mt-3 rounded-lg bg-lexai-50 border border-lexai-200 p-3">
                  <p className="text-xs text-lexai-700 font-medium">
                    ⚖️ Upgrade to Starter to negotiate these clauses with AI
                  </p>
                  <a
                    href="/billing"
                    className="mt-1.5 inline-block rounded-md bg-lexai-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-lexai-700 transition-colors"
                  >
                    Upgrade Now
                  </a>
                </div>
              )}
            </div>

            {/* Missing protections */}
            <div className="p-5">
              <h4 className="mb-3 text-sm font-semibold text-amber-700">⚠️ Missing Protections</h4>
              {analysis.missingProtections.length > 0 ? (
                <ul className="space-y-1.5">
                  {analysis.missingProtections.map((item, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400">All standard protections present.</p>
              )}
            </div>
          </div>

          {/* Recommendations */}
          {analysis.recommendations.length > 0 && (
            <div className="border-t border-gray-100 p-5">
              <h4 className="mb-3 text-sm font-semibold text-lexai-700">💡 Recommendations</h4>
              <ul className="space-y-1.5">
                {analysis.recommendations.map((rec, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-lexai-400" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Plain English */}
          <div className="border-t border-gray-100 bg-gray-50 p-5">
            <h4 className="mb-2 text-sm font-semibold text-gray-700">📖 Plain English Summary</h4>
            <p className="text-sm text-gray-600 leading-relaxed">{analysis.plainEnglishSummary}</p>
          </div>
        </div>
      )}
    </div>
  )
}
