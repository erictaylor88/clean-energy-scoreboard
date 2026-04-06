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

  // Test Ember data source (GitHub CSV — API was retired)
  try {
    const csvUrl = 'https://raw.githubusercontent.com/ember-energy/ember-data-api/main/data/api_generation_yearly.csv'
    const res = await fetch(csvUrl, { method: 'HEAD' })
    if (res.ok) {
      results.ember = { ok: true, detail: `GitHub CSV reachable (${res.status}). Ember REST API retired; using CSV sync.` }
    } else {
      results.ember = { ok: false, detail: `GitHub CSV returned ${res.status}` }
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
