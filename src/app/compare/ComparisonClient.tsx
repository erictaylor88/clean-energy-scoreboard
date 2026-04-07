'use client'

import { useState } from 'react'

type Country = {
  id: number
  name: string
  code: string
  slug: string
  cleanShare: number | null
  momentum: number | null
}

function getFlag(code: string): string {
  const alpha3to2: Record<string, string> = {
    USA: 'US', GBR: 'GB', FRA: 'FR', DEU: 'DE', CHN: 'CN', IND: 'IN',
    JPN: 'JP', BRA: 'BR', CAN: 'CA', AUS: 'AU', KOR: 'KR', ESP: 'ES',
    ITA: 'IT', NOR: 'NO', SWE: 'SE', DNK: 'DK', FIN: 'FI', ISL: 'IS',
    NLD: 'NL', BEL: 'BE', AUT: 'AT', CHE: 'CH', PRT: 'PT', GRC: 'GR',
    POL: 'PL', CZE: 'CZ', ROU: 'RO', HUN: 'HU', UKR: 'UA', EGY: 'EG',
    NGA: 'NG', KEN: 'KE', COL: 'CO', CHL: 'CL', PER: 'PE', VNM: 'VN',
    PHL: 'PH', MYS: 'MY', SGP: 'SG', NZL: 'NZ', ISR: 'IL', ARE: 'AE',
    PAK: 'PK', BGD: 'BD', IRN: 'IR', IRQ: 'IQ', TWN: 'TW', RUS: 'RU',
    MEX: 'MX', IDN: 'ID', TUR: 'TR', SAU: 'SA', ARG: 'AR', ZAF: 'ZA',
    THA: 'TH', IRL: 'IE', CRI: 'CR', URY: 'UY', PRY: 'PY', ECU: 'EC',
  }
  const a2 = alpha3to2[code] || code.slice(0, 2)
  return a2.toUpperCase().split('').map(c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)).join('')
}

