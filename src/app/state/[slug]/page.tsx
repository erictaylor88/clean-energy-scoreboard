import { notFound } from 'next/navigation'
import { getStateBySlug, getStateLatestData, getStateHistoricalTrend, getAllStateSlugs, getLastSyncTime } from '@/lib/supabase/queries'
import type { Metadata } from 'next'
import TrendChart from '@/components/TrendChartWrapper'
import { StatePageJsonLd } from '@/components/JsonLd'

export const revalidate = 86400

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const state = await getStateBySlug(slug).catch(() => null)
  if (!state) return { title: 'State Not Found' }
  return {
    title: `${state.name} — Clean Energy Score`,
    description: `How much of ${state.name}'s electricity comes from clean energy? See the score, trend, and generation breakdown.`,
    openGraph: {
      images: [{ url: `/api/og?type=state&slug=${slug}`, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      images: [`/api/og?type=state&slug=${slug}`],
    },
    alternates: {
      canonical: `https://iscleanenergywinning.com/state/${slug}`,
    },
  }
}

export async function generateStaticParams() {
  const slugs = await getAllStateSlugs().catch(() => [])
  return slugs.map((s) => ({ slug: s.slug }))
}

export default async function StatePage({ params }: Props) {
  const { slug } = await params
  const state = await getStateBySlug(slug).catch(() => null)
  if (!state) notFound()

  const [stateData, trendData, lastSync] = await Promise.all([
    getStateLatestData(state.id).catch(() => null),
    getStateHistoricalTrend(state.id).catch(() => []),
    getLastSyncTime().catch(() => null),
  ])

  const latest = stateData?.latest
  const cleanShare = latest?.clean_share ?? null
  const fossilShare = latest?.fossil_share ?? null
  const momentum = stateData?.momentum ?? null
  const year = latest?.year ?? null

  const breakdown = latest ? [
    { label: 'Solar', value: latest.solar_generation, color: '#FACC15' },
    { label: 'Wind', value: latest.wind_generation, color: '#38BDF8' },
    { label: 'Hydro', value: latest.hydro_generation, color: '#2DD4BF' },
    { label: 'Nuclear', value: latest.nuclear_generation, color: '#A78BFA' },
    { label: 'Coal', value: latest.coal_generation, color: '#57534E' },
    { label: 'Gas', value: latest.gas_generation, color: '#A8A29E' },
  ].filter(b => b.value && b.value > 0) : []

  const totalGen = latest?.total_generation ?? 0

  return (
    <div className="flex flex-col min-h-screen">
      <StatePageJsonLd stateName={state.name} cleanShare={cleanShare} year={year} slug={slug} />
      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-4 py-16 md:py-20">
        <span
          className="text-xs font-body font-bold px-2 py-1 rounded mb-4"
          style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
        >
          {state.abbreviation}
        </span>
        <h1 className="font-display font-bold text-[36px] md:text-[48px] leading-tight text-text-primary">
          {state.name}
        </h1>

        {cleanShare !== null ? (
          <>
            <p className="text-xs md:text-sm font-body font-medium text-text-secondary uppercase tracking-[0.05em] mt-4 mb-2">
              Clean Energy Share {year ? `(${year})` : ''}
            </p>
            <p
              className="font-display font-bold text-[48px] md:text-[56px] leading-none text-accent-green"
              style={{ textShadow: '0 0 40px rgba(34,197,94,0.15), 0 0 80px rgba(34,197,94,0.15)' }}
            >
              {cleanShare.toFixed(1)}
              <span className="text-[60%] text-text-secondary">%</span>
            </p>

            {momentum !== null && (
              <p className={`text-base font-body font-medium mt-3 ${momentum >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                {momentum >= 0 ? '↑' : '↓'} {Math.abs(momentum).toFixed(1)}pp from {year ? year - 1 : 'last year'}
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
          <p className="text-sm text-text-secondary font-body mt-4">No data available yet. Run the EIA sync to populate state data.</p>
        )}
      </section>

      {/* Generation Breakdown */}
      {breakdown.length > 0 && (
        <section className="max-w-[1200px] mx-auto w-full px-4 md:px-10 pb-12">
          <div className="pt-12 pb-6 border-t border-border-subtle">
            <h2 className="font-display font-semibold text-[28px] leading-tight text-text-primary">
              Generation Breakdown
            </h2>
            <p className="font-body text-base text-text-secondary mt-2">
              {year ? `${year}` : ''} electricity generation by source{totalGen > 0 ? ` (${totalGen.toFixed(1)} TWh total)` : ''}.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {breakdown.map((b) => (
              <div key={b.label} className="bg-bg-surface border border-border-default rounded-xl px-4 py-4 md:px-5">
                <p className="text-xs font-body font-medium text-text-secondary uppercase tracking-[0.04em] mb-1">{b.label}</p>
                <p className="text-2xl font-body font-semibold tabular-nums" style={{ color: b.color }}>
                  {b.value!.toFixed(1)}
                  <span className="text-sm font-normal text-text-muted ml-1">TWh</span>
                </p>
                {totalGen > 0 && (
                  <p className="text-xs font-body text-text-muted mt-1 tabular-nums">
                    {((b.value! / totalGen) * 100).toFixed(1)}% of total
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Trend Chart */}
      {trendData.length > 0 && (
        <section className="max-w-[1200px] mx-auto w-full px-4 md:px-10 pb-12">
          <div className="pt-12 pb-6 border-t border-border-subtle">
            <h2 className="font-display font-semibold text-[28px] leading-tight text-text-primary">
              Historical Trend
            </h2>
            <p className="font-body text-base text-text-secondary mt-2">
              Clean vs. fossil share since 2000.
            </p>
          </div>
          <TrendChart data={trendData} />
        </section>
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-border-subtle py-8 px-4 md:px-10">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-body text-text-muted">
          <p>
            Data from{' '}
            <a href="https://www.eia.gov" target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline">
              U.S. Energy Information Administration
            </a>.
            Clean energy = solar + wind + hydro + nuclear + geothermal + biomass.
          </p>
          {lastSync && (
            <p>Last updated: {new Date(lastSync).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          )}
        </div>
      </footer>
    </div>
  )
}
