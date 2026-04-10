'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import {
  Search, X, Star, ChevronDown, ChevronUp, Scale, BookOpen,
  Filter, ArrowRight, Bot, Loader2, Building2, Calendar, Tag,
  Gavel, AlertCircle,
} from 'lucide-react'
import type { Precedent } from '@/types/database'
import { COURTS, LAW_CATEGORIES } from '@/types/database'

const CATEGORY_TABS = [
  'All', 'Criminal', 'Civil', 'Constitutional', 'Family', 'Commercial',
  'Property', 'Islamic/Shariat', 'Anti-Terrorism', 'NAB/Accountability',
  'Human Rights', 'Banking', 'Labour', 'Tax', 'Cyber Crime',
]

const CATEGORY_COLORS: Record<string, string> = {
  Criminal: 'border-red-500 bg-red-50',
  Civil: 'border-blue-500 bg-blue-50',
  Constitutional: 'border-purple-500 bg-purple-50',
  Family: 'border-pink-500 bg-pink-50',
  Commercial: 'border-amber-500 bg-amber-50',
  Property: 'border-orange-500 bg-orange-50',
  'Islamic/Shariat': 'border-teal-500 bg-teal-50',
  'Anti-Terrorism': 'border-gray-800 bg-gray-50',
  'NAB/Accountability': 'border-yellow-600 bg-yellow-50',
  'Human Rights': 'border-green-500 bg-green-50',
  Banking: 'border-indigo-500 bg-indigo-50',
  Labour: 'border-cyan-500 bg-cyan-50',
  Tax: 'border-lime-500 bg-lime-50',
  'Cyber Crime': 'border-violet-500 bg-violet-50',
  Environmental: 'border-emerald-500 bg-emerald-50',
}

const CATEGORY_BADGE_COLORS: Record<string, string> = {
  Criminal: 'bg-red-100 text-red-700',
  Civil: 'bg-blue-100 text-blue-700',
  Constitutional: 'bg-purple-100 text-purple-700',
  Family: 'bg-pink-100 text-pink-700',
  Commercial: 'bg-amber-100 text-amber-700',
  Property: 'bg-orange-100 text-orange-700',
  'Islamic/Shariat': 'bg-teal-100 text-teal-700',
  'Anti-Terrorism': 'bg-gray-200 text-gray-800',
  'NAB/Accountability': 'bg-yellow-100 text-yellow-800',
  'Human Rights': 'bg-green-100 text-green-700',
  Banking: 'bg-indigo-100 text-indigo-700',
  Labour: 'bg-cyan-100 text-cyan-700',
  Tax: 'bg-lime-100 text-lime-700',
  'Cyber Crime': 'bg-violet-100 text-violet-700',
  Environmental: 'bg-emerald-100 text-emerald-700',
}

const OUTCOME_COLORS: Record<string, string> = {
  'Petition allowed': 'bg-green-100 text-green-700',
  'Petition dismissed': 'bg-red-100 text-red-700',
  'Appeal allowed': 'bg-green-100 text-green-700',
  'Appeal dismissed': 'bg-red-100 text-red-700',
  'Conviction set aside': 'bg-green-100 text-green-700',
  'Conviction maintained': 'bg-red-100 text-red-700',
  default: 'bg-gray-100 text-gray-700',
}

const QUICK_CATEGORIES = [
  { label: 'Criminal', icon: '⚔️', desc: 'Murder, theft, drug offenses, bail' },
  { label: 'Civil', icon: '📋', desc: 'Contracts, torts, civil procedure' },
  { label: 'Constitutional', icon: '🏛️', desc: 'Fundamental rights, constitutional law' },
  { label: 'Family', icon: '👨‍👩‍👧', desc: 'Divorce, custody, maintenance, inheritance' },
  { label: 'Commercial', icon: '💼', desc: 'Business, company, contract law' },
  { label: 'Human Rights', icon: '✊', desc: 'Fundamental rights, disappearances' },
]

function OutcomeBadge({ outcome }: { outcome: string | null }) {
  if (!outcome) return null
  const color = Object.entries(OUTCOME_COLORS).find(([key]) =>
    outcome.toLowerCase().includes(key.toLowerCase())
  )?.[1] ?? OUTCOME_COLORS.default
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
      {outcome.length > 30 ? outcome.slice(0, 30) + '…' : outcome}
    </span>
  )
}