export default function ComparisonClient({ countries }: { countries: Country[] }) {
  const [selected, setSelected] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const selectedCountries = selected
    .map(slug => countries.find(c => c.slug === slug))
    .filter(Boolean) as Country[]

  const filtered = countries.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) &&
    !selected.includes(c.slug)
  ).slice(0, 8)

  const addCountry = (slug: string) => {
    if (selected.length < 4 && !selected.includes(slug)) {
      setSelected(prev => [...prev, slug])
    }
    setSearch('')
    setDropdownOpen(false)
  }

  const removeCountry = (slug: string) => {
    setSelected(prev => prev.filter(s => s !== slug))
  }

  // Find max clean share for relative bar sizing
  const maxShare = Math.max(...selectedCountries.map(c => c.cleanShare ?? 0), 1)

  return (
    <div className="flex flex-col min-h-screen">
      <section className="max-w-[1200px] mx-auto w-full px-4 md:px-10 py-12 md:py-20">
        <h1 className="font-display font-bold text-[36px] md:text-[48px] leading-tight text-text-primary mb-3">
          Compare Countries
        </h1>
        <p className="font-body text-base text-text-secondary mb-8 max-w-[50ch]">
          Select up to 4 countries to compare their clean energy scores side by side.
        </p>

        {/* Country picker */}
        <div className="relative mb-10 max-w-[400px]">
          <div className="flex flex-wrap gap-2 mb-3">
            {selectedCountries.map(c => (
              <span
                key={c.slug}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-body font-medium bg-bg-elevated text-text-primary border border-border-default"
              >
                {getFlag(c.code)} {c.name}
                <button
                  onClick={() => removeCountry(c.slug)}
                  className="ml-1 text-text-muted hover:text-accent-red transition-colors"
                  aria-label={`Remove ${c.name}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          {selected.length < 4 && (
            <div className="relative">
              <input
                type="text"
                placeholder={selected.length === 0 ? 'Search for a country...' : 'Add another country...'}
                value={search}
                onChange={e => { setSearch(e.target.value); setDropdownOpen(true) }}
                onFocus={() => setDropdownOpen(true)}
                className="w-full px-4 py-3 rounded-lg bg-bg-surface border border-border-default text-sm font-body text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-green-bright focus:border-transparent"
              />

              {dropdownOpen && search.length > 0 && filtered.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-bg-surface border border-border-default rounded-lg shadow-lg z-50 overflow-hidden">
                  {filtered.map(c => (
                    <button
                      key={c.slug}
                      onClick={() => addCountry(c.slug)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-bg-elevated transition-colors"
                    >
                      <span className="text-base">{getFlag(c.code)}</span>
                      <span className="text-sm font-body text-text-primary">{c.name}</span>
                      <span className="ml-auto text-sm font-body font-semibold text-accent-green tabular-nums">
                        {c.cleanShare?.toFixed(1)}%
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Comparison display */}
        {selectedCountries.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-text-muted font-body text-sm">
              Start typing a country name above to begin comparing.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Score comparison bars */}
            <div className="bg-bg-surface border border-border-default rounded-xl p-6">
              <h2 className="font-display font-semibold text-[22px] text-text-primary mb-6">
                Clean Energy Share
              </h2>
              <div className="space-y-5">
                {selectedCountries.map(c => (
                  <div key={c.slug}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getFlag(c.code)}</span>
                        <a
                          href={`/country/${c.slug}`}
                          className="text-sm font-body font-medium text-text-primary hover:text-accent-green transition-colors"
                        >
                          {c.name}
                        </a>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-body font-bold text-accent-green tabular-nums">
                          {c.cleanShare?.toFixed(1)}%
                        </span>
                        {c.momentum !== null && (
                          <span className={`text-xs font-body font-medium px-2 py-0.5 rounded-full ${
                            c.momentum >= 0
                              ? 'bg-[rgba(34,197,94,0.15)] text-accent-green'
                              : 'bg-[rgba(239,68,68,0.15)] text-accent-red'
                          }`}>
                            {c.momentum >= 0 ? '↑' : '↓'}{Math.abs(c.momentum).toFixed(1)}pp
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="relative h-6 rounded-full overflow-hidden flex bg-[var(--bg-primary)]">
                      <div
                        className="bg-accent-green rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${((c.cleanShare ?? 0) / 100) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Head-to-head clean vs fossil */}
            <div className="bg-bg-surface border border-border-default rounded-xl p-6">
              <h2 className="font-display font-semibold text-[22px] text-text-primary mb-6">
                Clean vs. Fossil
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {selectedCountries.map(c => {
                  const clean = c.cleanShare ?? 0
                  const fossil = 100 - clean
                  return (
                    <div key={c.slug} className="bg-bg-primary rounded-lg p-4 text-center">
                      <span className="text-2xl">{getFlag(c.code)}</span>
                      <p className="text-sm font-body font-medium text-text-primary mt-2 mb-3">{c.name}</p>
                      <div className="relative h-3 rounded-full overflow-hidden flex mx-auto max-w-[200px]">
                        <div className="bg-accent-green" style={{ width: `${clean}%` }} />
                        <div className="absolute top-0 bottom-0 bg-white w-[2px]" style={{ left: `${clean}%` }} />
                        <div className="bg-accent-fossil flex-1" />
                      </div>
                      <div className="flex justify-between mt-2 text-xs font-body max-w-[200px] mx-auto">
                        <span className="text-accent-green font-medium">{clean.toFixed(1)}%</span>
                        <span className="text-accent-fossil">{fossil.toFixed(1)}%</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Momentum comparison */}
            <div className="bg-bg-surface border border-border-default rounded-xl p-6">
              <h2 className="font-display font-semibold text-[22px] text-text-primary mb-6">
                Momentum (Year-over-Year Change)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {selectedCountries.map(c => (
                  <div key={c.slug} className="bg-bg-primary rounded-lg p-4 text-center">
                    <span className="text-2xl">{getFlag(c.code)}</span>
                    <p className="text-sm font-body font-medium text-text-primary mt-2 mb-2">{c.name}</p>
                    {c.momentum !== null ? (
                      <p className={`text-2xl font-body font-bold tabular-nums ${
                        c.momentum >= 0 ? 'text-accent-green' : 'text-accent-red'
                      }`}>
                        {c.momentum >= 0 ? '+' : ''}{c.momentum.toFixed(1)}
                        <span className="text-sm font-normal text-text-muted ml-1">pp</span>
                      </p>
                    ) : (
                      <p className="text-sm text-text-muted">No data</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Summary table */}
            <div className="bg-bg-surface border border-border-default rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-subtle">
                    <th className="text-left px-5 py-3 text-xs font-body font-medium text-text-secondary uppercase tracking-[0.04em]">
                      Country
                    </th>
                    <th className="text-right px-5 py-3 text-xs font-body font-medium text-text-secondary uppercase tracking-[0.04em]">
                      Clean Share
                    </th>
                    <th className="text-right px-5 py-3 text-xs font-body font-medium text-text-secondary uppercase tracking-[0.04em]">
                      Fossil Share
                    </th>
                    <th className="text-right px-5 py-3 text-xs font-body font-medium text-text-secondary uppercase tracking-[0.04em]">
                      Momentum
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCountries.map(c => {
                    const clean = c.cleanShare ?? 0
                    const fossil = 100 - clean
                    return (
                      <tr key={c.slug} className="border-b border-border-subtle last:border-0">
                        <td className="px-5 py-3">
                          <a href={`/country/${c.slug}`} className="flex items-center gap-2 text-sm font-body font-medium text-text-primary hover:text-accent-green transition-colors">
                            <span>{getFlag(c.code)}</span>
                            {c.name}
                          </a>
                        </td>
                        <td className="text-right px-5 py-3 text-sm font-body font-semibold text-accent-green tabular-nums">
                          {clean.toFixed(1)}%
                        </td>
                        <td className="text-right px-5 py-3 text-sm font-body text-accent-fossil tabular-nums">
                          {fossil.toFixed(1)}%
                        </td>
                        <td className="text-right px-5 py-3">
                          {c.momentum !== null ? (
                            <span className={`text-sm font-body font-medium tabular-nums ${
                              c.momentum >= 0 ? 'text-accent-green' : 'text-accent-red'
                            }`}>
                              {c.momentum >= 0 ? '+' : ''}{c.momentum.toFixed(1)}pp
                            </span>
                          ) : (
                            <span className="text-sm text-text-muted">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border-subtle py-8 px-4 md:px-10">
        <div className="max-w-[1200px] mx-auto text-xs font-body text-text-muted">
          Data from{' '}
          <a href="https://ember-climate.org" target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline">
            Ember
          </a>{' '}
          (CC-BY-4.0).
        </div>
      </footer>
    </div>
  )
}
