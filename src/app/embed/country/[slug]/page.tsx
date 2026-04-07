import { notFound } from 'next/navigation'
import { getCountryBySlug, getCountryLatestData, getAllCountrySlugs } from '@/lib/supabase/queries'

export const revalidate = 86400

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const slugs = await getAllCountrySlugs().catch(() => [])
  return slugs.map((s) => ({ slug: s.slug }))
}

function getFlag(code: string): string {
  const alpha3to2: Record<string, string> = {
    USA: 'US', GBR: 'GB', FRA: 'FR', DEU: 'DE', CHN: 'CN', IND: 'IN',
    JPN: 'JP', BRA: 'BR', CAN: 'CA', AUS: 'AU', KOR: 'KR', ESP: 'ES',
    ITA: 'IT', NOR: 'NO', SWE: 'SE', DNK: 'DK', FIN: 'FI', ISL: 'IS',
  }
  const a2 = alpha3to2[code] || code.slice(0, 2)
  return a2.toUpperCase().split('').map(c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)).join('')
}

export default async function EmbedCountry({ params }: Props) {
  const { slug } = await params
  const country = await getCountryBySlug(slug).catch(() => null)
  if (!country) notFound()

  const countryData = await getCountryLatestData(country.id).catch(() => null)
  const latest = countryData?.latest
  const cleanShare = latest?.clean_share ?? null
  const fossilShare = latest?.fossil_share ?? null
  const momentum = countryData?.momentum ?? null
  const year = latest?.year ?? null

  return (
    <div className="p-4 max-w-[400px]">
      <div className="bg-bg-surface border border-border-default rounded-xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">{getFlag(country.code)}</span>
          <div>
            <p className="text-base font-display font-bold text-text-primary">{country.name}</p>
            <p className="text-xs font-body text-text-secondary">Clean Energy Share {year ? `(${year})` : ''}</p>
          </div>
        </div>

        {cleanShare !== null ? (
          <>
            <p
              className="font-display font-bold text-[36px] leading-none text-accent-green"
              style={{ textShadow: '0 0 30px rgba(34,197,94,0.15)' }}
            >
              {cleanShare.toFixed(1)}
              <span className="text-[60%] text-text-secondary">%</span>
            </p>

            {momentum !== null && (
              <p className={`text-sm font-body font-medium mt-2 ${momentum >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                {momentum >= 0 ? '↑' : '↓'} {Math.abs(momentum).toFixed(1)}pp from {year ? year - 1 : 'last year'}
              </p>
            )}

            <div className="mt-3">
              <div className="relative h-2.5 rounded-full overflow-hidden flex">
                <div className="bg-accent-green" style={{ width: `${cleanShare}%` }} />
                <div className="absolute top-0 bottom-0 bg-white w-[2px]" style={{ left: `${cleanShare}%` }} />
                <div className="bg-accent-fossil flex-1" />
              </div>
              <div className="flex justify-between mt-1 text-xs font-body">
                <span className="text-accent-green font-medium">{cleanShare.toFixed(1)}% Clean</span>
                <span className="text-accent-fossil">{fossilShare?.toFixed(1)}% Fossil</span>
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-text-secondary">Data unavailable</p>
        )}

        <a
          href={`https://iscleanenergywinning.com/country/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block mt-3 text-xs font-body text-text-muted hover:text-accent-blue transition-colors"
        >
          See full details →
        </a>
      </div>
    </div>
  )
}
