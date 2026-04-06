import { getLatestWorldData, getCountryLeaderboard, getLastSyncTime, getHistoricalTrend, getEnergySecurityStats } from '@/lib/supabase/queries'
import { projectMilestones } from '@/lib/projections'
// TrendChart loaded via client wrapper
import Leaderboard from '@/components/Leaderboard'
import MilestoneCountdown from '@/components/MilestoneCountdown'

import TrendChart from '@/components/TrendChartWrapper'

export const revalidate = 86400

export default async function Home() {
  const [worldData, leaderboard, lastSync, trendData, securityStats] = await Promise.all([
    getLatestWorldData().catch(() => null),
    getCountryLeaderboard().catch(() => []),
    getLastSyncTime().catch(() => null),
    getHistoricalTrend('world').catch(() => []),
    getEnergySecurityStats().catch(() => null),
  ])

  const cleanShare = worldData?.latest?.clean_share ?? null
  const fossilShare = worldData?.latest?.fossil_share ?? null
  const momentum = worldData?.momentum ?? null
  const dataYear = worldData?.latest?.year ?? null

  // Compute milestone projections from trend data
  const projections = trendData.length > 0
    ? projectMilestones(trendData, [50, 60, 75])
    : []

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

      {/* Milestones */}
      {projections.length > 0 && (
        <section id="milestones" className="max-w-[1200px] mx-auto w-full px-4 md:px-10 pb-12">
          <div className="pt-12 pb-6 border-t border-border-subtle">
            <h2 className="font-display font-semibold text-[28px] leading-tight text-text-primary">
              When Do We Cross Over?
            </h2>
            <p className="font-body text-base text-text-secondary mt-2 max-w-[50ch]">
              Projected years to hit key milestones, based on the last 5 years of growth.
            </p>
          </div>
          <MilestoneCountdown projections={projections} currentYear={dataYear ?? new Date().getFullYear()} />
        </section>
      )}

      {/* Energy Security */}
      {securityStats && (
        <section id="security" className="max-w-[1200px] mx-auto w-full px-4 md:px-10 pb-12">
          <div className="pt-12 pb-6 border-t border-border-subtle">
            <h2 className="font-display font-semibold text-[28px] leading-tight text-text-primary">
              Energy Security
            </h2>
            <p className="font-body text-base text-text-secondary mt-2 max-w-[50ch]">
              How the clean energy transition is reshaping energy independence.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Coal Dependence */}
            <div className="rounded-xl border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
              <p className="text-xs font-body font-medium uppercase tracking-[0.04em]" style={{ color: 'var(--text-secondary)' }}>
                Global Coal Share
              </p>
              <p className="font-body font-semibold text-[32px] tabular-nums leading-none mt-2" style={{ color: 'var(--text-primary)' }}>
                {securityStats.coalShare.toFixed(1)}
                <span className="text-[50%]" style={{ color: 'var(--text-muted)' }}>%</span>
              </p>
              <p className={`text-xs font-body font-medium mt-2 ${securityStats.coalMomentum <= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                {securityStats.coalMomentum <= 0 ? '↓' : '↑'} {Math.abs(securityStats.coalMomentum).toFixed(1)}pp from {securityStats.dataYear - 1}
              </p>
              <p className="text-xs font-body mt-2" style={{ color: 'var(--text-muted)' }}>
                Down from peak of {securityStats.peakCoal.share.toFixed(1)}% in {securityStats.peakCoal.year}
              </p>
            </div>

            {/* Carbon Intensity */}
            <div className="rounded-xl border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
              <p className="text-xs font-body font-medium uppercase tracking-[0.04em]" style={{ color: 'var(--text-secondary)' }}>
                Carbon Intensity
              </p>
              <p className="font-body font-semibold text-[32px] tabular-nums leading-none mt-2" style={{ color: 'var(--text-primary)' }}>
                {securityStats.carbonIntensity}
                <span className="text-[50%] ml-1" style={{ color: 'var(--text-muted)' }}>gCO₂/kWh</span>
              </p>
              <p className={`text-xs font-body font-medium mt-2 ${securityStats.carbonMomentum <= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                {securityStats.carbonMomentum <= 0 ? '↓' : '↑'} {Math.abs(securityStats.carbonMomentum)} gCO₂/kWh from {securityStats.dataYear - 1}
              </p>
              <p className="text-xs font-body mt-2" style={{ color: 'var(--text-muted)' }}>
                {securityStats.carbon5YearChange < 0 ? '↓' : '↑'} {Math.abs(securityStats.carbon5YearChange).toFixed(1)}% over 5 years
              </p>
            </div>

            {/* Source Diversification */}
            <div className="rounded-xl border p-5 sm:col-span-2 lg:col-span-1" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
              <p className="text-xs font-body font-medium uppercase tracking-[0.04em]" style={{ color: 'var(--text-secondary)' }}>
                Clean Energy Mix
              </p>
              <p className="font-body font-semibold text-[32px] tabular-nums leading-none mt-2" style={{ color: 'var(--text-primary)' }}>
                {securityStats.significantSources.length}
                <span className="text-[50%] ml-1" style={{ color: 'var(--text-muted)' }}>major sources</span>
              </p>
              <div className="flex flex-col gap-1.5 mt-3">
                {securityStats.significantSources.map((source) => (
                  <div key={source.name} className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(source.share * 2.5, 100)}%`,
                          background: source.name === 'Solar' ? 'var(--chart-solar)' :
                            source.name === 'Wind' ? 'var(--chart-wind)' :
                            source.name === 'Hydro' ? 'var(--chart-hydro)' :
                            source.name === 'Nuclear' ? 'var(--chart-nuclear)' :
                            source.name === 'Bioenergy' ? 'var(--chart-bioenergy)' :
                            'var(--chart-other-renew)',
                        }}
                      />
                    </div>
                    <span className="text-xs font-body tabular-nums w-24 text-right" style={{ color: 'var(--text-muted)' }}>
                      {source.name} {source.share.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

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
