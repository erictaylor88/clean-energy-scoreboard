import { getLatestWorldData } from '@/lib/supabase/queries'

export const revalidate = 86400

export default async function EmbedScore() {
  const worldData = await getLatestWorldData().catch(() => null)
  const cleanShare = worldData?.latest?.clean_share ?? null
  const fossilShare = worldData?.latest?.fossil_share ?? null
  const momentum = worldData?.momentum ?? null
  const year = worldData?.latest?.year ?? null

  return (
    <div className="p-4 max-w-[400px]">
      <div className="bg-bg-surface border border-border-default rounded-xl p-5">
        <p className="text-xs font-body font-medium text-text-secondary uppercase tracking-[0.05em] mb-1">
          Global Clean Energy Share {year ? `(${year})` : ''}
        </p>

        {cleanShare !== null ? (
          <>
            <p
              className="font-display font-bold text-[40px] leading-none text-accent-green"
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

            {/* Score Bar */}
            <div className="mt-4">
              <div className="relative h-3 rounded-full overflow-hidden flex">
                <div className="bg-accent-green" style={{ width: `${cleanShare}%` }} />
                <div className="absolute top-0 bottom-0 bg-white w-[2px]" style={{ left: `${cleanShare}%` }} />
                <div className="bg-accent-fossil flex-1" />
              </div>
              <div className="flex justify-between mt-1.5 text-xs font-body">
                <span className="text-accent-green font-medium">{cleanShare.toFixed(1)}% Clean</span>
                <span className="text-accent-fossil">{fossilShare?.toFixed(1)}% Fossil</span>
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-text-secondary">Data unavailable</p>
        )}

        <a
          href="https://iscleanenergywinning.com"
          target="_blank"
          rel="noopener noreferrer"
          className="block mt-3 text-xs font-body text-text-muted hover:text-accent-blue transition-colors"
        >
          iscleanenergywinning.com →
        </a>
      </div>
    </div>
  )
}
