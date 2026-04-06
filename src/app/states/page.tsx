import type { Metadata } from 'next'
import StateLeaderboard from '@/components/StateLeaderboard'
import { getStateLeaderboard, getLastSyncTime } from '@/lib/supabase/queries'

export const metadata: Metadata = {
  title: 'US State Rankings — Which States Lead on Clean Energy?',
  description: 'See how all 50 US states rank on clean energy share of electricity generation. Rankings, momentum, and state-by-state detail.',
  openGraph: {
    images: [{ url: '/api/og?page=states', width: 1200, height: 630 }],
  },
}

export const revalidate = 86400

export default async function StatesPage() {
  const [states, lastSync] = await Promise.all([
    getStateLeaderboard(),
    getLastSyncTime(),
  ])

  const hasData = states.length > 0

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-10">
      {/* Section header */}
      <div className="pt-12 md:pt-16 pb-6 md:pb-8 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <h1
          className="font-display font-bold text-2xl md:text-[2.25rem] leading-[1.15] tracking-[-0.015em]"
          style={{ color: 'var(--text-primary)' }}
        >
          US State Rankings
        </h1>
        <p
          className="font-body text-base mt-2 max-w-[50ch]"
          style={{ color: 'var(--text-secondary)' }}
        >
          Which US states are leading the clean energy transition? Ranked by clean energy share of electricity generation.
        </p>
      </div>

      {/* Leaderboard */}
      <div className="py-8">
        {hasData ? (
          <StateLeaderboard states={states} />
        ) : (
          <div
            className="rounded-xl border p-8 text-center"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
          >
            <p className="font-body text-sm" style={{ color: 'var(--text-secondary)' }}>
              State data is loading. Run the EIA sync to populate state generation data.
            </p>
          </div>
        )}
      </div>

      {/* Footer note */}
      <div className="pb-16">
        <p className="text-xs font-body" style={{ color: 'var(--text-muted)' }}>
          Clean energy = solar + wind + hydro + nuclear + geothermal + biomass.
          Data: <a href="https://www.eia.gov" className="underline hover:text-text-secondary transition-colors">U.S. Energy Information Administration</a> (EIA).
          {lastSync && (
            <> Last updated: {new Date(lastSync).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.</>
          )}
        </p>
      </div>
    </div>
  )
}
