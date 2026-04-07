'use client'

import { useState } from 'react'
import Link from 'next/link'

type LeaderboardCountry = {
  id: number
  name: string
  code: string
  slug: string
  cleanShare: number | null
  momentum: number | null
}

export default function Leaderboard({ data }: { data: LeaderboardCountry[] }) {
  const [sortBy, setSortBy] = useState<'share' | 'momentum'>('share')
  const [showAll, setShowAll] = useState(false)

  const sorted = [...data].sort((a, b) => {
    if (sortBy === 'momentum') {
      return (b.momentum ?? -999) - (a.momentum ?? -999)
    }
    return (b.cleanShare ?? -999) - (a.cleanShare ?? -999)
  })

  const displayed = showAll ? sorted : sorted.slice(0, 20)

  if (data.length === 0) {
    return (
      <div className="border border-border-default rounded-xl bg-bg-surface p-8 text-center">
        <p className="text-sm text-text-secondary font-body">
          No leaderboard data yet — run the Ember sync to populate.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Sort Toggle */}
      <div className="mb-4">
        <div className="inline-flex bg-bg-surface border border-border-default rounded-lg p-1">
          <button
            onClick={() => setSortBy('share')}
            className={`px-4 py-2 text-sm font-body font-medium rounded-md transition-all duration-150 ${
              sortBy === 'share'
                ? 'bg-accent-green-dim text-accent-green'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            By Share
          </button>
          <button
            onClick={() => setSortBy('momentum')}
            className={`px-4 py-2 text-sm font-body font-medium rounded-md transition-all duration-150 ${
              sortBy === 'momentum'
                ? 'bg-accent-green-dim text-accent-green'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            By Momentum
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="border border-border-default rounded-xl overflow-hidden bg-bg-surface">
        {displayed.map((country, i) => (
          <Link
            key={country.id}
            href={`/country/${country.slug}`}
            className="flex items-center px-4 py-3 border-b border-border-subtle last:border-b-0 hover:bg-bg-elevated transition-colors duration-150 group"
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
                className={`hidden sm:inline-block w-[72px] text-center text-xs font-body font-medium px-2 py-0.5 rounded-full ml-3 ${
                  country.momentum >= 0
                    ? 'bg-[rgba(34,197,94,0.15)] text-accent-green'
                    : 'bg-[rgba(239,68,68,0.15)] text-accent-red'
                }`}
              >
                {country.momentum >= 0 ? '+' : ''}{country.momentum.toFixed(1)}
              </span>
            )}
            <span className="w-5 ml-2 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity hidden sm:inline">
              ›
            </span>
          </Link>
        ))}
      </div>

      {/* Show more */}
      {!showAll && sorted.length > 20 && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-4 w-full py-3 text-sm font-body font-medium text-text-secondary hover:text-accent-green border border-border-default rounded-xl bg-bg-surface hover:bg-bg-elevated transition-all duration-150"
        >
          Show all {sorted.length} countries
        </button>
      )}
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
    JAM: 'JM', SPM: 'PM', SUR: 'SR', ABW: 'AW', CUB: 'CU', HTI: 'HT',
    TTO: 'TT', PAN: 'PA', GTM: 'GT', HND: 'HN', SLV: 'SV', NIC: 'NI',
    DOM: 'DO', BLZ: 'BZ', GUY: 'GY', VEN: 'VE', MMR: 'MM', LAO: 'LA',
    KHM: 'KH', BRN: 'BN', UZB: 'UZ', TKM: 'TM', KGZ: 'KG', TJK: 'TJ',
    SDN: 'SD', SSD: 'SS', COD: 'CD', COG: 'CG', GAB: 'GA', MLI: 'ML',
    BFA: 'BF', NER: 'NE', TCD: 'TD', BWA: 'BW', NAM: 'NA', MWI: 'MW',
    MDG: 'MG', UGA: 'UG', RWA: 'RW', LBY: 'LY', SOM: 'SO', FJI: 'FJ',
    CIV: 'CI', SLE: 'SL', LBR: 'LR', TGO: 'TG', BEN: 'BJ', GIN: 'GN',
    CUW: 'CW', SXM: 'SX', GRL: 'GL', FRO: 'FO', NCL: 'NC', PYF: 'PF',
    MAC: 'MO', HKG: 'HK', FLK: 'FK', GIB: 'GI', BMU: 'BM', CYM: 'KY',
    VGB: 'VG', TLS: 'TL', AFG: 'AF',
  }
  const a2 = alpha3to2[code] || code.slice(0, 2)
  return a2.toUpperCase().split('').map(c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)).join('')
}
