import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About',
  description: 'How the Clean Energy Scoreboard works — data sources, methodology, and attribution.',
}

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border-default bg-[rgba(8,15,12,0.8)] backdrop-blur-[12px]">
        <div className="max-w-[1200px] mx-auto px-4 md:px-10 h-12 flex items-center">
          <Link href="/" className="font-display font-bold text-text-primary text-sm tracking-tight hover:text-accent-green transition-colors">
            ← Scoreboard
          </Link>
        </div>
      </header>

      <div className="max-w-[720px] mx-auto w-full px-4 md:px-10 py-12 md:py-20">
        <h1 className="font-display font-bold text-[36px] md:text-[48px] leading-tight text-text-primary mb-8">
          About
        </h1>

        <div className="space-y-10 font-body text-base text-text-secondary leading-relaxed">
          {/* What */}
          <section>
            <h2 className="font-display font-semibold text-[22px] text-text-primary mb-3">What is this?</h2>
            <p>
              The Clean Energy Scoreboard tracks the global energy transition by answering one question:{' '}
              <span className="text-accent-green font-medium">Is clean energy winning?</span>
            </p>
            <p className="mt-3">
              We take electricity generation data from every country in the world and present it as a scoreboard — clean energy vs. fossil fuels. No jargon, no downloads, no paywalls. Just the score.
            </p>
          </section>

          {/* Data */}
          <section>
            <h2 className="font-display font-semibold text-[22px] text-text-primary mb-3">Data source</h2>
            <p>
              All data comes from{' '}
              <a href="https://ember-climate.org" target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline font-medium">
                Ember
              </a>
              , an independent energy think tank. Ember compiles electricity generation data from official government sources across 215 countries and territories.
            </p>
            <p className="mt-3">
              Ember&apos;s data is licensed under{' '}
              <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline">
                Creative Commons Attribution 4.0 (CC-BY-4.0)
              </a>
              . We are required to credit Ember as the source of this data, and we do so gladly — their work makes this scoreboard possible.
            </p>
          </section>

          {/* Definition */}
          <section>
            <h2 className="font-display font-semibold text-[22px] text-text-primary mb-3">What counts as &ldquo;clean energy&rdquo;?</h2>
            <p>
              We follow Ember&apos;s standard definition. Clean energy includes:
            </p>
            <ul className="mt-3 space-y-2">
              {[
                { name: 'Solar', color: '#FACC15' },
                { name: 'Wind', color: '#38BDF8' },
                { name: 'Hydro', color: '#2DD4BF' },
                { name: 'Nuclear', color: '#A78BFA' },
                { name: 'Bioenergy', color: '#FB923C' },
                { name: 'Other renewables', color: '#34D399' },
              ].map((source) => (
                <li key={source.name} className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: source.color }} />
                  <span className="text-text-primary">{source.name}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4">
              Fossil fuels (coal, gas, oil) are everything else. The &ldquo;clean energy share&rdquo; is the percentage of total electricity generation that comes from clean sources.
            </p>
            <p className="mt-3 text-text-muted text-sm">
              Note: The inclusion of nuclear energy as &ldquo;clean&rdquo; follows Ember&apos;s methodology and reflects its low-carbon generation profile. We recognize this is a topic of debate and present it transparently.
            </p>
          </section>

          {/* Methodology */}
          <section>
            <h2 className="font-display font-semibold text-[22px] text-text-primary mb-3">Methodology</h2>
            <p>
              <strong className="text-text-primary">Update cadence:</strong> Data is refreshed twice per month, matching Ember&apos;s publication schedule (first and third week of each month).
            </p>
            <p className="mt-3">
              <strong className="text-text-primary">Momentum:</strong> The year-over-year change in clean energy share (in percentage points). A country with 50% clean share last year and 53% this year has +3.0pp momentum.
            </p>
            <p className="mt-3">
              <strong className="text-text-primary">Leaderboard:</strong> Countries are ranked by clean energy share of electricity generation. Countries with less than 1 TWh of total generation are excluded to avoid statistical noise from very small economies.
            </p>
            <p className="mt-3">
              <strong className="text-text-primary">Caching:</strong> Pages are statically generated and revalidated every 24 hours. Data may be up to one day behind the latest Supabase sync.
            </p>
          </section>

          {/* Open source */}
          <section>
            <h2 className="font-display font-semibold text-[22px] text-text-primary mb-3">Open and free</h2>
            <p>
              The Clean Energy Scoreboard is a public good. No accounts, no paywalls, no ads. The source code is available on{' '}
              <a href="https://github.com/erictaylor88/clean-energy-scoreboard" target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline">
                GitHub
              </a>
              .
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="font-display font-semibold text-[22px] text-text-primary mb-3">Contact</h2>
            <p>
              Questions, corrections, or ideas? Open an issue on{' '}
              <a href="https://github.com/erictaylor88/clean-energy-scoreboard/issues" target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline">
                GitHub
              </a>
              .
            </p>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-auto border-t border-border-subtle py-8 px-4 md:px-10">
        <div className="max-w-[1200px] mx-auto text-center text-xs font-body text-text-muted">
          <p>
            Data from{' '}
            <a href="https://ember-climate.org" target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline">
              Ember
            </a>{' '}
            (CC-BY-4.0).
          </p>
        </div>
      </footer>
    </div>
  )
}
