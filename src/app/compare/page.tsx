import type { Metadata } from 'next'
import { getCountryLeaderboard } from '@/lib/supabase/queries'
import ComparisonClient from './ComparisonClient'

export const metadata: Metadata = {
  title: 'Compare Countries — Clean Energy Scoreboard',
  description: 'Compare clean energy scores between countries. See how different nations stack up on clean energy share, momentum, and generation mix.',
  openGraph: {
    images: [{ url: '/api/og?page=compare', width: 1200, height: 630 }],
  },
}

export const revalidate = 86400

export default async function ComparePage() {
  const leaderboard = await getCountryLeaderboard('share').catch(() => [])

  return <ComparisonClient countries={leaderboard} />
}
