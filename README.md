# Clean Energy Scoreboard ⚡

**Is clean energy winning?** One page, one answer.

🔗 **[iscleanenergywinning.com](https://iscleanenergywinning.com)**

A consumer-facing scoreboard that tracks the global energy transition — scoreboards, leaderboards, and countdowns. ESPN for clean energy. Updated twice per month with public data.

---

## What's Inside

- **Global Score** — Clean energy's share of world electricity, with year-over-year momentum
- **Country Rankings** — 210+ countries ranked by clean energy share, sortable by momentum
- **US State Rankings** — All 50 states + DC with generation breakdowns
- **Historical Trends** — Clean vs. fossil electricity share since 2000
- **Milestone Countdowns** — Projected years to hit 50%, 60%, and 75% clean electricity
- **Energy Security** — Coal dependency, carbon intensity, and clean energy diversification
- **Bar Chart Race** — Animated visualization of countries racing toward clean energy
- **Shareable Stats** — Pre-made stat cards for social sharing
- **Dynamic OG Images** — Every page generates its own social preview image with live data

## Tech Stack

| Layer | Tool |
|-------|------|
| Framework | Next.js 15 (App Router, Server Components, ISR) |
| Styling | Tailwind CSS |
| Charts | Recharts + D3 |
| Database | Supabase (Postgres) |
| Hosting | Vercel |
| OG Images | @vercel/og |

## Data Sources

- **[Ember](https://ember-climate.org)** — Global electricity generation data for 215 countries (CC-BY-4.0)
- **[EIA](https://www.eia.gov)** — US state-level electricity generation data

Data is synced twice per month via Vercel Cron to match Ember's update cadence. The client never hits external APIs directly — all data is served from Supabase through Next.js ISR.

## Design

**"Signal Green"** — a dark, immersive canvas where green signals progress. The confidence of a sports scoreboard with the craft of Stripe and Linear. Mobile-first, accessible (WCAG AA+), and designed for sharing.

## Clean Energy Definition

Solar + wind + hydro + nuclear + bioenergy + other renewables. Follows [Ember's standard definition](https://ember-climate.org/data/data-tools/data-explorer/). This covers electricity generation only, not total energy or transport.

## License

Data: [Ember](https://ember-climate.org) (CC-BY-4.0), [EIA](https://www.eia.gov) (US government open data).
