import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Embed — Add Clean Energy Stats to Your Site',
  description: 'Free embeddable widgets showing global clean energy data. Copy and paste an iframe to add the scoreboard, leaderboard, or country cards to your website.',
}

const BASE = 'https://iscleanenergywinning.com'

const widgets = [
  {
    title: 'Global Score',
    description: 'The headline number — global clean energy share with trend and score bar.',
    path: '/embed/score',
    width: 420,
    height: 220,
  },
  {
    title: 'Top 10 Leaderboard',
    description: 'The 10 countries with the highest clean energy share, ranked.',
    path: '/embed/leaderboard',
    width: 420,
    height: 520,
  },
  {
    title: 'Country Card',
    description: 'Clean energy score for any country. Replace the slug with any country (e.g., germany, united-states, china).',
    path: '/embed/country/iceland',
    width: 420,
    height: 250,
  },
]

export default function EmbedPage() {
  return (
    <div className="max-w-[800px] mx-auto w-full px-4 md:px-10 py-12 md:py-20">
      <h1 className="font-display font-bold text-[36px] md:text-[48px] leading-tight text-text-primary mb-4">
        Embed Widgets
      </h1>
      <p className="font-body text-base text-text-secondary mb-12 max-w-[50ch]">
        Add live clean energy stats to your website, blog, or newsletter. Free to use — just copy and paste the iframe code.
      </p>

      <div className="space-y-12">
        {widgets.map((w) => {
          const iframeCode = `<iframe src="${BASE}${w.path}" width="${w.width}" height="${w.height}" frameborder="0" style="border:none;border-radius:12px;overflow:hidden;" loading="lazy"></iframe>`

          return (
            <section key={w.path} className="border border-border-default rounded-xl overflow-hidden">
              <div className="px-6 py-5 border-b border-border-subtle">
                <h2 className="font-display font-semibold text-[22px] text-text-primary">{w.title}</h2>
                <p className="font-body text-sm text-text-secondary mt-1">{w.description}</p>
              </div>

              <div className="px-6 py-5 bg-bg-surface">
                <p className="text-xs font-body font-medium text-text-secondary uppercase tracking-[0.04em] mb-3">
                  Preview
                </p>
                <div className="rounded-lg overflow-hidden border border-border-subtle inline-block">
                  <iframe
                    src={w.path}
                    width={w.width}
                    height={w.height}
                    style={{ border: 'none', borderRadius: '12px', overflow: 'hidden' }}
                    loading="lazy"
                  />
                </div>
              </div>

              <div className="px-6 py-5 border-t border-border-subtle">
                <p className="text-xs font-body font-medium text-text-secondary uppercase tracking-[0.04em] mb-2">
                  Embed Code
                </p>
                <pre className="bg-bg-primary border border-border-default rounded-lg p-4 text-xs font-mono text-text-secondary overflow-x-auto whitespace-pre-wrap break-all">
                  {iframeCode}
                </pre>
              </div>
            </section>
          )
        })}
      </div>

      <div className="mt-12 pt-8 border-t border-border-subtle">
        <h2 className="font-display font-semibold text-[22px] text-text-primary mb-3">Usage Notes</h2>
        <div className="font-body text-sm text-text-secondary space-y-2">
          <p>All widgets are free to embed with no API key required. Data updates automatically twice per month.</p>
          <p>Widgets use a dark background. For light-themed sites, wrap the iframe in a container with a dark background or border-radius to frame it.</p>
          <p>
            Data sourced from{' '}
            <a href="https://ember-climate.org" target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline">
              Ember
            </a>{' '}
            (CC-BY-4.0).
          </p>
        </div>
      </div>
    </div>
  )
}
