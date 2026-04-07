import { getCountryLeaderboard } from '@/lib/supabase/queries'

export const revalidate = 86400

function getFlag(code: string): string {
  const alpha3to2: Record<string, string> = {
    USA: 'US', GBR: 'GB', FRA: 'FR', DEU: 'DE', CHN: 'CN', IND: 'IN',
    JPN: 'JP', BRA: 'BR', CAN: 'CA', AUS: 'AU', KOR: 'KR', ESP: 'ES',
    ITA: 'IT', NOR: 'NO', SWE: 'SE', DNK: 'DK', FIN: 'FI', NLD: 'NL',
    CHE: 'CH', AUT: 'AT', PRT: 'PT', NZL: 'NZ', ISL: 'IS', ALB: 'AL',
    PRY: 'PY', CRI: 'CR', URY: 'UY', ETH: 'ET', COD: 'CD', ZMB: 'ZM',
    KEN: 'KE', GEO: 'GE', LTU: 'LT', LVA: 'LV', BEL: 'BE', COL: 'CO',
  }
  const a2 = alpha3to2[code] || code.slice(0, 2)
  return a2.toUpperCase().split('').map(c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)).join('')
}

export default async function EmbedLeaderboard() {
  const leaderboard = await getCountryLeaderboard().catch(() => [])
  const top10 = leaderboard.slice(0, 10)

  return (
    <div className="p-4 max-w-[400px]">
      <div className="bg-bg-surface border border-border-default rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border-subtle">
          <p className="text-xs font-body font-medium text-text-secondary uppercase tracking-[0.05em]">
            Top 10 — Clean Energy Share
          </p>
        </div>

        <div>
          {top10.map((c: Record<string, unknown>, i: number) => (
            <a
              key={c.code as string}
              href={`https://iscleanenergywinning.com/country/${c.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-4 py-2.5 border-b border-border-subtle last:border-0 hover:bg-bg-elevated transition-colors"
            >
              <span className="w-6 text-xs font-body font-semibold text-text-muted tabular-nums text-center">
                {i + 1}
              </span>
              <span className="w-6 mx-2 text-base">{getFlag(c.code as string)}</span>
              <span className="flex-1 text-sm font-body font-medium text-text-primary truncate">
                {c.name as string}
              </span>
              <span className="text-sm font-body font-semibold text-accent-green tabular-nums">
                {(c.clean_share as number).toFixed(1)}%
              </span>
            </a>
          ))}
        </div>

        <div className="px-4 py-2.5 border-t border-border-subtle">
          <a
            href="https://iscleanenergywinning.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-body text-text-muted hover:text-accent-blue transition-colors"
          >
            iscleanenergywinning.com →
          </a>
        </div>
      </div>
    </div>
  )
}
