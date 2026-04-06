import { createServiceClient } from '@/lib/supabase/server'

const EIA_BASE = 'https://api.eia.gov/v2/electricity/electric-power-operational-data/data'

// EIA fuel type → our category mapping
const CLEAN_FUELS = new Set(['SUN', 'WND', 'HYC', 'NUC', 'GEO', 'WAS', 'WWW'])
const FOSSIL_FUELS = new Set(['COW', 'NG', 'PEL', 'PC'])
// We also track individual types for breakdowns
const FUEL_MAP: Record<string, string> = {
  SUN: 'solar',
  WND: 'wind',
  HYC: 'hydro',
  NUC: 'nuclear',
  COW: 'coal',
  NG: 'gas',
}

type EiaRow = {
  period: string
  stateid: string
  statedescription: string
  fueltypeid: string
  generation: string | number // thousand MWh
}

async function fetchEiaPage(apiKey: string, offset: number, length: number) {
  // Build URL manually — EIA requires unencoded brackets
  const params = [
    `api_key=${apiKey}`,
    `frequency=annual`,
    `data[0]=generation`,
    `facets[sectorid][]=99`,
    `start=2000`,
    `sort[0][column]=period`,
    `sort[0][direction]=asc`,
    `offset=${offset}`,
    `length=${length}`,
  ].join('&')

  const url = `${EIA_BASE}?${params}`
  const res = await fetch(url, { next: { revalidate: 0 } })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`EIA API error: ${res.status} ${res.statusText} — ${text.slice(0, 200)}`)
  }
  const json = await res.json()
  if (!json.response?.data || !Array.isArray(json.response.data)) {
    throw new Error(`Unexpected EIA response structure: ${JSON.stringify(json).slice(0, 300)}`)
  }
  return json.response as { data: EiaRow[]; total: number }
}

// Aggregate state+year data from individual fuel type rows
function buildStateYearData(rows: EiaRow[]) {
  const grouped = new Map<string, {
    state: string
    stateAbbr: string
    year: number
    total: number
    clean: number
    fossil: number
    solar: number
    wind: number
    hydro: number
    nuclear: number
    coal: number
    gas: number
  }>()

  for (const row of rows) {
    // Skip US-Total and other aggregates
    if (row.stateid === 'US' || row.stateid.length !== 2) continue
    // Skip if no generation value
    const gen = Number(row.generation)
    if (isNaN(gen)) continue

    const year = parseInt(row.period)
    if (!year) continue

    const key = `${row.stateid}__${year}`
    if (!grouped.has(key)) {
      grouped.set(key, {
        state: row.statedescription,
        stateAbbr: row.stateid,
        year,
        total: 0, clean: 0, fossil: 0,
        solar: 0, wind: 0, hydro: 0, nuclear: 0, coal: 0, gas: 0,
      })
    }
    const rec = grouped.get(key)!

    // Generation is in thousand MWh → convert to TWh
    const twh = gen / 1_000_000

    // ALL gives total generation
    if (row.fueltypeid === 'ALL') {
      rec.total = twh
    }

    if (CLEAN_FUELS.has(row.fueltypeid)) {
      rec.clean += twh
    }
    if (FOSSIL_FUELS.has(row.fueltypeid)) {
      rec.fossil += twh
    }

    // Individual breakdowns
    const mapped = FUEL_MAP[row.fueltypeid]
    if (mapped && mapped in rec) {
      (rec as unknown as Record<string, number>)[mapped] += twh
    }
  }

  return grouped
}

export async function syncEiaStates() {
  const supabase = createServiceClient()
  const apiKey = process.env.EIA_API_KEY
  if (!apiKey) throw new Error('Missing EIA_API_KEY')

  const { data: syncLog } = await supabase
    .from('sync_log')
    .insert({ source: 'eia_states', status: 'running' })
    .select('id')
    .single()

  try {
    // Fetch all data with pagination (5000 rows per page)
    const allRows: EiaRow[] = []
    const PAGE_SIZE = 5000
    let offset = 0
    let total = Infinity

    while (offset < total) {
      const response = await fetchEiaPage(apiKey, offset, PAGE_SIZE)
      total = response.total
      if (!response.data || response.data.length === 0) break
      allRows.push(...response.data)
      offset += response.data.length
      if (response.data.length < PAGE_SIZE) break
    }

    if (allRows.length === 0) throw new Error('No data from EIA API')

    const grouped = buildStateYearData(allRows)

    // Get state IDs from database
    const { data: states } = await supabase.from('us_states').select('id, abbreviation')
    if (!states || states.length === 0) throw new Error('No states in database')
    const stateIdMap = new Map(states.map(s => [s.abbreviation, s.id]))

    // Build upsert records
    const records = Array.from(grouped.values())
      .map(rec => {
        const stateId = stateIdMap.get(rec.stateAbbr)
        if (!stateId) return null

        const cleanShare = rec.total > 0 ? (rec.clean / rec.total) * 100 : null
        const fossilShare = rec.total > 0 ? (rec.fossil / rec.total) * 100 : null

        return {
          state_id: stateId,
          year: rec.year,
          total_generation: rec.total || null,
          clean_generation: rec.clean || null,
          fossil_generation: rec.fossil || null,
          solar_generation: rec.solar || null,
          wind_generation: rec.wind || null,
          hydro_generation: rec.hydro || null,
          nuclear_generation: rec.nuclear || null,
          coal_generation: rec.coal || null,
          gas_generation: rec.gas || null,
          clean_share: cleanShare,
          fossil_share: fossilShare,
        }
      })
      .filter(Boolean) as Array<Record<string, unknown>>

    // Upsert in batches
    let upserted = 0
    for (let i = 0; i < records.length; i += 500) {
      const batch = records.slice(i, i + 500)
      const { error } = await supabase
        .from('us_state_generation')
        .upsert(batch, { onConflict: 'state_id,year' })
      if (error) throw new Error(`Upsert error at batch ${i}: ${error.message}`)
      upserted += batch.length
    }

    await supabase.from('sync_log').update({
      status: 'success', records_fetched: allRows.length, records_upserted: upserted,
      completed_at: new Date().toISOString(),
    }).eq('id', syncLog?.id)

    return { success: true, source: 'eia_states', fetched: allRows.length, upserted }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    if (syncLog?.id) {
      await supabase.from('sync_log').update({
        status: 'error', error_message: msg, completed_at: new Date().toISOString(),
      }).eq('id', syncLog.id)
    }
    throw error
  }
}
