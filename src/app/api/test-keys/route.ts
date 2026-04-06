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

  // Test Ember
  try {
    const key = process.env.EMBER_API_KEY
    if (!key) {
      results.ember = { ok: false, detail: 'EMBER_API_KEY not set' }
    } else {
      const res = await fetch(
        `https://api.ember-climate.org/v1/electricity-generation/yearly.json?api_key=${key}&entity=World&date=2023&_size=1&_shape=array`
      )
      results.ember = res.ok
        ? { ok: true, detail: `Status ${res.status}` }
        : { ok: false, detail: `Status ${res.status}: ${res.statusText}` }
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
      const res = await fetch(
        `https://api.eia.gov/v2/electricity/electric-power-operational-data/data/?api_key=${key}&frequency=annual&data[0]=generation&start=2023&end=2023&facets[stateDescription][]=US&length=1`
      )
      results.eia = res.ok
        ? { ok: true, detail: `Status ${res.status}` }
        : { ok: false, detail: `Status ${res.status}: ${res.statusText}` }
    }
  } catch (e) {
    results.eia = { ok: false, detail: (e as Error).message }
  }

  const allOk = Object.values(results).every(r => r.ok)
  return NextResponse.json({ allOk, results }, { status: allOk ? 200 : 207 })
}