function CaseCard({ precedent, onClick }: { precedent: Precedent; onClick: () => void }) {
  const borderColor = CATEGORY_COLORS[precedent.law_category] ?? 'border-gray-400 bg-gray-50'
  const badgeColor = CATEGORY_BADGE_COLORS[precedent.law_category] ?? 'bg-gray-100 text-gray-700'
  const borderClass = borderColor.split(' ')[0]

  return (
    <div
      className={`relative rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-all cursor-pointer border-l-4 ${borderClass}`}
      onClick={onClick}
    >
      {precedent.is_landmark && (
        <span className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-700">
          <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
          Landmark
        </span>
      )}

      <div className="mb-2 pr-20">
        <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">
          {precedent.case_name}
        </h3>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {precedent.citation && (
          <span className="rounded bg-lexai-50 px-2 py-0.5 text-xs font-mono font-medium text-lexai-700">
            {precedent.citation}
          </span>
        )}
        <span className="flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
          <Building2 className="h-3 w-3" />
          {precedent.court_code}
        </span>
        {precedent.year && (
          <span className="flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
            <Calendar className="h-3 w-3" />
            {precedent.year}
          </span>
        )}
        <OutcomeBadge outcome={precedent.outcome} />
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeColor}`}>
          {precedent.law_category}
        </span>
        {precedent.law_subcategory && (
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">
            {precedent.law_subcategory}
          </span>
        )}
      </div>

      {precedent.headnotes && (
        <p className="mb-3 text-xs text-gray-500 line-clamp-2 leading-relaxed">
          {precedent.headnotes}
        </p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {precedent.statutes?.slice(0, 2).map((s, i) => (
            <span key={i} className="rounded bg-lexai-50 px-1.5 py-0.5 text-[10px] text-lexai-600">
              {s.length > 25 ? s.slice(0, 25) + '…' : s}
            </span>
          ))}
        </div>
        <button className="flex items-center gap-1 text-xs font-medium text-lexai-600 hover:text-lexai-700 whitespace-nowrap">
          View Case <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      {precedent.judge_names && precedent.judge_names.length > 0 && (
        <div className="mt-2 flex items-center gap-1 text-[10px] text-gray-400">
          <Gavel className="h-3 w-3" />
          {precedent.judge_names.slice(0, 2).join(', ')}
          {precedent.judge_names.length > 2 && ` +${precedent.judge_names.length - 2} more`}
        </div>
      )}
    </div>
  )
}

export default function PrecedentsPage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Precedent[]>([])
  const [aiAnswer, setAiAnswer] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [totalResults, setTotalResults] = useState(0)
  const [activeTab, setActiveTab] = useState('All')
  const [showFilters, setShowFilters] = useState(false)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    court: '',
    yearFrom: '',
    yearTo: '',
    landmarkOnly: false,
  })
  const abortRef = useRef<AbortController | null>(null)

  const doSearch = useCallback(async (overrideQuery?: string, overrideCategory?: string) => {
    const q = overrideQuery ?? query
    const category = overrideCategory ?? (activeTab === 'All' ? '' : activeTab)

    setIsSearching(true)
    setHasSearched(true)
    setError('')
    setAiAnswer('')
    setResults([])

    try {
      const res = await fetch('/api/precedents/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          court: filters.court,
          category,
          yearFrom: filters.yearFrom ? parseInt(filters.yearFrom) : null,
          yearTo: filters.yearTo ? parseInt(filters.yearTo) : null,
          landmarkOnly: filters.landmarkOnly,
          limit: 20,
          offset: 0,
        }),
      })

      if (!res.ok) throw new Error('Search failed')
      const data = await res.json()
      setResults(data.results ?? [])
      setTotalResults(data.total ?? 0)

      // Now stream AI answer if there's a query
      if (q.trim() && (data.results?.length ?? 0) > 0) {
        setIsStreaming(true)
        abortRef.current = new AbortController()

        const answerRes = await fetch('/api/precedents/answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: q, cases: data.results?.slice(0, 8) }),
          signal: abortRef.current.signal,
        })

        if (answerRes.ok && answerRes.body) {
          const reader = answerRes.body.getReader()
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
                  if (parsed.text) setAiAnswer(prev => prev + parsed.text)
                } catch {}
              }
            }
          }
        }
        setIsStreaming(false)
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError('Search failed. Please try again.')
      }
    } finally {
      setIsSearching(false)
      setIsStreaming(false)
    }
  }, [query, activeTab, filters])

  function handleCategoryClick(cat: string) {
    setActiveTab(cat)
    doSearch(query, cat === 'All' ? '' : cat)
  }

  function handleQuickCategory(cat: string) {
    setActiveTab(cat)
    doSearch('', cat)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-1 flex items-center gap-2">
            <Scale className="h-6 w-6 text-lexai-600" />
            <h1 className="text-2xl font-bold text-gray-900">Case Law</h1>
          </div>
          <p className="text-sm text-gray-500">
            Search 25+ years of Pakistani court judgments — Supreme Court, High Courts, Federal Shariat Court
          </p>

          {/* Stats */}
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1">
            {[
              { label: '30+ Cases', sub: 'in database' },
              { label: '8 Courts', sub: 'covered' },
              { label: '15+ Categories', sub: 'of law' },
              { label: 'AI-Powered', sub: 'search & analysis' },
            ].map(s => (
              <div key={s.label} className="flex items-baseline gap-1.5">
                <span className="text-sm font-semibold text-lexai-700">{s.label}</span>
                <span className="text-xs text-gray-400">{s.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-6">
        {/* Search Bar */}
        <div className="mb-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doSearch()}
              placeholder="Search case law... e.g. 'khula without consent', 'benefit of doubt murder', 'environmental rights Article 9'"
              className="w-full rounded-xl border border-gray-300 bg-white py-3.5 pl-11 pr-10 text-sm shadow-sm focus:border-lexai-500 focus:outline-none focus:ring-2 focus:ring-lexai-200"
            />
            {query && (
              <button
                onClick={() => { setQuery(''); setHasSearched(false); setResults([]); setAiAnswer('') }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => doSearch()}
            disabled={isSearching}
            className="flex items-center gap-2 rounded-xl bg-lexai-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-lexai-700 disabled:opacity-60 transition-colors"
          >
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Search
          </button>
        </div>

        {/* Category Tabs */}
        <div className="mb-3 flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORY_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => handleCategoryClick(tab)}
              className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-lexai-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Filters Toggle */}
        <div className="mb-5">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700"
          >
            <Filter className="h-3.5 w-3.5" />
            Advanced Filters
            {showFilters ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          {showFilters && (
            <div className="mt-3 flex flex-wrap gap-3 rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">Court</label>
                <select
                  value={filters.court}
                  onChange={e => setFilters(f => ({ ...f, court: e.target.value }))}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs focus:border-lexai-400 focus:outline-none"
                >
                  <option value="">All Courts</option>
                  {COURTS.map(c => (
                    <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">Year From</label>
                <input
                  type="number"
                  placeholder="e.g. 1990"
                  value={filters.yearFrom}
                  onChange={e => setFilters(f => ({ ...f, yearFrom: e.target.value }))}
                  className="w-28 rounded-lg border border-gray-200 px-3 py-1.5 text-xs focus:border-lexai-400 focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">Year To</label>
                <input
                  type="number"
                  placeholder="e.g. 2024"
                  value={filters.yearTo}
                  onChange={e => setFilters(f => ({ ...f, yearTo: e.target.value }))}
                  className="w-28 rounded-lg border border-gray-200 px-3 py-1.5 text-xs focus:border-lexai-400 focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">Landmark Only</label>
                <label className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.landmarkOnly}
                    onChange={e => setFilters(f => ({ ...f, landmarkOnly: e.target.checked }))}
                    className="h-3.5 w-3.5 accent-lexai-600"
                  />
                  <span className="text-xs text-gray-700">Landmark cases only</span>
                </label>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => setFilters({ court: '', yearFrom: '', yearTo: '', landmarkOnly: false })}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* AI Answer (streaming) */}
        {(aiAnswer || isStreaming) && (
          <div className="mb-6 rounded-xl border border-lexai-200 bg-lexai-50 p-5">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-lexai-600 text-white">
                <Bot className="h-4 w-4" />
              </div>
              <span className="text-sm font-semibold text-lexai-700">AI Legal Analysis</span>
              {isStreaming && (
                <span className="flex items-center gap-1 text-xs text-lexai-500">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Analyzing case law…
                </span>
              )}
            </div>
            <div className="prose prose-sm max-w-none text-gray-700">
              <ReactMarkdown>{aiAnswer}</ReactMarkdown>
            </div>
            {isStreaming && (
              <span className="mt-1 inline-block h-4 w-0.5 animate-pulse bg-lexai-600" />
            )}
          </div>
        )}

        {/* Results */}
        {hasSearched && (
          <>
            {isSearching ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Loader2 className="mb-3 h-8 w-8 animate-spin text-lexai-500" />
                <p className="text-sm">Searching Pakistani case law…</p>
              </div>
            ) : results.length > 0 ? (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    <span className="font-semibold text-gray-900">{totalResults}</span> cases found
                    {query && <> for <span className="font-medium text-lexai-700">"{query}"</span></>}
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {results.map(c => (
                    <CaseCard
                      key={c.id}
                      precedent={c}
                      onClick={() => router.push(`/precedents/${c.id}`)}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center py-16 text-center">
                <BookOpen className="mb-4 h-12 w-12 text-gray-300" />
                <h3 className="mb-1 text-lg font-semibold text-gray-700">No cases found</h3>
                <p className="mb-4 text-sm text-gray-400">Try different search terms or browse by category</p>
                <button
                  onClick={() => { setHasSearched(false); setQuery('') }}
                  className="rounded-lg bg-lexai-600 px-4 py-2 text-sm font-medium text-white hover:bg-lexai-700"
                >
                  Browse All Cases
                </button>
              </div>
            )}
          </>
        )}

        {/* Empty State — Browse by Category */}
        {!hasSearched && (
          <>
            {/* Quick Category Grid */}
            <div className="mb-8">
              <h2 className="mb-4 text-base font-semibold text-gray-900">Browse by Practice Area</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {QUICK_CATEGORIES.map(cat => (
                  <button
                    key={cat.label}
                    onClick={() => handleQuickCategory(cat.label)}
                    className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm hover:border-lexai-300 hover:shadow-md transition-all group"
                  >
                    <span className="text-2xl">{cat.icon}</span>
                    <div>
                      <p className="font-semibold text-gray-900 group-hover:text-lexai-700 transition-colors">
                        {cat.label}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{cat.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Landmark Cases */}
            <div>
              <div className="mb-4 flex items-center gap-2">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <h2 className="text-base font-semibold text-gray-900">Landmark Cases</h2>
                <span className="text-xs text-gray-400">Most cited Pakistani judgments</span>
              </div>
              <button
                onClick={() => {
                  setFilters(f => ({ ...f, landmarkOnly: true }))
                  doSearch('', '')
                }}
                className="mb-4 text-xs font-medium text-lexai-600 hover:text-lexai-700 hover:underline"
              >
                View all landmark cases →
              </button>

              <div className="grid gap-3">
                {[
                  { name: 'Asma Jilani v Government of Punjab', citation: 'PLD 1972 SC 139', cat: 'Constitutional', desc: 'Declared Yahya Khan\'s martial law illegal; foundational for constitutional supremacy' },
                  { name: 'Khurshid Bibi v Muhammad Amin', citation: 'PLD 1967 SC 97', cat: 'Family', desc: 'Established women\'s right to khula without husband\'s consent' },
                  { name: 'Shehla Zia v WAPDA', citation: 'PLD 1994 SC 693', cat: 'Human Rights', desc: 'Introduced precautionary principle; expanded right to life to include environment' },
                  { name: 'Panama Case', citation: 'PLD 2017 SC 692', cat: 'Constitutional', desc: 'First disqualification of sitting PM; accountability jurisprudence' },
                ].map(c => (
                  <button
                    key={c.citation}
                    onClick={() => { setQuery(c.name); doSearch(c.name) }}
                    className="flex items-start gap-4 rounded-xl border border-yellow-100 bg-yellow-50 p-4 text-left hover:border-yellow-200 hover:bg-yellow-100 transition-colors group"
                  >
                    <Star className="mt-0.5 h-4 w-4 shrink-0 fill-yellow-400 text-yellow-400" />
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900 text-sm group-hover:text-lexai-700 transition-colors">
                          {c.name}
                        </span>
                        <span className="rounded bg-lexai-100 px-1.5 py-0.5 text-[10px] font-mono text-lexai-700">{c.citation}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${CATEGORY_BADGE_COLORS[c.cat] ?? 'bg-gray-100 text-gray-600'}`}>{c.cat}</span>
                      </div>
                      <p className="text-xs text-gray-500">{c.desc}</p>
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 text-gray-400 group-hover:text-lexai-600 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
