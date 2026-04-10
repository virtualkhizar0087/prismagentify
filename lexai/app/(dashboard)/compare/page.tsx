'use client'

import { useState, useRef } from 'react'
import { Upload, Scale, Trophy, AlertTriangle, CheckCircle, MinusCircle, Loader2, RotateCcw } from 'lucide-react'
import type { ContractComparison } from '@/lib/claude'

interface ContractSlot {
  name: string
  text: string
}

function ScoreRing({ score, color }: { score: number; color: string }) {
  const radius = 36
  const circ = 2 * Math.PI * radius
  const dash = (score / 100) * circ
  return (
    <svg width="90" height="90" viewBox="0 0 90 90">
      <circle cx="45" cy="45" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="8" />
      <circle
        cx="45" cy="45" r={radius}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 45 45)"
      />
      <text x="45" y="49" textAnchor="middle" fontSize="18" fontWeight="800" fill={color}>{score}</text>
    </svg>
  )
}

function WinnerIcon({ winner }: { winner: 'a' | 'b' | 'tie' }) {
  if (winner === 'tie') return <MinusCircle className="h-4 w-4 text-gray-400" />
  if (winner === 'a') return <CheckCircle className="h-4 w-4 text-emerald-500" />
  return <CheckCircle className="h-4 w-4 text-blue-500" />
}

