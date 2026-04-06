'use client'

import { useState } from 'react'
import Link from 'next/link'

type StateRow = {
  id: number
  name: string
  abbreviation: string
  slug: string
  cleanShare: number | null
  momentum: number | null
}

export default function StateLeaderboard({ states }: { states: StateRow[] }) {
  const [sortBy, setSortBy] = useState<'share' | 'momentum'>('share')
  const [showAll, setShowAll] = useState(false)

  const sorted = [...states].sort((a, b) => {
    if (sortBy === 'momentum') return (b.momentum ?? -999) - (a.momentum ?? -999)
    return (b.cleanShare ?? -999) - (a.cleanShare ?? -999)
  })

  const displayed = showAll ? sorted : sorted.slice(0, 20)

  return (
    <div>
      {/* Sort toggle */}
      <div className="flex items-center justify-between mb-4">
        <div
          className="inline-flex rounded-lg border p-0.5"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
        >
          {(['share', 'momentum'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setSortBy(mode)}
              className="px-4 py-1.5 text-sm font-body font-medium rounded-md transition-all duration-150"
              style={{
                background: sortBy === mode ? 'var(--accent-green-dim)' : 'transparent',
                color: sortBy === mode ? 'var(--accent-green)' : 'var(--text-secondary)',
              }}
            >
              {mode === 'share' ? 'By Share' : 'By Momentum'}
            </button>
          ))}
        </div>
      </div>

      {/* Rows */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
      >
        {displayed.map((state, i) => (
          <Link
            key={state.id}
            href={`/state/${state.slug}`}
            className="flex items-center px-4 py-3 transition-colors duration-150 hover:bg-[var(--bg-elevated)]"
            style={{ borderBottom: i < displayed.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}
          >
            {/* Rank */}
            <span
              className="w-8 text-center font-body font-semibold text-sm tabular-nums"
              style={{ color: 'var(--text-muted)' }}
            >
              {i + 1}
            </span>

            {/* State abbr badge */}
            <span
              className="w-10 mx-2 text-center text-xs font-body font-bold rounded px-1.5 py-0.5"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
            >
              {state.abbreviation}
            </span>

            {/* Name */}
            <span
              className="flex-1 font-body font-medium text-sm truncate"
              style={{ color: 'var(--text-primary)' }}
            >
              {state.name}
            </span>

            {/* Clean share */}
            <span
              className="w-16 text-right font-body font-semibold text-sm tabular-nums"
              style={{ color: 'var(--accent-green)' }}
            >
              {state.cleanShare !== null ? `${state.cleanShare.toFixed(1)}%` : '—'}
            </span>

            {/* Momentum badge (hidden on mobile) */}
            <span className="hidden sm:inline-flex w-16 ml-3 justify-center">
              {state.momentum !== null ? (
                <span
                  className="text-xs font-body font-medium px-2 py-0.5 rounded-full"
                  style={{
                    background: state.momentum > 0
                      ? 'rgba(34, 197, 94, 0.15)'
                      : state.momentum < 0
                        ? 'rgba(239, 68, 68, 0.15)'
                        : 'rgba(148, 163, 184, 0.1)',
                    color: state.momentum > 0
                      ? 'var(--accent-green)'
                      : state.momentum < 0
                        ? 'var(--accent-red)'
                        : 'var(--text-secondary)',
                  }}
                >
                  {state.momentum > 0 ? '↑' : state.momentum < 0 ? '↓' : '→'}
                  {Math.abs(state.momentum).toFixed(1)}
                </span>
              ) : (
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>
              )}
            </span>

            {/* Chevron */}
            <span className="hidden sm:block w-5 ml-2 text-right" style={{ color: 'var(--text-muted)' }}>
              ›
            </span>
          </Link>
        ))}
      </div>

      {/* Show all button */}
      {!showAll && sorted.length > 20 && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-4 w-full py-2 text-sm font-body font-medium rounded-lg border transition-colors duration-150"
          style={{
            borderColor: 'var(--border-default)',
            color: 'var(--text-secondary)',
            background: 'transparent',
          }}
        >
          Show all {sorted.length} states
        </button>
      )}
    </div>
  )
}
