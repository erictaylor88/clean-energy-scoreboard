import { createServiceClient } from '@/lib/supabase/server'

const EMBER_CSV_URL = 'https://raw.githubusercontent.com/ember-energy/ember-data-api/main/data/generation_annual_database.csv'

type ParsedRow = {
  entity: string
  entity_code: string
  year: number
  variable: string
  unit: string
  value: number
  subcategory: string
  is_aggregate_entity: boolean
}

function parseCSV(text: string): ParsedRow[] {
  const lines = text.split('\n')
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  const rows: ParsedRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const values: string[] = []
    let current = ''
    let inQuotes = false
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes }
      else if (char === ',' && !inQuotes) { values.push(current.trim()); current = '' }
      else { current += char }
    }
    values.push(current.trim())

    const obj: Record<string, string> = {}
    headers.forEach((h, idx) => { obj[h] = values[idx] || '' })

    const val = parseFloat(obj['value'] || obj['Value'] || '')
    if (isNaN(val)) continue

    rows.push({
      entity: obj['entity'] || obj['Entity'] || '',
      entity_code: obj['entity_code'] || obj['Entity code'] || '',
      year: parseInt(obj['date'] || obj['Date'] || obj['year'] || '0'),
      variable: (obj['variable'] || obj['Variable'] || '').toLowerCase(),
      unit: obj['unit'] || obj['Unit'] || '',
      value: val,
      subcategory: (obj['subcategory'] || obj['Subcategory'] || '').toLowerCase(),
      is_aggregate_entity: (obj['is_aggregate_entity'] || obj['is_aggregate_series'] || '') === 'true',
    })
  }
  return rows
}

function groupByCountryYear(rows: ParsedRow[]) {
  const grouped = new Map<string, Record<string, number | string | boolean>>()

  for (const row of rows) {
    if (!row.entity_code || !row.year) continue
    const key = `${row.entity_code}__${row.year}`
    if (!grouped.has(key)) {
      grouped.set(key, {
        entity: row.entity, entity_code: row.entity_code,
        year: row.year, is_aggregate: row.is_aggregate_entity,
      })
    }
    const record = grouped.get(key)!
    const sub = row.subcategory

    if ((row.variable === 'generation' || row.variable === 'electricity generation') && row.unit.toLowerCase() === 'twh') {
      if (sub === 'total' || sub === 'total generation') record.total_generation = row.value
      else if (sub === 'clean') record.clean_generation = row.value
      else if (sub === 'fossil') record.fossil_generation = row.value
      else if (sub === 'solar') record.solar_generation = row.value
      else if (sub === 'wind') record.wind_generation = row.value
      else if (sub === 'hydro') record.hydro_generation = row.value
      else if (sub === 'nuclear') record.nuclear_generation = row.value
      else if (sub === 'bioenergy') record.bioenergy_generation = row.value
      else if (sub === 'other renewables') record.other_renewables_generation = row.value
      else if (sub === 'coal') record.coal_generation = row.value
      else if (sub === 'gas') record.gas_generation = row.value
      else if (sub === 'oil') record.oil_generation = row.value
    } else if (row.variable === 'share' || row.variable === 'electricity share' || row.variable === '% share') {
      if (sub === 'clean') record.clean_share = row.value
      else if (sub === 'fossil') record.fossil_share = row.value
    } else if (row.variable === 'carbon intensity' || row.variable === 'co2 intensity' || row.variable === 'emissions intensity') {
      record.carbon_intensity_gco2_kwh = row.value
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
    // Fetch CSV from Ember's GitHub
    const res = await fetch(EMBER_CSV_URL, { next: { revalidate: 0 } })
    if (!res.ok) throw new Error(`Failed to fetch Ember CSV: ${res.status}`)
    const text = await res.text()
    const rows = parseCSV(text)

    if (rows.length === 0) throw new Error('No data parsed from Ember CSV')

    const grouped = groupByCountryYear(rows)

    // Collect unique entities
    const entities = new Map<string, { name: string; code: string; is_aggregate: boolean }>()
    for (const record of grouped.values()) {
      const code = record.entity_code as string
      if (!entities.has(code)) {
        entities.set(code, { name: record.entity as string, code, is_aggregate: !!record.is_aggregate })
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
    if (!countries) throw new Error('Failed to fetch countries after upsert')
    const countryIdMap = new Map(countries.map(c => [c.code, c.id]))

    const genRecords = Array.from(grouped.values())
      .map(record => {
        const countryId = countryIdMap.get(record.entity_code as string)
        if (!countryId) return null
        return {
          country_id: countryId, year: record.year as number,
          total_generation: record.total_generation ?? null,
          clean_generation: record.clean_generation ?? null,
          fossil_generation: record.fossil_generation ?? null,
          solar_generation: record.solar_generation ?? null,
          wind_generation: record.wind_generation ?? null,
          hydro_generation: record.hydro_generation ?? null,
          nuclear_generation: record.nuclear_generation ?? null,
          bioenergy_generation: record.bioenergy_generation ?? null,
          other_renewables_generation: record.other_renewables_generation ?? null,
          coal_generation: record.coal_generation ?? null,
          gas_generation: record.gas_generation ?? null,
          oil_generation: record.oil_generation ?? null,
          clean_share: record.clean_share ?? null,
          fossil_share: record.fossil_share ?? null,
          carbon_intensity_gco2_kwh: record.carbon_intensity_gco2_kwh ?? null,
        }
      })
      .filter(Boolean) as Array<Record<string, unknown>>

    let upserted = 0
    for (let i = 0; i < genRecords.length; i += 500) {
      const batch = genRecords.slice(i, i + 500)
      const { error } = await supabase.from('generation_yearly').upsert(batch, { onConflict: 'country_id,year' })
      if (error) throw new Error(`Upsert error: ${error.message}`)
      upserted += batch.length
    }

    await supabase.from('sync_log').update({
      status: 'success', records_fetched: rows.length, records_upserted: upserted,
      completed_at: new Date().toISOString(),
    }).eq('id', syncLog?.id)

    return { success: true, source: 'github_csv', fetched: rows.length, upserted }
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
