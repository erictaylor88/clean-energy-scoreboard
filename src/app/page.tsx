import { getLatestWorldData, getCountryLeaderboard, getLastSyncTime } from '@/lib/supabase/queries'

export const revalidate = 86400

export default async function Home() {
  const worldData = await getLatestWorldData().catch(() => null)
  const leaderboard = await getCountryLeaderboard().catch(() => [])
  const lastSync = await getLastSyncTime().catch(() => null)

  const cleanShare = worldData?.latest?.clean_share ?? null
  const fossilShare = worldData?.latest?.fossil_share ?? null
  const momentum = worldData?.momentum ?? null
  const dataYear = worldData?.latest?.year ?? null

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border-default bg-[rgba(8,15,12,0.8)] backdrop-blur-[12px]">
        <div className="max-w-[1200px] mx-auto px-4 md:px-10 h-12 flex items-center justify-between">
          <span className="font-display font-bold text-text-primary text-sm tracking-tight">
            Clean Energy Scoreboard
          </span>
          <nav className="hidden md:flex items-center gap-6 text-sm font-body text-text-secondary">
            <a href="#rankings" className="hover:text-text-primary transition-colors duration-150">Rankings</a>
            <a href="#trends" className="hover:text-text-primary transition-colors duration-150">Trends</a>
            <a href="/about" className="hover:text-text-primary transition-colors duration-150">About</a>
          </nav>
          {lastSync && (
            <span className="text-xs font-body text-text-muted hidden md:block">
              Updated {new Date(lastSync).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          )}
        </div>
      </header>

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

        {leaderboard.length > 0 ? (
          <div className="border border-border-default rounded-xl overflow-hidden bg-bg-surface">
            {leaderboard.slice(0, 20).map((country, i) => (
              <div
                key={country.id}
                className="flex items-center px-4 py-3 border-b border-border-subtle last:border-b-0 hover:bg-bg-elevated transition-colors duration-150 cursor-pointer"
              >
                <span className="w-10 text-center font-body font-semibold tabular-nums text-text-muted text-base">
                  {i + 1}
                </span>
                <span className="w-7 mx-3 text-xl">{getCountryFlag(country.code)}</span>
                <span className="flex-1 font-body font-medium text-text-primary text-base truncate">
                  {country.name}
                </span>
                <span className="w-20 text-right font-body font-semibold tabular-nums text-accent-green text-base">
                  {country.cleanShare?.toFixed(1)}%
                </span>
                {country.momentum !== null && (
                  <span
                    className={`w-[72px] text-center text-xs font-body font-medium px-2 py-0.5 rounded-full ml-3 ${
                      country.momentum >= 0
                        ? 'bg-[rgba(34,197,94,0.15)] text-accent-green'
                        : 'bg-[rgba(239,68,68,0.15)] text-accent-red'
                    }`}
                  >
                    {country.momentum >= 0 ? '+' : ''}{country.momentum.toFixed(1)}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-border-default rounded-xl bg-bg-surface p-8 text-center">
            <p className="text-sm text-text-secondary font-body">
              No leaderboard data yet — run the Ember sync to populate.
            </p>
          </div>
        )}
      </section>

      {/* Trend placeholder */}
      <section id="trends" className="max-w-[1200px] mx-auto w-full px-4 md:px-10 pb-12">
        <div className="pt-12 pb-6 border-t border-border-subtle">
          <h2 className="font-display font-semibold text-[28px] leading-tight text-text-primary">
            How Did We Get Here?
          </h2>
          <p className="font-body text-base text-text-secondary mt-2 max-w-[50ch]">
            Historical trend of clean vs. fossil electricity generation since 2000.
          </p>
        </div>
        <div className="border border-border-default rounded-xl bg-bg-surface p-8 text-center aspect-video flex items-center justify-center">
          <p className="text-sm text-text-secondary font-body">Trend chart — coming in Phase 2</p>
        </div>
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
