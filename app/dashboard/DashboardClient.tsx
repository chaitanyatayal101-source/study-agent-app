'use client'

import Link from 'next/link'
import { useState } from 'react'

type ConceptRow = {
  subject: string
  concept: string
  mastery_level?: string | null
  overview_gist?: string | null
  deep_dive_gist?: string[] | null
  strong_areas?: string[] | null
  weak_areas?: string[] | null
  next_steps?: string[] | null
  last_updated?: string | null
}

const subjectColorMap: Record<string, string> = {
  Physics: 'bg-blue-600/20 text-blue-300 ring-blue-500/30',
  Biology: 'bg-emerald-600/20 text-emerald-300 ring-emerald-500/30',
  Mathematics: 'bg-violet-600/20 text-violet-300 ring-violet-500/30',
  'Computer Science': 'bg-orange-600/20 text-orange-300 ring-orange-500/30',
  Chemistry: 'bg-red-600/20 text-red-300 ring-red-500/30',
}

const badgeColorMap: Record<string, string> = {
  Strong: 'bg-emerald-600/20 text-emerald-300 ring-emerald-500/30',
  Proficient: 'bg-sky-600/20 text-sky-300 ring-sky-500/30',
  Developing: 'bg-amber-600/20 text-amber-300 ring-amber-500/30',
  Introduced: 'bg-slate-600/20 text-slate-300 ring-slate-500/30',
  'In Progress': 'bg-fuchsia-600/20 text-fuchsia-300 ring-fuchsia-500/30',
}

const masteryScoreMap: Record<string, number> = {
  Strong: 4,
  Proficient: 3,
  Developing: 2,
  Introduced: 1,
  'In Progress': 0,
}

function formatDate(value?: string | null) {
  if (!value) return 'Not recorded'

  try {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return value
  }
}

function getSubjectPill(subject: string) {
  return subjectColorMap[subject] ?? 'bg-slate-700/60 text-slate-200 ring-slate-500/30'
}

function getMasteryPercent(value?: string | null) {
  const score = masteryScoreMap[value ?? ''] ?? 0
  return Math.round((score / 4) * 100)
}

type DashboardClientProps = {
  concepts: ConceptRow[]
  errorMessage?: string | null
}

export default function DashboardClient({ concepts, errorMessage }: DashboardClientProps) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  const uniqueSubjects = new Set(concepts.map((item) => item.subject).filter(Boolean))
  const averageScore = concepts.length
    ? Math.round(
        (concepts.reduce((sum, item) => sum + (masteryScoreMap[item.mastery_level ?? ''] ?? 0), 0) / concepts.length) * 25
      )
    : 0

  return (
    <section className="rounded-2xl border border-slate-800 bg-red-900/80 p-4 shadow-lg shadow-slate-950/40 sm:p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">A quick view of the concepts you have studied and progressed through.</p>
        </div>
        <Link href="/chat" className="inline-flex items-center justify-center rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-blue-500 hover:text-white">
          Back to chat
        </Link>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
          <p className="text-sm text-slate-400">Total concepts studied</p>
          <p className="mt-2 text-3xl font-semibold">{concepts.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
          <p className="text-sm text-slate-400">Unique subjects</p>
          <p className="mt-2 text-3xl font-semibold">{uniqueSubjects.size}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
          <p className="text-sm text-slate-400">Average mastery score</p>
          <p className="mt-2 text-3xl font-semibold">{averageScore}%</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {!concepts.length && !errorMessage && (
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 text-sm text-slate-400 lg:col-span-2">
            No concepts saved yet. Use the chat page to save your first concept progress.
          </div>
        )}

        {errorMessage && (
          <div className="rounded-2xl border border-red-800/60 bg-red-950/30 p-6 text-sm text-red-300 lg:col-span-2">
            {errorMessage}
          </div>
        )}

        {concepts.map((concept) => {
          const cardKey = `${concept.subject}-${concept.concept}`
          const isExpanded = expandedKey === cardKey
          return (
            <article key={cardKey} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <button type="button" className="w-full text-left" onClick={() => setExpandedKey(isExpanded ? null : cardKey)}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ${getSubjectPill(concept.subject)}`}>
                      {concept.subject || 'General'}
                    </span>
                    <h2 className="mt-3 text-lg font-semibold text-slate-100">{concept.concept}</h2>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ${badgeColorMap[concept.mastery_level ?? ''] ?? 'bg-slate-600/20 text-slate-300 ring-slate-500/30'}`}>
                    {concept.mastery_level || 'In Progress'}
                  </span>
                </div>

                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                    <span>Progress</span>
                    <span>{getMasteryPercent(concept.mastery_level)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800">
                    <div className="h-2 rounded-full bg-blue-500" style={{ width: `${getMasteryPercent(concept.mastery_level)}%` }} />
                  </div>
                </div>

                <div className="mt-4 text-sm text-slate-400">
                  <p>Last updated: {formatDate(concept.last_updated)}</p>
                </div>
              </button>

              {isExpanded && (
                <div className="mt-4 space-y-3 border-t border-slate-800 pt-4">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-300">Strong areas</p>
                    <div className="flex flex-wrap gap-2">
                      {(concept.strong_areas ?? []).length ? (
                        (concept.strong_areas ?? []).map((item) => (
                          <span key={item} className="rounded-full bg-emerald-600/20 px-2.5 py-1 text-xs text-emerald-300">
                            {item}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-slate-500">None recorded</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-red-300">Weak areas</p>
                    <div className="flex flex-wrap gap-2">
                      {(concept.weak_areas ?? []).length ? (
                        (concept.weak_areas ?? []).map((item) => (
                          <span key={item} className="rounded-full bg-red-600/20 px-2.5 py-1 text-xs text-red-300">
                            {item}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-slate-500">None recorded</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-300">Next steps</p>
                    <div className="flex flex-wrap gap-2">
                      {(concept.next_steps ?? []).length ? (
                        (concept.next_steps ?? []).map((item) => (
                          <span key={item} className="rounded-full bg-blue-600/20 px-2.5 py-1 text-xs text-blue-300">
                            {item}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-slate-500">None recorded</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}
