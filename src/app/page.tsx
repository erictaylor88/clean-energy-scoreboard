import { getLatestWorldData, getCountryLeaderboard, getLastSyncTime, getHistoricalTrend } from '@/lib/supabase/queries'
// TrendChart loaded via client wrapper
import Leaderboard from '@/components/Leaderboard'

import TrendChart from '@/components/TrendChartWrapper'

export const revalidate = 86400

export default async function Home() {
  const [worldData, leaderboard, lastSync, trendData] = await Promise.all([
    getLatestWorldData().catch(() => null),
    getCountryLeaderboard().catch(() => []),
    getLastSyncTime().catch(() => null),
    getHistoricalTrend('world').catch(() => []),
  ])

  const cleanShare = worldData?.latest?.clean_share ?? null
  const fossilShare = worldData?.latest?.fossil_share ?? null
  const momentum = worldData?.momentum ?? null
  const dataYear = worldData?.latest?.year ?? null

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-4 py-20">
        <p className="text-xs md:text-sm font-body font-medium text-text-secondary uppercase tracking-[0.05em] mb-3">
          Global Clean Energy Share {dataYear ? `(${dataYear})` : ''}
        </p>

        {cleanShare !== null ? (
          <>
            <h1
              className="font-display font-bold text-[48px] md:text-[72px] leading-none text-accent-green"
              style={{ textShadow: '0 0 40px rgba(34,197,94,0.15), 0 0 80px rgba(34,197,94,0.15)' }}
            >
              {cleanShare.toFixed(1)}
              <span className="text-[60%] text-text-secondary">%</span>
            </h1>

            {momentum !== null && (
              <p className={`text-base font-body font-medium mt-3 ${momentum >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                {momentum >= 0 ? '↑' : '↓'} {Math.abs(momentum).toFixed(1)}pp from {dataYear ? dataYear - 1 : 'last year'}
              </p>
            )}

            {/* Score Bar */}
            <div className="mt-6 w-full max-w-[480px]">
              <div className="relative h-3 md:h-4 rounded-full overflow-hidden flex">
                <div className="bg-accent-green" style={{ width: `${cleanShare}%` }} />
                <div className="absolute top-0 bottom-0 bg-white w-[2px]" style={{ left: `${cleanShare}%` }} />
                <div className="bg-accent-fossil flex-1" />
              </div>
              <div className="flex justify-between mt-2 text-xs font-body">
                <span className="text-accent-green font-medium">{cleanShare.toFixed(1)}% Clean</span>
                <span className="text-accent-fossil">{fossilShare?.toFixed(1)}% Fossil</span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="h-[72px] w-48 rounded-lg bg-bg-surface animate-pulse" />
            <p className="text-sm text-text-secondary font-body">
              No data yet — run the Ember sync to populate.
            </p>
          </div>
        )}
      </section>

      {/* Leaderboard */}
      <section id="rankings" className="max-w-[1200px] mx-auto w-full px-4 md:px-10 pb-12">
        <div className="pt-12 pb-6 border-t border-border-subtle">
          <h2 className="font-display font-semibold text-[28px] leading-tight text-text-primary">
            Who&apos;s Leading?
          </h2>
          <p className="font-body text-base text-text-secondary mt-2 max-w-[50ch]">
            Countries ranked by clean energy share of electricity generation.
          </p>
        </div>
        <Leaderboard data={leaderboard} />
      </section>

      {/* Trend Chart */}
      <section id="trends" className="max-w-[1200px] mx-auto w-full px-4 md:px-10 pb-12">
        <div className="pt-12 pb-6 border-t border-border-subtle">
          <h2 className="font-display font-semibold text-[28px] leading-tight text-text-primary">
            How Did We Get Here?
          </h2>
          <p className="font-body text-base text-text-secondary mt-2 max-w-[50ch]">
            Global clean vs. fossil electricity share since 2000.
          </p>
        </div>
        <TrendChart data={trendData} />
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border-subtle py-8 px-4 md:px-10">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-body text-text-muted">
          <p>
            Data from{' '}
            <a href="https://ember-climate.org" target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline">
              Ember
            </a>{' '}
            (CC-BY-4.0). Clean energy = solar + wind + hydro + nuclear + bioenergy + other renewables.
          </p>
          {lastSync && (
            <p>Last updated: {new Date(lastSync).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          )}
        </div>
      </footer>
    </div>
  )
}
