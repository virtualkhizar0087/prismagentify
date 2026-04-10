'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft, Star, Bookmark, BookmarkCheck, Share2, Scale,
  Building2, Calendar, Gavel, BookOpen, FileText, ChevronDown,
  ChevronUp, Loader2, AlertCircle, Tag, ExternalLink, Wand2,
} from 'lucide-react'
import type { Precedent } from '@/types/database'

interface CaseDetailData {
  case: Precedent
  isSaved: boolean
  savedNotes: string | null
}

const CATEGORY_COLORS: Record<string, string> = {
  Criminal: 'bg-red-100 text-red-700 border-red-200',
  Civil: 'bg-blue-100 text-blue-700 border-blue-200',
  Constitutional: 'bg-purple-100 text-purple-700 border-purple-200',
  Family: 'bg-pink-100 text-pink-700 border-pink-200',
  Commercial: 'bg-amber-100 text-amber-700 border-amber-200',
  Property: 'bg-orange-100 text-orange-700 border-orange-200',
  'Islamic/Shariat': 'bg-teal-100 text-teal-700 border-teal-200',
  'Anti-Terrorism': 'bg-gray-200 text-gray-800 border-gray-300',
  'NAB/Accountability': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Human Rights': 'bg-green-100 text-green-700 border-green-200',
  Banking: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  'Cyber Crime': 'bg-violet-100 text-violet-700 border-violet-200',
}

