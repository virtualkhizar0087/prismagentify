'use client'

import { useState } from 'react'
import { CheckCircle, Copy, X, ArrowRight, Sparkles } from 'lucide-react'
import type { NegotiationResult } from '@/lib/claude'

interface Props {
  result: NegotiationResult
  onClose: () => void
}

export function NegotiationPanel({ result, onClose }: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(result.negotiatedClause)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mt-2 rounded-xl border border-lexai-200 bg-white shadow-sm overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between bg-lexai-50 px-4 py-3 border-b border-lexai-100">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-lexai-600" />
          <span className="text-sm font-semibold text-lexai-800">AI Negotiation</span>
          <span className="rounded-full bg-lexai-600 px-2 py-0.5 text-xs font-medium text-white">
            {result.favorabilityImprovement}
          </span>
        </div>
        <button
          onClick={onClose}
          className="rounded p-1 text-gray-400 hover:bg-lexai-100 hover:text-gray-600 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-4 space-y-3">
        {/* Side-by-side diff */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {/* Original */}
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-red-500">
              Original (Risky)
            </p>
            <div className="rounded-lg bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-800 leading-relaxed whitespace-pre-wrap">
                {result.originalClause}
              </p>
            </div>
          </div>

          {/* Arrow — desktop only */}
          <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center justify-center">
            <ArrowRight className="h-5 w-5 text-gray-400" />
          </div>

          {/* Negotiated */}
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-600">
              Negotiated (Protects You)
            </p>
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
              <p className="text-sm text-emerald-800 leading-relaxed whitespace-pre-wrap">
                {result.negotiatedClause}
              </p>
            </div>
          </div>
        </div>

        {/* Explanation */}
        <div className="rounded-lg bg-gray-50 border border-gray-100 p-3 flex items-start gap-2">
          <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-lexai-500" />
          <p className="text-sm text-gray-700">{result.explanation}</p>
        </div>

        {/* Copy button */}
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 rounded-lg bg-lexai-600 px-4 py-2 text-sm font-medium text-white hover:bg-lexai-700 transition-colors"
        >
          {copied ? (
            <>
              <CheckCircle className="h-4 w-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy Negotiated Clause
            </>
          )}
        </button>
      </div>
    </div>
  )
}
