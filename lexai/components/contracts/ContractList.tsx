'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { FileText, Search, ChevronRight, AlertTriangle, ShieldCheck } from 'lucide-react'
import { formatDate, getRiskColor, getRiskLabel } from '@/lib/utils'
import type { Contract } from '@/types/database'

type RiskFilter = 'all' | 'high' | 'medium' | 'low'

export function ContractList({ contracts }: { contracts: Contract[] }) {
  const [search, setSearch] = useState('')
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all')

  const filtered = useMemo(() => {
    return contracts.filter((c) => {
      const matchesSearch = c.filename.toLowerCase().includes(search.toLowerCase())
      const score = c.risk_score ?? 0
      const matchesRisk =
        riskFilter === 'all' ||
        (riskFilter === 'high' && score >= 70) ||
        (riskFilter === 'medium' && score >= 40 && score < 70) ||
        (riskFilter === 'low' && score < 40)
      return matchesSearch && matchesRisk
    })
  }, [contracts, search, riskFilter])

  if (contracts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
        <FileText className="mb-3 h-10 w-10 text-gray-200" />
        <p className="text-sm font-medium text-gray-500">No contracts analyzed yet</p>
        <p className="mt-1 text-xs text-gray-400">Upload your first contract above to get started</p>
      </div>
    )
  }

  const riskCounts = {
    high: contracts.filter((c) => (c.risk_score ?? 0) >= 70).length,
    medium: contracts.filter((c) => (c.risk_score ?? 0) >= 40 && (c.risk_score ?? 0) < 70).length,
    low: contracts.filter((c) => (c.risk_score ?? 0) < 40).length,
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contracts..."
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-lexai-500"
          />
        </div>
        <div className="flex gap-1.5">
          {(['all', 'high', 'medium', 'low'] as RiskFilter[]).map((f) => {
            const count = f === 'all' ? contracts.length : riskCounts[f]
            const colorMap: Record<string, string> = { high: 'text-red-600', medium: 'text-amber-600', low: 'text-emerald-600', all: 'text-gray-600' }
            return (
              <button
                key={f}
                onClick={() => setRiskFilter(f)}
                className={`rounded-lg px-3 py-2 text-xs font-medium capitalize transition-colors ${
                  riskFilter === f
                    ? 'bg-lexai-600 text-white'
                    : 'bg-white ring-1 ring-gray-200 hover:bg-gray-50 ' + colorMap[f]
                }`}
              >
                {f} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 p-8 text-center">
          <p className="text-sm text-gray-500">No contracts match your filter</p>
          <button
            onClick={() => { setSearch(''); setRiskFilter('all') }}
            className="mt-2 text-xs text-lexai-600 hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((contract) => (
            <Link
              key={contract.id}
              href={'/contracts/' + contract.id}
              className="group flex items-center justify-between rounded-xl bg-white px-4 py-3.5 ring-1 ring-gray-200 hover:ring-lexai-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 group-hover:bg-lexai-50">
                  <FileText className="h-4 w-4 text-gray-500 group-hover:text-lexai-600" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">{contract.filename}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <p className="text-xs text-gray-400">{formatDate(contract.created_at)}</p>
                    {contract.red_flags && contract.red_flags.length > 0 && (
                      <span className="flex items-center gap-1 text-xs text-red-500">
                        <AlertTriangle className="h-3 w-3" />
                        {contract.red_flags.length} flag{contract.red_flags.length !== 1 ? 's' : ''}
                      </span>
                    )}
                    {contract.missing_protections && contract.missing_protections.length > 0 && (
                      <span className="flex items-center gap-1 text-xs text-amber-500">
                        <ShieldCheck className="h-3 w-3" />
                        {contract.missing_protections.length} missing
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {contract.risk_score !== null && (
                  <div className="text-right">
                    <span className={'text-lg font-bold ' + getRiskColor(contract.risk_score)}>
                      {contract.risk_score}
                    </span>
                    <p className={'text-xs ' + getRiskColor(contract.risk_score)}>
                      {getRiskLabel(contract.risk_score)}
                    </p>
                  </div>
                )}
                <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-lexai-400" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
