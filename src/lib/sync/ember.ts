import { createServiceClient } from '@/lib/supabase/server'

const CSV_URL = 'https://raw.githubusercontent.com/ember-energy/ember-data-api/main/data/api_generation_yearly.csv'

type CsvRow = {
  country_or_region: string
  country_code: string
  year: number
  variable: string
  generation_twh: number | null
  share_of_generation_pct: number | null
  emissions_mtco2: number | null
}

function parseCSV(text: string): CsvRow[] {
  const lines = text.split('\n')
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.trim())
  const rows: CsvRow[] = []

  const idx = (name: string) => headers.indexOf(name)
  const iCountry = idx('country_or_region')
  const iCode = idx('country_code')
  const iYear = idx('year')
  const iVariable = idx('variable')
  const iGen = idx('generation_twh')
  const iShare = idx('share_of_generation_pct')
  const iEmissions = idx('emissions_mtco2')

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const vals: string[] = []
    let cur = '', inQ = false
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ }
      else if (ch === ',' && !inQ) { vals.push(cur); cur = '' }
      else { cur += ch }
    }
    vals.push(cur)

    const year = parseInt(vals[iYear] || '')
    if (!year || !vals[iCode]) continue

    rows.push({
      country_or_region: vals[iCountry] || '',
      country_code: vals[iCode] || '',
      year,
      variable: (vals[iVariable] || '').toLowerCase(),
      generation_twh: vals[iGen] ? parseFloat(vals[iGen]) : null,
      share_of_generation_pct: vals[iShare] ? parseFloat(vals[iShare]) : null,
      emissions_mtco2: vals[iEmissions] ? parseFloat(vals[iEmissions]) : null,
    })
  }
  return rows
}

// Aggregate entities are regions/groups, not countries
const AGGREGATE_CODES = new Set([
  'WLD', 'OECD', 'G20', 'G7', 'EU', 'ASEAN', 'BRICS',
  'AFR', 'AS', 'EUR', 'LAC', 'MEA', 'NAM', 'OCE', 'SAS',
])

function groupByCountryYear(rows: CsvRow[]) {
  const grouped = new Map<string, Record<string, number | string | boolean | null>>()

  for (const row of rows) {
    const key = `${row.country_code}__${row.year}`
    if (!grouped.has(key)) {
      grouped.set(key, {
        entity: row.country_or_region,
        entity_code: row.country_code,
        year: row.year,
        is_aggregate: AGGREGATE_CODES.has(row.country_code),
      })
    }
    const rec = grouped.get(key)!
    const v = row.variable

    // Map generation values
    if (row.generation_twh !== null && !isNaN(row.generation_twh)) {
      if (v === 'total') rec.total_generation = row.generation_twh
      else if (v === 'clean') rec.clean_generation = row.generation_twh
      else if (v === 'fossil') rec.fossil_generation = row.generation_twh
      else if (v === 'solar') rec.solar_generation = row.generation_twh
      else if (v === 'wind') rec.wind_generation = row.generation_twh
      else if (v === 'hydro') rec.hydro_generation = row.generation_twh
      else if (v === 'nuclear') rec.nuclear_generation = row.generation_twh
      else if (v === 'bioenergy') rec.bioenergy_generation = row.generation_twh
      else if (v === 'other renewables') rec.other_renewables_generation = row.generation_twh
      else if (v === 'coal') rec.coal_generation = row.generation_twh
      else if (v === 'gas') rec.gas_generation = row.generation_twh
      else if (v === 'oil') rec.oil_generation = row.generation_twh
    }

    // Map share values (clean & fossil only)
    if (row.share_of_generation_pct !== null && !isNaN(row.share_of_generation_pct)) {
      if (v === 'clean') rec.clean_share = row.share_of_generation_pct
      else if (v === 'fossil') rec.fossil_share = row.share_of_generation_pct
    }

    // Carbon intensity (from Total variable's emissions)
    if (v === 'total' && row.emissions_mtco2 !== null && rec.total_generation) {
      // Convert MtCO2 / TWh → gCO2/kWh:  MtCO2 / TWh * 1e6 / 1e9 * 1e3 = *1000
      // Actually: (emissions_mtco2 * 1e6) / (generation_twh * 1e9) * 1e3 = emissions/generation
      // Simplified: gCO2/kWh = emissions_mtco2 / generation_twh * 1e6 / 1e6 = emissions/generation * 1000
      rec.carbon_intensity_gco2_kwh = (row.emissions_mtco2 / (rec.total_generation as number)) * 1000
    }
  }

  return grouped
}

