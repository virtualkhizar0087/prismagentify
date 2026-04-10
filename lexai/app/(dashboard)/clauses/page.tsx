'use client'

import { useState, useEffect } from 'react'
import { Library, Plus, Copy, Trash2, Tag, Search, CheckCircle, FileText } from 'lucide-react'

interface Clause {
  id: string
  title: string
  text: string
  category: string
  note: string
  savedAt: string
}

const CATEGORIES = [
  'All',
  'Payment',
  'Termination',
  'Confidentiality',
  'Liability',
  'IP Ownership',
  'Dispute Resolution',
  'Non-Compete',
  'Warranty',
  'Indemnification',
  'Other',
]

const STARTER_CLAUSES: Clause[] = [
  {
    id: 'starter-1',
    title: 'Payment — Net 30 with Late Fee',
    category: 'Payment',
    text: 'Payment shall be due within thirty (30) days of invoice date. Overdue amounts shall accrue interest at the rate of 2% per month (24% per annum) from the due date until paid in full. Client shall reimburse all reasonable costs of collection, including legal fees.',
    note: 'Good for freelancers and service providers',
    savedAt: new Date().toISOString(),
  },
  {
    id: 'starter-2',
    title: 'Limitation of Liability — Mutual Cap',
    category: 'Liability',
    text: 'In no event shall either party be liable to the other for any indirect, incidental, consequential, special, or punitive damages. Each party\'s aggregate liability arising out of or related to this Agreement shall not exceed the total fees paid or payable by Client in the three (3) months immediately preceding the claim.',
    note: 'Standard mutual cap — protects both parties',
    savedAt: new Date().toISOString(),
  },
  {
    id: 'starter-3',
    title: 'IP Assignment — Work for Hire',
    category: 'IP Ownership',
    text: 'All work product, deliverables, inventions, and intellectual property created by Service Provider in connection with this Agreement shall be considered "work made for hire" and shall be the exclusive property of Client upon receipt of full payment. Service Provider irrevocably assigns all rights, title, and interest therein to Client.',
    note: 'Use when client wants full IP ownership',
    savedAt: new Date().toISOString(),
  },
  {
    id: 'starter-4',
    title: 'Dispute Resolution — Arbitration (Pakistan)',
    category: 'Dispute Resolution',
    text: 'Any dispute arising out of or in connection with this Agreement shall be finally settled by arbitration under the Arbitration Act, 1940 (as amended) before a single arbitrator mutually agreed upon by the parties, or if no agreement is reached within 15 days, appointed by the relevant court. The seat of arbitration shall be [City], Pakistan. The language of arbitration shall be English.',
    note: 'Avoids expensive litigation — preferred for B2B',
    savedAt: new Date().toISOString(),
  },
  {
    id: 'starter-5',
    title: 'Confidentiality — 2-Year Standard',
    category: 'Confidentiality',
    text: 'Each party agrees to keep confidential all non-public information of the other party ("Confidential Information") and not to disclose it to any third party without prior written consent. This obligation shall survive termination of this Agreement for a period of two (2) years. Confidential Information does not include information that is publicly known, independently developed, or received from a third party without restriction.',
    note: 'Balanced confidentiality — 2 year term',
    savedAt: new Date().toISOString(),
  },
]

export default function ClausesPage() {
  const [clauses, setClauses] = useState<Clause[]>([])
  const [activeCategory, setActiveCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', text: '', category: 'Other', note: '' })

  useEffect(() => {
    try {
      const saved = localStorage.getItem('lexai_clauses')
      if (saved) {
        setClauses(JSON.parse(saved))
      } else {
        setClauses(STARTER_CLAUSES)
        localStorage.setItem('lexai_clauses', JSON.stringify(STARTER_CLAUSES))
      }
    } catch {
      setClauses(STARTER_CLAUSES)
    }
  }, [])

  function save(updated: Clause[]) {
    setClauses(updated)
    localStorage.setItem('lexai_clauses', JSON.stringify(updated))
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.text.trim()) return
    const newClause: Clause = {
      id: Date.now().toString(),
      title: form.title,
      text: form.text,
      category: form.category,
      note: form.note,
      savedAt: new Date().toISOString(),
    }
    save([newClause, ...clauses])
    setForm({ title: '', text: '', category: 'Other', note: '' })
    setShowAdd(false)
  }

  function handleDelete(id: string) {
    save(clauses.filter((c) => c.id !== id))
  }

  function handleCopy(clause: Clause) {
    navigator.clipboard.writeText(clause.text)
    setCopiedId(clause.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const filtered = clauses.filter((c) => {
    const matchCat = activeCategory === 'All' || c.category === activeCategory
    const matchSearch = !search ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.text.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clause Library</h1>
          <p className="mt-1 text-gray-500">
            Save, organize, and reuse approved clauses across all your contracts.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 rounded-lg bg-lexai-600 px-4 py-2 text-sm font-medium text-white hover:bg-lexai-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Clause
        </button>
      </div>

      {/* Add clause form */}
      {showAdd && (
        <div className="rounded-xl bg-white p-6 ring-1 ring-lexai-300 shadow-sm">
          <h2 className="mb-4 font-semibold text-gray-900">Add New Clause</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Clause Title *</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Payment — Net 30 with Late Fee"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-lexai-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-lexai-500"
                >
                  {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Clause Text *</label>
              <textarea
                required
                rows={5}
                value={form.text}
                onChange={(e) => setForm({ ...form, text: e.target.value })}
                placeholder="Paste the clause text here…"
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-lexai-500 resize-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Note (optional)</label>
              <input
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="When to use this clause…"
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-lexai-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="rounded-lg bg-lexai-600 px-5 py-2 text-sm font-medium text-white hover:bg-lexai-700 transition-colors"
              >
                Save Clause
              </button>
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="rounded-lg border border-gray-200 px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search clauses…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-lexai-500"
        />
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              activeCategory === cat
                ? 'bg-lexai-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Tag className="h-3.5 w-3.5" />
            {cat}
            {cat !== 'All' && (
              <span className="ml-0.5 text-[10px] opacity-70">
                ({clauses.filter((c) => c.category === cat).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Clauses list */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <Library className="h-10 w-10 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">No clauses found.</p>
          <button onClick={() => { setSearch(''); setActiveCategory('All') }} className="mt-2 text-sm text-lexai-600 hover:underline">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((clause) => (
            <div key={clause.id} className="rounded-xl bg-white p-5 ring-1 ring-gray-200 hover:ring-lexai-200 transition-all">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-gray-900 text-sm">{clause.title}</h3>
                  <span className="inline-flex items-center gap-1 rounded-full bg-lexai-50 px-2 py-0.5 text-[11px] font-semibold text-lexai-700">
                    <Tag className="h-2.5 w-2.5" />
                    {clause.category}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleCopy(clause)}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    {copiedId === clause.id ? (
                      <><CheckCircle className="h-3.5 w-3.5 text-green-500" /> Copied</>
                    ) : (
                      <><Copy className="h-3.5 w-3.5" /> Copy</>
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(clause.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <p className="rounded-lg bg-gray-50 p-3 text-xs leading-relaxed text-gray-700 font-mono">
                {clause.text}
              </p>

              {clause.note && (
                <p className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                  <FileText className="h-3 w-3" />
                  {clause.note}
                </p>
              )}

              <p className="mt-2 text-[10px] text-gray-300">
                Saved {new Date(clause.savedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
