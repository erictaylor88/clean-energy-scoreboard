import { getShareableStats } from '@/lib/supabase/queries'
import { projectMilestones } from '@/lib/projections'
import { getHistoricalTrend } from '@/lib/supabase/queries'
import type { Metadata } from 'next'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Share These Stats — Clean Energy Scoreboard',
  description: 'Shareable stat cards about the global clean energy transition. Screenshot and share.',
  openGraph: {
    title: 'Share These Stats — Clean Energy Scoreboard',
    description: 'Shareable stat cards about the global clean energy transition.',
    images: [{ url: '/api/og', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Share These Stats — Clean Energy Scoreboard',
    description: 'Shareable stat cards about the global clean energy transition.',
  },
}

export default async function SharePage() {
  const [stats, trendData] = await Promise.all([
    getShareableStats(),
    getHistoricalTrend('world').catch(() => []),
  ])

  const projections = trendData.length > 0
    ? projectMilestones(trendData, [50])
    : []
  const yearTo50 = projections.find(p => p.milestone === 50)

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-10">
      {/* Header */}
      <div className="pt-12 md:pt-16 pb-6 md:pb-8 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <h1 className="font-display font-bold text-2xl md:text-[2.25rem] leading-[1.15] tracking-[-0.015em]" style={{ color: 'var(--text-primary)' }}>
          Share These Stats
        </h1>
        <p className="font-body text-base mt-2 max-w-[50ch]" style={{ color: 'var(--text-secondary)' }}>
          Screenshot any card and share it. Each one tells a story about the energy transition.
        </p>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-10">

        {/* Card 1: Global Score */}
        <div className="rounded-2xl border p-8 md:p-10 flex flex-col items-center text-center" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
          <p className="text-xs font-body font-medium uppercase tracking-[0.05em]" style={{ color: 'var(--text-secondary)' }}>
            Global Clean Energy Share ({stats.dataYear})
          </p>
          <p
            className="font-display font-bold text-[64px] md:text-[80px] leading-none mt-4"
            style={{ color: 'var(--accent-green)', textShadow: '0 0 40px rgba(34,197,94,0.15), 0 0 80px rgba(34,197,94,0.15)' }}
          >
            {stats.globalClean.toFixed(1)}
            <span className="text-[60%]" style={{ color: 'var(--text-secondary)' }}>%</span>
          </p>
          <p className={`text-base font-body font-medium mt-3 ${stats.globalMomentum >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
            {stats.globalMomentum >= 0 ? '↑' : '↓'} {Math.abs(stats.globalMomentum).toFixed(1)}pp from {stats.dataYear - 1}
          </p>
          {/* Score bar */}
          <div className="mt-6 w-full max-w-[320px]">
            <div className="relative h-3 rounded-full overflow-hidden flex">
              <div className="bg-accent-green" style={{ width: `${stats.globalClean}%` }} />
              <div className="absolute top-0 bottom-0 bg-white w-[2px]" style={{ left: `${stats.globalClean}%` }} />
              <div className="bg-accent-fossil flex-1" />
            </div>
            <div className="flex justify-between mt-2 text-xs font-body">
              <span className="text-accent-green font-medium">{stats.globalClean.toFixed(1)}% Clean</span>
              <span className="text-accent-fossil">{(100 - stats.globalClean).toFixed(1)}% Fossil</span>
            </div>
          </div>
          <p className="text-[10px] font-body mt-6" style={{ color: 'var(--text-muted)' }}>
            Clean Energy Scoreboard · Data from Ember (CC-BY-4.0)
          </p>
        </div>

        {/* Card 2: Countries Winning */}
        <div className="rounded-2xl border p-8 md:p-10 flex flex-col items-center text-center" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
          <p className="text-xs font-body font-medium uppercase tracking-[0.05em]" style={{ color: 'var(--text-secondary)' }}>
            Countries Where Clean Energy &gt; 50%
          </p>
          <p
            className="font-display font-bold text-[64px] md:text-[80px] leading-none mt-4"
            style={{ color: 'var(--accent-green)', textShadow: '0 0 40px rgba(34,197,94,0.15), 0 0 80px rgba(34,197,94,0.15)' }}
          >
            {stats.countriesAbove50}
          </p>
          <p className="text-base font-body font-medium mt-3" style={{ color: 'var(--text-secondary)' }}>
            out of {stats.totalCountries} countries tracked
          </p>
          <div className="mt-6 w-full max-w-[320px]">
            <div className="relative h-3 rounded-full overflow-hidden flex">
              <div className="bg-accent-green" style={{ width: `${(stats.countriesAbove50 / stats.totalCountries * 100)}%` }} />
              <div className="bg-accent-fossil flex-1" style={{ opacity: 0.3 }} />
            </div>
            <p className="text-xs font-body mt-2" style={{ color: 'var(--text-muted)' }}>
              {((stats.countriesAbove50 / stats.totalCountries) * 100).toFixed(0)}% of countries are majority-clean
            </p>
          </div>
          <p className="text-[10px] font-body mt-6" style={{ color: 'var(--text-muted)' }}>
            Clean Energy Scoreboard · Data from Ember (CC-BY-4.0)
          </p>
        </div>

        {/* Card 3: #1 Country */}
        {stats.topCountry && (
          <div className="rounded-2xl border p-8 md:p-10 flex flex-col items-center text-center" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
            <p className="text-xs font-body font-medium uppercase tracking-[0.05em]" style={{ color: 'var(--text-secondary)' }}>
              #1 Clean Energy Country ({stats.dataYear})
            </p>
            <p className="font-display font-bold text-[36px] md:text-[44px] leading-tight mt-4" style={{ color: 'var(--text-primary)' }}>
              {stats.topCountry.name}
            </p>
            <p
              className="font-display font-bold text-[56px] md:text-[72px] leading-none mt-2"
              style={{ color: 'var(--accent-green)', textShadow: '0 0 40px rgba(34,197,94,0.15)' }}
            >
              {stats.topCountry.cleanShare?.toFixed(1)}
              <span className="text-[60%]" style={{ color: 'var(--text-secondary)' }}>%</span>
            </p>
            {stats.topCountry.momentum !== null && (
              <p className={`text-base font-body font-medium mt-3 ${stats.topCountry.momentum >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                {stats.topCountry.momentum >= 0 ? '↑' : '↓'} {Math.abs(stats.topCountry.momentum).toFixed(1)}pp year-over-year
              </p>
            )}
            <p className="text-[10px] font-body mt-6" style={{ color: 'var(--text-muted)' }}>
              Clean Energy Scoreboard · Data from Ember (CC-BY-4.0)
            </p>
          </div>
        )}

        {/* Card 4: Fastest Climber */}
        {stats.fastestClimber && (
          <div className="rounded-2xl border p-8 md:p-10 flex flex-col items-center text-center" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
            <p className="text-xs font-body font-medium uppercase tracking-[0.05em]" style={{ color: 'var(--text-secondary)' }}>
              Fastest Growing Country ({stats.dataYear})
            </p>
            <p className="font-display font-bold text-[36px] md:text-[44px] leading-tight mt-4" style={{ color: 'var(--text-primary)' }}>
              {stats.fastestClimber.name}
            </p>
            <p
              className="font-display font-bold text-[56px] md:text-[72px] leading-none mt-2 text-accent-green"
              style={{ textShadow: '0 0 40px rgba(34,197,94,0.15)' }}
            >
              +{stats.fastestClimber.momentum?.toFixed(1)}
              <span className="text-[50%]" style={{ color: 'var(--text-secondary)' }}>pp</span>
            </p>
            <p className="text-base font-body font-medium mt-3" style={{ color: 'var(--text-secondary)' }}>
              Now at {stats.fastestClimber.cleanShare?.toFixed(1)}% clean energy
            </p>
            <p className="text-[10px] font-body mt-6" style={{ color: 'var(--text-muted)' }}>
              Clean Energy Scoreboard · Data from Ember (CC-BY-4.0)
            </p>
          </div>
        )}

        {/* Card 5: Solar + Wind */}
        <div className="rounded-2xl border p-8 md:p-10 flex flex-col items-center text-center" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
          <p className="text-xs font-body font-medium uppercase tracking-[0.05em]" style={{ color: 'var(--text-secondary)' }}>
            Global Solar + Wind Share ({stats.dataYear})
          </p>
          <p
            className="font-display font-bold text-[64px] md:text-[80px] leading-none mt-4"
            style={{ color: '#FACC15', textShadow: '0 0 40px rgba(250,204,21,0.15), 0 0 80px rgba(250,204,21,0.1)' }}
          >
            {stats.solarWindShare.toFixed(1)}
            <span className="text-[60%]" style={{ color: 'var(--text-secondary)' }}>%</span>
          </p>
          <p className="text-base font-body font-medium mt-3" style={{ color: 'var(--text-secondary)' }}>
            of global electricity from solar and wind
          </p>
          <div className="flex gap-4 mt-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: 'var(--chart-solar)' }} />
              <span className="text-xs font-body" style={{ color: 'var(--text-muted)' }}>Solar</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: 'var(--chart-wind)' }} />
              <span className="text-xs font-body" style={{ color: 'var(--text-muted)' }}>Wind</span>
            </div>
          </div>
          <p className="text-[10px] font-body mt-6" style={{ color: 'var(--text-muted)' }}>
            Clean Energy Scoreboard · Data from Ember (CC-BY-4.0)
          </p>
        </div>

        {/* Card 6: Countdown to 50% */}
        <div className="rounded-2xl border p-8 md:p-10 flex flex-col items-center text-center" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
          <p className="text-xs font-body font-medium uppercase tracking-[0.05em]" style={{ color: 'var(--text-secondary)' }}>
            When Will Clean Energy Hit 50%?
          </p>
          {yearTo50 && yearTo50.projectedYear ? (
            <>
              <p
                className="font-display font-bold text-[64px] md:text-[80px] leading-none mt-4"
                style={{ color: 'var(--accent-amber)', textShadow: '0 0 40px rgba(245,158,11,0.15)' }}
              >
                {yearTo50.projectedYear}
              </p>
              <p className="text-base font-body font-medium mt-3" style={{ color: 'var(--text-secondary)' }}>
                {yearTo50.projectedYear - stats.dataYear} years from now at current pace
              </p>
              <p className="text-xs font-body mt-4" style={{ color: 'var(--text-muted)' }}>
                Based on 5-year linear trend (R² = {yearTo50.r2.toFixed(2)})
              </p>
            </>
          ) : (
            <>
              <p
                className="font-display font-bold text-[48px] md:text-[56px] leading-none mt-4"
                style={{ color: 'var(--accent-amber)' }}
              >
                Insufficient Data
              </p>
              <p className="text-base font-body font-medium mt-3" style={{ color: 'var(--text-secondary)' }}>
                Not enough trend data to project
              </p>
            </>
          )}
          <p className="text-[10px] font-body mt-6" style={{ color: 'var(--text-muted)' }}>
            Clean Energy Scoreboard · Data from Ember (CC-BY-4.0)
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="pb-16 text-center">
        <p className="text-sm font-body" style={{ color: 'var(--text-muted)' }}>
          Long-press or right-click any card to save the image. All data from{' '}
          <a href="https://ember-climate.org" target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline">
            Ember
          </a>{' '}
          (CC-BY-4.0).
        </p>
      </div>
    </div>
  )
}