export async function syncEmberYearly() {
  const supabase = createServiceClient()

  const { data: syncLog } = await supabase
    .from('sync_log')
    .insert({ source: 'ember_yearly', status: 'running' })
    .select('id')
    .single()

  try {
    const res = await fetch(CSV_URL, { next: { revalidate: 0 } })
    if (!res.ok) throw new Error(`CSV fetch failed: ${res.status}`)
    const text = await res.text()
    const rows = parseCSV(text)
    if (rows.length === 0) throw new Error('No rows parsed from CSV')

    const grouped = groupByCountryYear(rows)

    // Collect entities
    const entities = new Map<string, { name: string; code: string; is_aggregate: boolean }>()
    for (const rec of grouped.values()) {
      const code = rec.entity_code as string
      if (!entities.has(code)) {
        entities.set(code, { name: rec.entity as string, code, is_aggregate: !!rec.is_aggregate })
      }
    }

    // Upsert countries
    const countryRows = Array.from(entities.values()).map(e => ({
      name: e.name, code: e.code,
      slug: e.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      is_aggregate: e.is_aggregate,
    }))
    await supabase.from('countries').upsert(countryRows, { onConflict: 'code' })

    const { data: countries } = await supabase.from('countries').select('id, code')
    if (!countries) throw new Error('Failed to fetch countries')
    const idMap = new Map(countries.map(c => [c.code, c.id]))

    // Prepare generation records
    const genRecords = Array.from(grouped.values())
      .map(rec => {
        const cid = idMap.get(rec.entity_code as string)
        if (!cid) return null
        return {
          country_id: cid, year: rec.year as number,
          total_generation: rec.total_generation ?? null,
          clean_generation: rec.clean_generation ?? null,
          fossil_generation: rec.fossil_generation ?? null,
          solar_generation: rec.solar_generation ?? null,
          wind_generation: rec.wind_generation ?? null,
          hydro_generation: rec.hydro_generation ?? null,
          nuclear_generation: rec.nuclear_generation ?? null,
          bioenergy_generation: rec.bioenergy_generation ?? null,
          other_renewables_generation: rec.other_renewables_generation ?? null,
          coal_generation: rec.coal_generation ?? null,
          gas_generation: rec.gas_generation ?? null,
          oil_generation: rec.oil_generation ?? null,
          clean_share: rec.clean_share ?? null,
          fossil_share: rec.fossil_share ?? null,
          carbon_intensity_gco2_kwh: rec.carbon_intensity_gco2_kwh ?? null,
        }
      })
      .filter(Boolean) as Array<Record<string, unknown>>

    // Upsert in batches
    let upserted = 0
    for (let i = 0; i < genRecords.length; i += 500) {
      const batch = genRecords.slice(i, i + 500)
      const { error } = await supabase.from('generation_yearly').upsert(batch, { onConflict: 'country_id,year' })
      if (error) throw new Error(`Upsert error at batch ${i}: ${error.message}`)
      upserted += batch.length
    }

    await supabase.from('sync_log').update({
      status: 'success', records_fetched: rows.length, records_upserted: upserted,
      completed_at: new Date().toISOString(),
    }).eq('id', syncLog?.id)

    return { success: true, source: 'github_csv', countries: entities.size, fetched: rows.length, upserted }
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
