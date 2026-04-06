import { NextResponse } from 'next/server'
import { syncEmberYearly } from '@/lib/sync/ember'

// Vercel Cron calls this route
export const maxDuration = 300 // 5 minute timeout for large syncs

export async function GET(request: Request) {
  // Verify cron secret in production
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await syncEmberYearly()
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Sync failed:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