export default function CaseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [data, setData] = useState<CaseDetailData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [relatedCases, setRelatedCases] = useState<Precedent[]>([])
  const [showFullText, setShowFullText] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [notes, setNotes] = useState('')
  const [showNotes, setShowNotes] = useState(false)
  const [shareMsg, setShareMsg] = useState('')

  useEffect(() => {
    async function fetchCase() {
      try {
        const res = await fetch(`/api/precedents/${id}`)
        if (!res.ok) throw new Error('Case not found')
        const json = await res.json()
        setData(json)
        setIsSaved(json.isSaved)
        setNotes(json.savedNotes ?? '')
      } catch {
        setError('Failed to load case. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    async function fetchRelated() {
      try {
        const res = await fetch(`/api/precedents/${id}/related`)
        if (res.ok) {
          const json = await res.json()
          setRelatedCases(json.cases ?? [])
        }
      } catch {}
    }

    fetchCase()
    fetchRelated()
  }, [id])

  async function handleSaveToggle() {
    if (!data) return
    setIsSaving(true)
    try {
      const res = await fetch('/api/precedents/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          precedentId: id,
          notes,
          folder: 'General',
          action: isSaved ? 'unsave' : 'save',
        }),
      })
      if (res.ok) {
        setIsSaved(!isSaved)
        setShowNotes(!isSaved)
      }
    } catch {}
    setIsSaving(false)
  }

  async function handleUpdateNotes() {
    try {
      await fetch('/api/precedents/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ precedentId: id, notes, folder: 'General', action: 'update' }),
      })
    } catch {}
  }

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setShareMsg('Link copied!')
      setTimeout(() => setShareMsg(''), 2000)
    } catch {}
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-lexai-500" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <AlertCircle className="h-10 w-10 text-red-400" />
        <p className="text-gray-600">{error || 'Case not found'}</p>
        <button onClick={() => router.push('/precedents')} className="text-lexai-600 hover:underline">
          Back to Case Law
        </button>
      </div>
    )
  }

  const c = data.case
  const catColor = CATEGORY_COLORS[c.law_category] ?? 'bg-gray-100 text-gray-700 border-gray-200'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="border-b border-gray-200 bg-white px-6 py-3">
        <div className="mx-auto max-w-6xl flex items-center gap-2 text-sm text-gray-500">
          <button onClick={() => router.push('/precedents')} className="flex items-center gap-1 hover:text-lexai-600">
            <ArrowLeft className="h-3.5 w-3.5" />
            Case Law
          </button>
          <span>/</span>
          <span className="text-gray-400">{c.law_category}</span>
          <span>/</span>
          <span className="truncate text-gray-900 font-medium max-w-xs">{c.case_name}</span>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-6">
        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="mb-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-3 flex flex-wrap items-start gap-2">
                {c.is_landmark && (
                  <span className="flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-semibold text-yellow-700">
                    <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                    Landmark Case
                  </span>
                )}
                <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${catColor}`}>
                  {c.law_category}
                </span>
                {c.law_subcategory && (
                  <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs text-gray-600">
                    {c.law_subcategory}
                  </span>
                )}
              </div>

              <h1 className="mb-3 text-xl font-bold text-gray-900 leading-snug">{c.case_name}</h1>

              {c.citation && (
                <div className="mb-4">
                  <span className="rounded-lg bg-lexai-50 px-3 py-1.5 font-mono text-sm font-semibold text-lexai-700">
                    {c.citation}
                  </span>
                </div>
              )}

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { icon: Building2, label: 'Court', value: c.court_code },
                  { icon: Calendar, label: 'Year', value: c.year?.toString() ?? '—' },
                  { icon: Scale, label: 'Bench', value: c.bench_type ?? '—' },
                  { icon: Tag, label: 'Outcome', value: c.outcome ?? '—' },
                ].map(m => (
                  <div key={m.label} className="rounded-lg bg-gray-50 px-3 py-2.5">
                    <div className="mb-1 flex items-center gap-1.5 text-xs text-gray-400">
                      <m.icon className="h-3 w-3" />
                      {m.label}
                    </div>
                    <p className="text-sm font-semibold text-gray-800 truncate">{m.value}</p>
                  </div>
                ))}
              </div>

              {/* Parties */}
              {(c.appellant || c.respondent) && (
                <div className="mt-4 flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-3 text-sm">
                  <div className="flex-1">
                    <span className="text-xs text-gray-400 block mb-0.5">Appellant / Petitioner</span>
                    <span className="font-medium text-gray-900">{c.appellant ?? '—'}</span>
                  </div>
                  <span className="text-gray-300 font-bold">vs</span>
                  <div className="flex-1 text-right">
                    <span className="text-xs text-gray-400 block mb-0.5">Respondent</span>
                    <span className="font-medium text-gray-900">{c.respondent ?? '—'}</span>
                  </div>
                </div>
              )}

              {/* Judges */}
              {c.judge_names && c.judge_names.length > 0 && (
                <div className="mt-4">
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-gray-400">
                    <Gavel className="h-3 w-3" />
                    Bench
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {c.judge_names.map((j, i) => (
                      <span key={i} className="rounded-full bg-lexai-50 px-2.5 py-1 text-xs text-lexai-700">
                        {j}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Statutes */}
              {c.statutes && c.statutes.length > 0 && (
                <div className="mt-4">
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-gray-400">
                    <BookOpen className="h-3 w-3" />
                    Statutes Referenced
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {c.statutes.map((s, i) => (
                      <span key={i} className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-700">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Keywords */}
              {c.keywords && c.keywords.length > 0 && (
                <div className="mt-4">
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-gray-400">
                    <Tag className="h-3 w-3" />
                    Keywords
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {c.keywords.map((k, i) => (
                      <span key={i} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600">
                        #{k}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Headnotes */}
            {c.headnotes && (
              <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 p-5">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-blue-800">
                  <BookOpen className="h-4 w-4" />
                  Headnotes
                </h2>
                <p className="text-sm leading-relaxed text-blue-900">{c.headnotes}</p>
              </div>
            )}

            {/* Holding */}
            {c.holding && (
              <div className="mb-4 rounded-xl border border-green-100 bg-green-50 p-5">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-green-800">
                  <Scale className="h-4 w-4" />
                  Holding / Ratio Decidendi
                  <span className="ml-1 rounded-full bg-green-200 px-2 py-0.5 text-[10px] text-green-800">Most Important</span>
                </h2>
                <p className="text-sm leading-relaxed text-green-900">{c.holding}</p>
              </div>
            )}

            {/* Landmark Reason */}
            {c.is_landmark && c.landmark_reason && (
              <div className="mb-4 rounded-xl border border-yellow-200 bg-yellow-50 p-5">
                <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-yellow-800">
                  <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                  Why This Case is Landmark
                </h2>
                <p className="text-sm text-yellow-900">{c.landmark_reason}</p>
              </div>
            )}

            {/* Full Text */}
            {c.full_text && (
              <div className="mb-4 rounded-xl border border-gray-200 bg-white">
                <button
                  onClick={() => setShowFullText(!showFullText)}
                  className="flex w-full items-center justify-between p-4 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    Full Judgment Text
                  </div>
                  {showFullText ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                </button>
                {showFullText && (
                  <div className="border-t border-gray-100 p-5">
                    <p className="whitespace-pre-wrap text-xs leading-relaxed text-gray-600 font-mono">
                      {c.full_text}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Related Cases */}
            {relatedCases.length > 0 && (
              <div>
                <h2 className="mb-4 text-base font-semibold text-gray-900">Related Cases</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {relatedCases.map(rc => (
                    <button
                      key={rc.id}
                      onClick={() => router.push(`/precedents/${rc.id}`)}
                      className="rounded-xl border border-gray-200 bg-white p-4 text-left hover:border-lexai-300 hover:shadow-sm transition-all group"
                    >
                      <p className="text-sm font-medium text-gray-900 group-hover:text-lexai-700 line-clamp-2 mb-1">
                        {rc.case_name}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {rc.citation && (
                          <span className="text-xs font-mono text-lexai-600">{rc.citation}</span>
                        )}
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${CATEGORY_COLORS[rc.law_category] ?? 'bg-gray-100 text-gray-600'}`}>
                          {rc.law_category}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="w-64 shrink-0 space-y-4">
            {/* Save Button */}
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={handleSaveToggle}
                  disabled={isSaving}
                  className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                    isSaved
                      ? 'bg-lexai-100 text-lexai-700 hover:bg-lexai-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isSaved ? (
                    <BookmarkCheck className="h-4 w-4" />
                  ) : (
                    <Bookmark className="h-4 w-4" />
                  )}
                  {isSaved ? 'Saved' : 'Save Case'}
                </button>

                <button
                  onClick={() => router.push(`/precedents/argue?caseId=${id}`)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-lexai-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-lexai-700 transition-colors"
                >
                  <Wand2 className="h-4 w-4" />
                  Build Argument
                </button>

                <button
                  onClick={handleShare}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  <Share2 className="h-4 w-4" />
                  {shareMsg || 'Share Case'}
                </button>

                {c.source_url && (
                  <a
                    href={c.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Original Source
                  </a>
                )}
              </div>
            </div>

            {/* Notes */}
            {(isSaved || showNotes) && (
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Your Notes</h3>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  onBlur={handleUpdateNotes}
                  placeholder="Add your notes about this case..."
                  rows={4}
                  className="w-full resize-none rounded-lg border border-gray-200 p-2.5 text-xs text-gray-700 focus:border-lexai-400 focus:outline-none focus:ring-1 focus:ring-lexai-200"
                />
                <button
                  onClick={handleUpdateNotes}
                  className="mt-2 w-full rounded-lg bg-gray-100 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200"
                >
                  Save Notes
                </button>
              </div>
            )}

            {/* Quick Info */}
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Case Info</h3>
              <dl className="space-y-2 text-xs">
                <div>
                  <dt className="text-gray-400">Court</dt>
                  <dd className="font-medium text-gray-700">{c.court}</dd>
                </div>
                {c.date_decided && (
                  <div>
                    <dt className="text-gray-400">Date Decided</dt>
                    <dd className="font-medium text-gray-700">{new Date(c.date_decided).toLocaleDateString('en-PK')}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-gray-400">Citation Type</dt>
                  <dd className="font-medium text-gray-700">{c.citation_type ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-gray-400">Views</dt>
                  <dd className="font-medium text-gray-700">{c.view_count}</dd>
                </div>
                <div>
                  <dt className="text-gray-400">Source</dt>
                  <dd className="font-medium text-gray-700">{c.source ?? 'Court Records'}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
