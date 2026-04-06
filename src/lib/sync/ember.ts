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
      if (v === 'clean') rec.clean_generation = row.generation_twh
      else if (v === 'fossil') rec.fossil_generation = row.generation_twh
      else if (v === 'solar') rec.solar_generation = row.generation_twh
      else if (v === 'wind') rec.wind_generation = row.generation_twh
      else if (v === 'hydro') rec.hydro_generation = row.generation_twh
      else if (v === 'nuclear') rec.nuclear_generation = row.generation_twh
      else if (v === 'bioenergy') rec.bioenergy_generation = row.generation_twh
      else if (v === 'other renewables') rec.other_renewables_generation = row.generation_twh
      else if (v === 'coal') rec.coal_generation = row.generation_twh
      else if (v === 'gas') rec.gas_generation = row.generation_twh
      else if (v === 'oil' || v === 'other fossil') rec.oil_generation = row.generation_twh
    }

    // Map share values (clean & fossil only)
    if (row.share_of_generation_pct !== null && !isNaN(row.share_of_generation_pct)) {
      if (v === 'clean') rec.clean_share = row.share_of_generation_pct
      else if (v === 'fossil') rec.fossil_share = row.share_of_generation_pct
    }

    // Emissions
    if (row.emissions_mtco2 !== null && !isNaN(row.emissions_mtco2)) {
      if (v === 'fossil') rec.fossil_emissions = row.emissions_mtco2
    }
  }

  // Post-process: compute total_generation and carbon intensity
  for (const rec of grouped.values()) {
    const clean = (rec.clean_generation as number) || 0
    const fossil = (rec.fossil_generation as number) || 0
    if (clean > 0 || fossil > 0) {
      rec.total_generation = clean + fossil
    }
    if (rec.fossil_emissions && rec.total_generation) {
      rec.carbon_intensity_gco2_kwh = ((rec.fossil_emissions as number) / (rec.total_generation as number)) * 1000
    }
  }

  // Create World aggregate by summing non-aggregate countries per year
  const yearTotals = new Map<number, Record<string, number>>()
  for (const rec of grouped.values()) {
    if (AGGREGATE_CODES.has(rec.entity_code as string)) continue
    const year = rec.year as number
    if (!yearTotals.has(year)) {
      yearTotals.set(year, {
        clean: 0, fossil: 0, total: 0,
        solar: 0, wind: 0, hydro: 0, nuclear: 0, bioenergy: 0, other_renewables: 0,
        coal: 0, gas: 0, oil: 0, fossil_emissions: 0,
      })
    }
    const t = yearTotals.get(year)!
    t.clean += (rec.clean_generation as number) || 0
    t.fossil += (rec.fossil_generation as number) || 0
    t.total += (rec.total_generation as number) || 0
    t.solar += (rec.solar_generation as number) || 0
    t.wind += (rec.wind_generation as number) || 0
    t.hydro += (rec.hydro_generation as number) || 0
    t.nuclear += (rec.nuclear_generation as number) || 0
    t.bioenergy += (rec.bioenergy_generation as number) || 0
    t.other_renewables += (rec.other_renewables_generation as number) || 0
    t.coal += (rec.coal_generation as number) || 0
    t.gas += (rec.gas_generation as number) || 0
    t.oil += (rec.oil_generation as number) || 0
    t.fossil_emissions += (rec.fossil_emissions as number) || 0
  }
  for (const [year, t] of yearTotals) {
    const key = `WLD__${year}`
    grouped.set(key, {
      entity: 'World',
      entity_code: 'WLD',
      year,
      is_aggregate: true,
      clean_generation: t.clean,
      fossil_generation: t.fossil,
      total_generation: t.total,
      solar_generation: t.solar,
      wind_generation: t.wind,
      hydro_generation: t.hydro,
      nuclear_generation: t.nuclear,
      bioenergy_generation: t.bioenergy,
      other_renewables_generation: t.other_renewables,
      coal_generation: t.coal,
      gas_generation: t.gas,
      oil_generation: t.oil,
      fossil_emissions: t.fossil_emissions,
      carbon_intensity_gco2_kwh: t.total > 0 ? (t.fossil_emissions / t.total) * 1000 : null,
      clean_share: t.total > 0 ? (t.clean / t.total) * 100 : null,
      fossil_share: t.total > 0 ? (t.fossil / t.total) * 100 : null,
    })
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