export default function ComparePage() {
  const [contractA, setContractA] = useState<ContractSlot | null>(null)
  const [contractB, setContractB] = useState<ContractSlot | null>(null)
  const [isComparing, setIsComparing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ContractComparison | null>(null)
  const refA = useRef<HTMLInputElement>(null)
  const refB = useRef<HTMLInputElement>(null)

  async function readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = reject
      reader.readAsText(file)
    })
  }

  async function handleDrop(slot: 'a' | 'b', file: File) {
    const text = await readFile(file)
    const entry = { name: file.name, text }
    if (slot === 'a') setContractA(entry)
    else setContractB(entry)
    setResult(null)
    setError(null)
  }

  async function handleCompare() {
    if (!contractA || !contractB) return
    setIsComparing(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/contracts/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractAText: contractA.text,
          contractBText: contractB.text,
          contractAName: contractA.name,
          contractBName: contractB.name,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Comparison failed'); return }
      setResult(data.comparison)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setIsComparing(false)
    }
  }

  function reset() {
    setContractA(null)
    setContractB(null)
    setResult(null)
    setError(null)
  }

  const winnerColor = result?.winner === 'a' ? '#10b981' : result?.winner === 'b' ? '#3b82f6' : '#6b7280'
  const winnerLabel =
    result?.winner === 'a' ? contractA?.name ?? 'Contract A' :
    result?.winner === 'b' ? contractB?.name ?? 'Contract B' :
    'It\'s a Tie'

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-lexai-50">
            <Scale className="h-5 w-5 text-lexai-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contract Comparison</h1>
            <p className="text-sm text-gray-500">Upload two contracts — AI picks the better deal for you</p>
          </div>
        </div>
      </div>

      {/* Upload slots */}
      {!result && (
        <div className="grid gap-6 md:grid-cols-2">
          {([['a', contractA, refA, 'Contract A', 'bg-emerald-50 border-emerald-300', 'text-emerald-700'],
             ['b', contractB, refB, 'Contract B', 'bg-blue-50 border-blue-300', 'text-blue-700']] as const).map(
            ([slot, contract, ref, label, colors, textColor]) => (
              <div key={slot}>
                <p className={`mb-2 text-sm font-semibold ${textColor}`}>{label}</p>
                <div
                  onClick={() => ref.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    const file = e.dataTransfer.files[0]
                    if (file) handleDrop(slot as 'a' | 'b', file)
                  }}
                  className={`flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all ${
                    contract ? colors : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  {contract ? (
                    <>
                      <div className="text-3xl mb-2">📄</div>
                      <p className="text-sm font-medium text-gray-900 truncate max-w-full px-4">{contract.name}</p>
                      <p className="mt-1 text-xs text-gray-500">{Math.round(contract.text.length / 1000)}k characters</p>
                      <button
                        onClick={(e) => { e.stopPropagation(); slot === 'a' ? setContractA(null) : setContractB(null) }}
                        className="mt-3 text-xs text-red-500 hover:underline"
                      >
                        Remove
                      </button>
                    </>
                  ) : (
                    <>
                      <Upload className="mb-3 h-8 w-8 text-gray-300" />
                      <p className="text-sm font-medium text-gray-600">Drop {label} here</p>
                      <p className="mt-1 text-xs text-gray-400">or click to browse (.txt, .md, paste below)</p>
                    </>
                  )}
                </div>
                <input
                  ref={ref}
                  type="file"
                  accept=".txt,.md,.doc,.docx"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleDrop(slot as 'a' | 'b', f) }}
                />
                {/* Text paste fallback */}
                {!contract && (
                  <textarea
                    placeholder={`Or paste ${label} text here…`}
                    className="mt-2 w-full rounded-lg border border-gray-200 p-3 text-xs text-gray-700 outline-none focus:ring-2 focus:ring-lexai-400"
                    rows={4}
                    onChange={(e) => {
                      if (e.target.value.trim()) {
                        const entry = { name: `${label} (pasted)`, text: e.target.value }
                        slot === 'a' ? setContractA(entry) : setContractB(entry)
                      }
                    }}
                  />
                )}
              </div>
            )
          )}
        </div>
      )}

      {/* VS divider + compare button */}
      {!result && (
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-4 w-full">
            <div className="flex-1 border-t border-gray-200" />
            <span className="rounded-full bg-gray-100 px-4 py-1.5 text-sm font-bold text-gray-500">VS</span>
            <div className="flex-1 border-t border-gray-200" />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            onClick={handleCompare}
            disabled={!contractA || !contractB || isComparing}
            className="flex items-center gap-2 rounded-xl bg-lexai-600 px-8 py-3 text-sm font-semibold text-white hover:bg-lexai-700 disabled:opacity-40 transition-colors"
          >
            {isComparing ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Comparing contracts…</>
            ) : (
              <><Scale className="h-4 w-4" /> Compare Contracts</>
            )}
          </button>
          <p className="text-xs text-gray-400">AI analyzes both contracts and picks the better deal for you</p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Winner banner */}
          <div
            className="rounded-2xl p-6 text-white"
            style={{ background: `linear-gradient(135deg, ${winnerColor}dd, ${winnerColor})` }}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Trophy className="h-5 w-5" />
                  <span className="text-sm font-semibold opacity-90">
                    {result.winner === 'tie' ? 'Both contracts are similar' : 'Better contract for you'}
                  </span>
                </div>
                <p className="text-2xl font-bold truncate max-w-xs">{winnerLabel}</p>
                <p className="mt-2 text-sm opacity-90 max-w-md">{result.overallAssessment}</p>
              </div>
              <div className="flex gap-6 shrink-0">
                <div className="text-center">
                  <ScoreRing score={result.scoreA} color="#10b981" />
                  <p className="mt-1 text-xs font-medium opacity-80 truncate max-w-[80px]">{contractA?.name ?? 'Contract A'}</p>
                </div>
                <div className="text-center">
                  <ScoreRing score={result.scoreB} color="#3b82f6" />
                  <p className="mt-1 text-xs font-medium opacity-80 truncate max-w-[80px]">{contractB?.name ?? 'Contract B'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendation */}
          <div className="rounded-xl bg-amber-50 p-4 ring-1 ring-amber-200">
            <p className="text-sm font-semibold text-amber-800">AI Recommendation</p>
            <p className="mt-1 text-sm text-amber-700">{result.recommendation}</p>
          </div>

          {/* Clause-by-clause comparison */}
          <div className="rounded-xl bg-white ring-1 ring-gray-200 overflow-hidden">
            <div className="grid grid-cols-[1fr,auto,1fr] border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-500">
              <div className="px-4 py-3 text-emerald-700 truncate">{contractA?.name ?? 'Contract A'}</div>
              <div className="px-4 py-3 text-center">Aspect</div>
              <div className="px-4 py-3 text-right text-blue-700 truncate">{contractB?.name ?? 'Contract B'}</div>
            </div>
            <div className="divide-y divide-gray-50">
              {result.clauseComparisons.map((clause, i) => (
                <div key={i} className="grid grid-cols-[1fr,auto,1fr] gap-0">
                  <div className={`p-4 ${clause.winner === 'a' ? 'bg-emerald-50' : ''}`}>
                    <p className="text-xs text-gray-700">{clause.contractA}</p>
                    {clause.winner === 'a' && (
                      <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        <CheckCircle className="h-3 w-3" /> Better
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col items-center justify-center border-x border-gray-100 px-3 py-4 min-w-[120px] text-center">
                    <WinnerIcon winner={clause.winner} />
                    <p className="mt-1 text-xs font-semibold text-gray-700">{clause.aspect}</p>
                    <p className="mt-1 text-[10px] text-gray-400 leading-tight">{clause.explanation}</p>
                  </div>
                  <div className={`p-4 ${clause.winner === 'b' ? 'bg-blue-50' : ''}`}>
                    <p className="text-xs text-gray-700">{clause.contractB}</p>
                    {clause.winner === 'b' && (
                      <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                        <CheckCircle className="h-3 w-3" /> Better
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reset */}
          <div className="flex justify-center">
            <button
              onClick={reset}
              className="flex items-center gap-2 rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Compare Different Contracts
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
