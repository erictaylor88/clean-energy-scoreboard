import { NextResponse } from 'next/server'
import { syncEmberYearly } from '@/lib/sync/ember'
import { syncEiaStates } from '@/lib/sync/eia'

// Vercel Cron calls this route
export const maxDuration = 300 // 5 minute timeout for large syncs

export async function GET(request: Request) {
  // Verify cron secret in production
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: Record<string, unknown> = {}

  try {
    results.ember = await syncEmberYearly()
  } catch (error) {
    results.ember = { error: error instanceof Error ? error.message : 'Unknown error' }
  }

  try {
    results.eia = await syncEiaStates()
  } catch (error) {
    results.eia = { error: error instanceof Error ? error.message : 'Unknown error' }
  }

  const hasError = Object.values(results).some(r => r && typeof r === 'object' && 'error' in (r as Record<string, unknown>))
  return NextResponse.json(results, { status: hasError ? 207 : 200 })
}
