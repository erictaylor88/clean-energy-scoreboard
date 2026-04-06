import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const results: Record<string, { ok: boolean; detail?: string }> = {}

  // Test Supabase
  try {
    const supabase = createServiceClient()
    const { count, error } = await supabase
      .from('countries')
      .select('*', { count: 'exact', head: true })
    results.supabase = error
      ? { ok: false, detail: error.message }
      : { ok: true, detail: `Connected. ${count ?? 0} countries.` }
  } catch (e) {
    results.supabase = { ok: false, detail: (e as Error).message }
  }

  // Test Ember — try multiple Datasette endpoint patterns
  try {
    const key = process.env.EMBER_API_KEY
    if (!key) {
      results.ember = { ok: false, detail: 'EMBER_API_KEY not set' }
    } else {
      const endpoints = [
        '/ember/generation_yearly.json',
        '/ember/generation_annual.json',
        '/ember/yearly_full_data.json',
        '/ember.json',
      ]
      const tried: string[] = []
      for (const ep of endpoints) {
        const res = await fetch(
          `https://api.ember-climate.org${ep}?api_key=${key}&_size=1&_shape=array`
        )
        if (res.ok) {
          const data = await res.json()
          const keys = Array.isArray(data) && data[0] ? Object.keys(data[0]).slice(0, 8).join(', ') : 'none'
          results.ember = { ok: true, detail: `${ep} — keys: ${keys}` }
          break
        } else {
          tried.push(`${ep}→${res.status}`)
          results.ember = { ok: false, detail: `Tried: ${tried.join('; ')}` }
        }
      }
    }
  } catch (e) {
    results.ember = { ok: false, detail: (e as Error).message }
  }

  // Test EIA
  try {
    const key = process.env.EIA_API_KEY
    if (!key) {
      results.eia = { ok: false, detail: 'EIA_API_KEY not set' }
    } else {
      const url = new URL('https://api.eia.gov/v2/electricity/electric-power-operational-data/data/')
      url.searchParams.set('api_key', key)
      url.searchParams.set('frequency', 'annual')
      url.searchParams.set('data[0]', 'generation')
      url.searchParams.set('start', '2023')
      url.searchParams.set('end', '2023')
      url.searchParams.set('length', '1')
      const res = await fetch(url.toString())
      if (res.ok) {
        results.eia = { ok: true, detail: `Status ${res.status}` }
      } else {
        const body = await res.text().catch(() => '')
        results.eia = { ok: false, detail: `Status ${res.status}: ${body.slice(0, 200)}` }
      }
    }
  } catch (e) {
    results.eia = { ok: false, detail: (e as Error).message }
  }

  const allOk = Object.values(results).every(r => r.ok)
  return NextResponse.json({ allOk, results }, { status: allOk ? 200 : 207 })
}
