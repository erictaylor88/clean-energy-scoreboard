import type { Metadata } from 'next'
import BarChartRaceWrapper from '@/components/BarChartRaceWrapper'
import { getRaceData, getLastSyncTime } from '@/lib/supabase/queries'

export const metadata: Metadata = {
  title: 'The Race — Who\'s Going Clean Fastest?',
  description: 'Watch countries race to clean energy from 2000 to today. An animated bar chart showing the top 15 countries by clean energy share over time.',
  openGraph: {
    images: [{ url: '/api/og?page=race', width: 1200, height: 630 }],
  },
}

export const revalidate = 86400

export default async function RacePage() {
  const [raceData, lastSync] = await Promise.all([
    getRaceData(),
    getLastSyncTime(),
  ])

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-10">
      {/* Section header */}
      <div className="pt-12 md:pt-16 pb-6 md:pb-8">
        <h1 className="font-display font-bold text-2xl md:text-[2.25rem] leading-[1.15] tracking-[-0.015em]"
          style={{ color: 'var(--text-primary)' }}>
          The Race
        </h1>
        <p className="font-body text-base mt-2 max-w-[50ch]"
          style={{ color: 'var(--text-secondary)' }}>
          Watch countries compete for the highest clean energy share, from 2000 to today. Press play to see who&apos;s climbing — and who&apos;s falling behind.
        </p>
      </div>

      {/* Chart */}
      <div className="rounded-xl border p-4 md:p-6"
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'var(--border-default)',
        }}>
        <BarChartRaceWrapper data={raceData.data} years={raceData.years} />
      </div>

      {/* Methodology note */}
      <div className="mt-6 pb-16">
        <p className="text-xs font-body" style={{ color: 'var(--text-muted)' }}>
          Top 15 countries by clean energy share of electricity generation (countries with &lt;2 TWh total generation excluded).
          Clean energy = solar + wind + hydro + nuclear + bioenergy + other renewables.
          Data: <a href="https://ember-climate.org" className="underline hover:text-text-secondary transition-colors">Ember</a> (CC-BY-4.0).
          {lastSync && (
            <> Last updated: {new Date(lastSync).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.</>
          )}
        </p>
      </div>
    </div>
  )
}
