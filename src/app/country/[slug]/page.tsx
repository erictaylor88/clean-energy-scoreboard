import { notFound } from 'next/navigation'
// TrendChart loaded via client wrapper
import { getCountryBySlug, getCountryLatestData, getHistoricalTrend, getAllCountrySlugs, getLastSyncTime } from '@/lib/supabase/queries'
import type { Metadata } from 'next'

import TrendChart from '@/components/TrendChartWrapper'

export const revalidate = 86400

// Countries with electricity access rates below ~60% (World Bank data)
// These countries may show high clean energy share because their small grids
// are often hydro-dominated, but most of the population lacks electricity access.
const LOW_ACCESS_COUNTRIES = new Set([
  'COD', 'TCD', 'SSD', 'BDI', 'CAF', 'NER', 'MWI', 'MOZ', 'MDG',
  'TZA', 'ETH', 'UGA', 'SLE', 'LBR', 'GIN', 'ZMB', 'AGO', 'MLI',
  'BFA', 'RWA', 'MRT', 'SOM', 'GMB', 'GNB', 'ERI', 'LSO', 'HTI',
  'MMR', 'PNG', 'LAO', 'KHM',
])

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const country = await getCountryBySlug(slug).catch(() => null)
  if (!country) return { title: 'Country Not Found' }
  return {
    title: `${country.name} — Clean Energy Score`,
    description: `How much of ${country.name}'s electricity comes from clean energy? See the score, trend, and generation breakdown.`,
    openGraph: {
      images: [{ url: `/api/og?type=country&slug=${slug}`, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      images: [`/api/og?type=country&slug=${slug}`],
    },
  }
}

export async function generateStaticParams() {
  const slugs = await getAllCountrySlugs().catch(() => [])
  return slugs.map((s) => ({ slug: s.slug }))
}

export default async function CountryPage({ params }: Props) {
  const { slug } = await params
  const country = await getCountryBySlug(slug).catch(() => null)
  if (!country) notFound()

  const [countryData, trendData, lastSync] = await Promise.all([
    getCountryLatestData(country.id).catch(() => null),
    getHistoricalTrend(slug).catch(() => []),
    getLastSyncTime().catch(() => null),
  ])

  const latest = countryData?.latest
  const cleanShare = latest?.clean_share ?? null
  const fossilShare = latest?.fossil_share ?? null
  const momentum = countryData?.momentum ?? null
  const year = latest?.year ?? null

  // Build breakdown data
  const breakdown = latest ? [
    { label: 'Solar', value: latest.solar_generation, color: '#FACC15' },
    { label: 'Wind', value: latest.wind_generation, color: '#38BDF8' },
    { label: 'Hydro', value: latest.hydro_generation, color: '#2DD4BF' },
    { label: 'Nuclear', value: latest.nuclear_generation, color: '#A78BFA' },
    { label: 'Bioenergy', value: latest.bioenergy_generation, color: '#FB923C' },
    { label: 'Other Renewables', value: latest.other_renewables_generation, color: '#34D399' },
    { label: 'Coal', value: latest.coal_generation, color: '#57534E' },
    { label: 'Gas', value: latest.gas_generation, color: '#A8A29E' },
    { label: 'Oil', value: latest.oil_generation, color: '#D6D3D1' },
  ].filter(b => b.value && b.value > 0) : []

  const totalGen = latest?.total_generation ?? 0

  const flag = getCountryFlag(country.code)

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-4 py-16 md:py-20">
        <span className="text-4xl mb-4">{flag}</span>
        <h1 className="font-display font-bold text-[36px] md:text-[48px] leading-tight text-text-primary">
          {country.name}
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

            {/* Low electricity access context badge */}
            {LOW_ACCESS_COUNTRIES.has(country.code) && (
              <div className="mt-6 w-full max-w-[480px] rounded-lg px-4 py-3 text-left"
                style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                <p className="text-xs font-body font-medium" style={{ color: '#F59E0B' }}>
                  ⚠ Low electricity access
                </p>
                <p className="text-xs font-body mt-1" style={{ color: 'var(--text-secondary)' }}>
                  A large share of {country.name}&apos;s population lacks access to electricity. The clean energy
                  share shown here reflects only the existing grid, which may be small and hydro-dominated. This
                  does not capture the country&apos;s total energy picture.
                </p>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-text-secondary font-body mt-4">No data available for this country.</p>
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
            <a href="https://ember-climate.org" target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline">
              Ember
            </a>{' '}
            (CC-BY-4.0). Clean energy = solar + wind + hydro + nuclear + bioenergy + other renewables.
            Covers electricity generation only — does not include heating, transport, or industrial energy use.
          </p>
          {lastSync && (
            <p>Last updated: {new Date(lastSync).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          )}
        </div>
      </footer>
    </div>
  )
}

function getCountryFlag(code: string): string {
  const alpha3to2: Record<string, string> = {
    USA: 'US', GBR: 'GB', FRA: 'FR', DEU: 'DE', CHN: 'CN', IND: 'IN',
    JPN: 'JP', BRA: 'BR', CAN: 'CA', AUS: 'AU', KOR: 'KR', ESP: 'ES',
    ITA: 'IT', MEX: 'MX', IDN: 'ID', TUR: 'TR', SAU: 'SA', ARG: 'AR',
    ZAF: 'ZA', THA: 'TH', NOR: 'NO', SWE: 'SE', DNK: 'DK', FIN: 'FI',
    NLD: 'NL', BEL: 'BE', AUT: 'AT', CHE: 'CH', PRT: 'PT', GRC: 'GR',
    POL: 'PL', CZE: 'CZ', ROU: 'RO', HUN: 'HU', UKR: 'UA', EGY: 'EG',
    NGA: 'NG', KEN: 'KE', COL: 'CO', CHL: 'CL', PER: 'PE', VNM: 'VN',
    PHL: 'PH', MYS: 'MY', SGP: 'SG', NZL: 'NZ', ISR: 'IL', ARE: 'AE',
    PAK: 'PK', BGD: 'BD', IRN: 'IR', IRQ: 'IQ', TWN: 'TW', ISL: 'IS',
    RUS: 'RU', KAZ: 'KZ', IRL: 'IE', LUX: 'LU', HRV: 'HR', SVK: 'SK',
    SVN: 'SI', BGR: 'BG', SRB: 'RS', LTU: 'LT', LVA: 'LV', EST: 'EE',
    CRI: 'CR', URY: 'UY', PRY: 'PY', ECU: 'EC', BOL: 'BO', ALB: 'AL',
    MKD: 'MK', MNE: 'ME', BIH: 'BA', MDA: 'MD', BLR: 'BY', CYP: 'CY',
    MLT: 'MT', GEO: 'GE', ARM: 'AM', AZE: 'AZ', MNG: 'MN', LKA: 'LK',
    NPL: 'NP', JOR: 'JO', KWT: 'KW', QAT: 'QA', BHR: 'BH', OMN: 'OM',
    MAR: 'MA', TUN: 'TN', DZA: 'DZ', ETH: 'ET', TZA: 'TZ', GHA: 'GH',
    AGO: 'AO', MOZ: 'MZ', ZMB: 'ZM', ZWE: 'ZW', SEN: 'SN', CMR: 'CM',
  }
  const a2 = alpha3to2[code] || code.slice(0, 2)
  return a2.toUpperCase().split('').map(c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)).join('')
}
