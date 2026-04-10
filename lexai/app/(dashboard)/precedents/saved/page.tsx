import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Bookmark, BookmarkX, Scale, ArrowRight, FolderOpen, Clock } from 'lucide-react'

const CATEGORY_COLORS: Record<string, string> = {
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
  'Cyber Crime': 'bg-violet-100 text-violet-700',
}

interface SavedWithPrecedent {
  id: string
  user_id: string
  precedent_id: string
  notes: string | null
  folder: string
  created_at: string
  precedents: {
    id: string
    case_name: string
    citation: string | null
    court: string
    court_code: string
    year: number | null
    law_category: string
    is_landmark: boolean
  } | null
}

export default async function SavedPrecedentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: saved, error } = await supabase
    .from('saved_precedents')
    .select('*, precedents(id, case_name, citation, court, court_code, year, law_category, is_landmark)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const savedItems = (saved as SavedWithPrecedent[] | null) ?? []

  // Group by folder
  const byFolder: Record<string, SavedWithPrecedent[]> = {}
  for (const item of savedItems) {
    const f = item.folder || 'General'
    if (!byFolder[f]) byFolder[f] = []
    byFolder[f].push(item)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white px-6 py-5">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Bookmark className="h-5 w-5 text-lexai-600" />
              <h1 className="text-xl font-bold text-gray-900">Saved Cases</h1>
            </div>
            <p className="text-sm text-gray-500">
              {savedItems.length} saved {savedItems.length === 1 ? 'case' : 'cases'} across{' '}
              {Object.keys(byFolder).length} {Object.keys(byFolder).length === 1 ? 'folder' : 'folders'}
            </p>
          </div>
          <Link
            href="/precedents"
            className="flex items-center gap-1.5 rounded-xl bg-lexai-600 px-4 py-2 text-sm font-medium text-white hover:bg-lexai-700 transition-colors"
          >
            <Scale className="h-4 w-4" />
            Search Cases
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-6">
        {savedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BookmarkX className="mb-4 h-14 w-14 text-gray-200" />
            <h2 className="mb-2 text-lg font-semibold text-gray-700">No saved cases yet</h2>
            <p className="mb-6 text-sm text-gray-400 max-w-sm">
              Bookmark cases from the Case Law search to save them here for quick reference.
            </p>
            <Link
              href="/precedents"
              className="flex items-center gap-2 rounded-xl bg-lexai-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-lexai-700 transition-colors"
            >
              Browse Case Law
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(byFolder).map(([folder, items]) => (
              <div key={folder}>
                <div className="mb-4 flex items-center gap-2">
                  <FolderOpen className="h-4 w-4 text-lexai-500" />
                  <h2 className="text-base font-semibold text-gray-900">{folder}</h2>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                    {items.length}
                  </span>
                </div>

                <div className="grid gap-3">
                  {items.map(item => {
                    const p = item.precedents
                    if (!p) return null
                    const catColor = CATEGORY_COLORS[p.law_category] ?? 'bg-gray-100 text-gray-700'

                    return (
                      <div
                        key={item.id}
                        className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <Link
                                href={`/precedents/${p.id}`}
                                className="text-sm font-semibold text-gray-900 hover:text-lexai-700 transition-colors line-clamp-1"
                              >
                                {p.case_name}
                              </Link>
                              {p.is_landmark && (
                                <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-semibold text-yellow-700">
                                  ★ Landmark
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              {p.citation && (
                                <span className="font-mono text-xs text-lexai-600">{p.citation}</span>
                              )}
                              <span className="text-xs text-gray-400">{p.court_code}</span>
                              {p.year && <span className="text-xs text-gray-400">{p.year}</span>}
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${catColor}`}>
                                {p.law_category}
                              </span>
                            </div>
                            {item.notes && (
                              <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 italic">
                                "{item.notes}"
                              </p>
                            )}
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-2">
                            <div className="flex items-center gap-1 text-[10px] text-gray-400">
                              <Clock className="h-3 w-3" />
                              {new Date(item.created_at).toLocaleDateString('en-PK')}
                            </div>
                            <Link
                              href={`/precedents/${p.id}`}
                              className="flex items-center gap-1 rounded-lg bg-lexai-50 px-2.5 py-1 text-xs font-medium text-lexai-600 hover:bg-lexai-100 transition-colors"
                            >
                              View <ArrowRight className="h-3 w-3" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
