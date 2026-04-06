import { createReadClient } from './server'

export type Country = {
  id: number
  name: string
  code: string
  slug: string
  is_aggregate: boolean
}

export type GenerationYearly = {
  id: number
  country_id: number
  year: number
  total_generation: number | null
  clean_generation: number | null
  fossil_generation: number | null
  solar_generation: number | null
  wind_generation: number | null
  hydro_generation: number | null
  nuclear_generation: number | null
  bioenergy_generation: number | null
  other_renewables_generation: number | null
  coal_generation: number | null
  gas_generation: number | null
  oil_generation: number | null
  clean_share: number | null
  fossil_share: number | null
  carbon_intensity_gco2_kwh: number | null
}

export type SyncLogEntry = {
  id: number
  source: string
  status: string
  records_fetched: number
  records_upserted: number
  started_at: string
  completed_at: string | null
}

// Get the latest year of data for the world aggregate
export async function getLatestWorldData() {
  const supabase = createReadClient()

  // First get the World country record
  const { data: world } = await supabase
    .from('countries')
    .select('id')
    .eq('code', 'WLD')
    .single()

  if (!world) return null

  const { data } = await supabase
    .from('generation_yearly')
    .select('year, clean_share, fossil_share, clean_generation, fossil_generation, total_generation')
    .eq('country_id', world.id)
    .order('year', { ascending: false })
    .limit(2)

  if (!data || data.length === 0) return null

  const latest = data[0]
  const previous = data[1] || null
  const momentum = previous
    ? (latest.clean_share ?? 0) - (previous.clean_share ?? 0)
    : null

  return { latest, previous, momentum }
}

// Get country leaderboard (non-aggregate countries, latest year)
export async function getCountryLeaderboard(sortBy: 'share' | 'momentum' = 'share') {
  const supabase = createReadClient()

  // Get latest year
  const { data: yearData } = await supabase
    .from('generation_yearly')
    .select('year')
    .order('year', { ascending: false })
    .limit(1)
    .single()

  if (!yearData) return []

  const latestYear = yearData.year

  const { data: countries } = await supabase
    .from('countries')
    .select('id, name, code, slug, is_aggregate')
    .eq('is_aggregate', false)

  if (!countries) return []

  // Get latest + previous year data for all countries
  const { data: genData } = await supabase
    .from('generation_yearly')
    .select('country_id, year, clean_share, total_generation')
    .in('year', [latestYear, latestYear - 1])
    .order('year', { ascending: false })

  if (!genData) return []

  // Build leaderboard
  const countryMap = new Map(countries.map(c => [c.id, c]))
  const dataByCountry = new Map<number, { latest: number | null; previous: number | null; total: number | null }>()

  for (const row of genData) {
    const existing = dataByCountry.get(row.country_id) || { latest: null, previous: null, total: null }
    if (row.year === latestYear) {
      existing.latest = row.clean_share
      existing.total = row.total_generation
    } else {
      existing.previous = row.clean_share
    }
    dataByCountry.set(row.country_id, existing)
  }

  const leaderboard = Array.from(dataByCountry.entries())
    .map(([countryId, data]) => {
      const country = countryMap.get(countryId)
      if (!country || country.is_aggregate) return null
      // Skip countries with very small generation (< 1 TWh)
      if (data.total !== null && data.total < 1) return null
      return {
        ...country,
        cleanShare: data.latest,
        momentum: data.latest !== null && data.previous !== null
          ? data.latest - data.previous
          : null,
      }
    })
    .filter(Boolean) as Array<{
      id: number; name: string; code: string; slug: string;
      cleanShare: number | null; momentum: number | null;
    }>

  if (sortBy === 'momentum') {
    leaderboard.sort((a, b) => (b.momentum ?? -999) - (a.momentum ?? -999))
  } else {
    leaderboard.sort((a, b) => (b.cleanShare ?? -999) - (a.cleanShare ?? -999))
  }

  return leaderboard
}

// Get historical trend data for a country (or world)
export async function getHistoricalTrend(countrySlug: string = 'world') {
  const supabase = createReadClient()

  const { data: country } = await supabase
    .from('countries')
    .select('id')
    .eq('slug', countrySlug)
    .single()

  if (!country) return []

  const { data } = await supabase
    .from('generation_yearly')
    .select('year, clean_share, fossil_share, clean_generation, fossil_generation, total_generation')
    .eq('country_id', country.id)
    .gte('year', 2000)
    .order('year', { ascending: true })

  return data || []
}

// Get the last successful sync timestamp
export async function getLastSyncTime() {
  const supabase = createReadClient()

  const { data } = await supabase
    .from('sync_log')
    .select('completed_at, source')
    .eq('status', 'success')
    .order('completed_at', { ascending: false })
    .limit(1)
    .single()

  return data?.completed_at || null
}
