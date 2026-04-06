import { createServiceClient } from '@/lib/supabase/server'

const EMBER_BASE = 'https://api.ember-climate.org/v1'

type EmberRow = {
  entity: string
  entity_code: string
  date: string
  category: string
  subcategory: string
  variable: string
  value: number
  unit: string
  is_aggregate_series?: boolean
}

// Fetch all yearly electricity data from Ember
async function fetchEmberYearly(apiKey: string): Promise<EmberRow[]> {
  const allRows: EmberRow[] = []
  let offset = 0
  const limit = 5000

  while (true) {
    const url = `${EMBER_BASE}/electricity-generation/yearly.json?api_key=${apiKey}&_shape=array&_size=${limit}&_offset=${offset}`
    const res = await fetch(url, { next: { revalidate: 0 } })

    if (!res.ok) {
      throw new Error(`Ember API error: ${res.status} ${res.statusText}`)
    }

    const rows: EmberRow[] = await res.json()
    allRows.push(...rows)

    if (rows.length < limit) break
    offset += limit
  }

  return allRows
}

// Transform Ember's flat rows into structured country-year records
function transformEmberData(rows: EmberRow[]) {
  // Group by entity + year
  const grouped = new Map<string, Record<string, number | string | boolean>>()

  for (const row of rows) {
    const key = `${row.entity_code}__${row.date}`
    if (!grouped.has(key)) {
      grouped.set(key, {
        entity: row.entity,
        entity_code: row.entity_code,
        year: parseInt(row.date),
        is_aggregate: row.is_aggregate_series ?? false,
      })
    }
    const record = grouped.get(key)!

    // Map Ember variables to our columns
    const variable = row.variable?.toLowerCase()
    const subcategory = row.subcategory?.toLowerCase()

    if (variable === 'generation' && row.unit === 'TWh') {
      if (subcategory === 'total') record.total_generation = row.value
      else if (subcategory === 'clean') record.clean_generation = row.value
      else if (subcategory === 'fossil') record.fossil_generation = row.value
      else if (subcategory === 'solar') record.solar_generation = row.value
      else if (subcategory === 'wind') record.wind_generation = row.value
      else if (subcategory === 'hydro') record.hydro_generation = row.value
      else if (subcategory === 'nuclear') record.nuclear_generation = row.value
      else if (subcategory === 'bioenergy') record.bioenergy_generation = row.value
      else if (subcategory === 'other renewables') record.other_renewables_generation = row.value
      else if (subcategory === 'coal') record.coal_generation = row.value
      else if (subcategory === 'gas') record.gas_generation = row.value
      else if (subcategory === 'oil') record.oil_generation = row.value
    } else if (variable === 'share' || variable === 'electricity share') {
      if (subcategory === 'clean') record.clean_share = row.value
      else if (subcategory === 'fossil') record.fossil_share = row.value
    } else if (variable === 'carbon intensity' || variable === 'co2 intensity') {
      record.carbon_intensity_gco2_kwh = row.value
    }
  }

  return grouped
}

export async function syncEmberYearly() {
  const apiKey = process.env.EMBER_API_KEY
  if (!apiKey) throw new Error('EMBER_API_KEY not set')

  const supabase = createServiceClient()

  // Log sync start
  const { data: syncLog } = await supabase
    .from('sync_log')
    .insert({ source: 'ember_yearly', status: 'running' })
    .select('id')
    .single()

  try {
    // Fetch from Ember
    const rows = await fetchEmberYearly(apiKey)

    // Transform
    const grouped = transformEmberData(rows)

    // Collect unique entities
    const entities = new Map<string, { name: string; code: string; is_aggregate: boolean }>()
    for (const record of grouped.values()) {
      const code = record.entity_code as string
      if (!entities.has(code)) {
        entities.set(code, {
          name: record.entity as string,
          code,
          is_aggregate: !!record.is_aggregate,
        })
      }
    }

    // Upsert countries
    const countryRows = Array.from(entities.values()).map(e => ({
      name: e.name,
      code: e.code,
      slug: e.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      is_aggregate: e.is_aggregate,
    }))

    await supabase.from('countries').upsert(countryRows, { onConflict: 'code' })

    // Fetch country IDs
    const { data: countries } = await supabase
      .from('countries')
      .select('id, code')

    if (!countries) throw new Error('Failed to fetch countries after upsert')

    const countryIdMap = new Map(countries.map(c => [c.code, c.id]))

    // Prepare generation records
    const genRecords = Array.from(grouped.values())
      .map(record => {
        const countryId = countryIdMap.get(record.entity_code as string)
        if (!countryId) return null
        return {
          country_id: countryId,
          year: record.year as number,
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

    // Upsert in batches of 500
    let upserted = 0
    for (let i = 0; i < genRecords.length; i += 500) {
      const batch = genRecords.slice(i, i + 500)
      const { error } = await supabase
        .from('generation_yearly')
        .upsert(batch, { onConflict: 'country_id,year' })

      if (error) throw new Error(`Upsert batch error: ${error.message}`)
      upserted += batch.length
    }

    // Update sync log
    await supabase
      .from('sync_log')
      .update({
        status: 'success',
        records_fetched: rows.length,
        records_upserted: upserted,
        completed_at: new Date().toISOString(),
      })
      .eq('id', syncLog?.id)

    return { success: true, fetched: rows.length, upserted }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    if (syncLog?.id) {
      await supabase
        .from('sync_log')
        .update({ status: 'error', error_message: msg, completed_at: new Date().toISOString() })
        .eq('id', syncLog.id)
    }
    throw error
  }
}
