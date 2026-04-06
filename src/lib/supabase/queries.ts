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

// Get a single country by slug
export async function getCountryBySlug(slug: string) {
  const supabase = createReadClient()
  const { data } = await supabase
    .from('countries')
    .select('*')
    .eq('slug', slug)
    .single()
  return data
}

// Get all country slugs for static params
export async function getAllCountrySlugs() {
  const supabase = createReadClient()
  const { data } = await supabase
    .from('countries')
    .select('slug')
    .eq('is_aggregate', false)
  return data || []
}

// Get latest generation data for a country
export async function getCountryLatestData(countryId: number) {
  const supabase = createReadClient()

  const { data } = await supabase
    .from('generation_yearly')
    .select('*')
    .eq('country_id', countryId)
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

// Get all country clean_share data by year for bar chart race
export async function getRaceData() {
  const supabase = createReadClient()

  const { data: countries } = await supabase
    .from('countries')
    .select('id, name, code, slug, is_aggregate')
    .eq('is_aggregate', false)

  if (!countries) return { countries: [], years: [], data: [] }

  const countryMap = new Map(countries.map(c => [c.id, c]))

  // Supabase enforces PGRST_MAX_ROWS=1000 server-side — .limit() can't override it.
  // Paginate with .range() to get all ~2,800+ rows.
  const allGenData: Array<{ country_id: number; year: number; clean_share: number | null; total_generation: number | null }> = []
  const PAGE_SIZE = 1000
  let offset = 0
  let hasMore = true

  while (hasMore) {
    const { data: page } = await supabase
      .from('generation_yearly')
      .select('country_id, year, clean_share, total_generation')
      .gte('year', 2000)
      .order('year', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1)

    if (!page || page.length === 0) {
      hasMore = false
    } else {
      allGenData.push(...page)
      offset += page.length
      if (page.length < PAGE_SIZE) hasMore = false
    }
  }

  if (allGenData.length === 0) return { countries: [], years: [], data: [] }
  const genData = allGenData

  // Build year→country→value map, filtering to countries with meaningful generation
  const yearSet = new Set<number>()
  const records: Array<{
    year: number
    name: string
    code: string
    slug: string
    cleanShare: number
  }> = []

  for (const row of genData) {
    const country = countryMap.get(row.country_id)
    if (!country) continue
    if (row.clean_share === null) continue
    // Filter out very small countries (< 2 TWh total generation)
    if (row.total_generation !== null && row.total_generation < 2) continue

    yearSet.add(row.year)
    records.push({
      year: row.year,
      name: country.name,
      code: country.code,
      slug: country.slug,
      cleanShare: row.clean_share,
    })
  }

  const years = Array.from(yearSet).sort((a, b) => a - b)

  return { countries: countries.filter(c => !c.is_aggregate), years, data: records }
}

// ===== US STATE QUERIES =====

export type UsState = {
  id: number
  name: string
  abbreviation: string
  slug: string
}

export async function getStateLeaderboard() {
  const supabase = createReadClient()

  const { data: states } = await supabase
    .from('us_states')
    .select('id, name, abbreviation, slug')

  if (!states || states.length === 0) return []

  // Get latest year
  const { data: yearData } = await supabase
    .from('us_state_generation')
    .select('year')
    .order('year', { ascending: false })
    .limit(1)
    .single()

  if (!yearData) return []
  const latestYear = yearData.year

  const { data: genData } = await supabase
    .from('us_state_generation')
    .select('state_id, year, clean_share, total_generation')
    .in('year', [latestYear, latestYear - 1])

  if (!genData) return []

  const stateMap = new Map(states.map(s => [s.id, s]))
  const dataByState = new Map<number, { latest: number | null; previous: number | null; total: number | null }>()

  for (const row of genData) {
    const existing = dataByState.get(row.state_id) || { latest: null, previous: null, total: null }
    if (row.year === latestYear) {
      existing.latest = row.clean_share
      existing.total = row.total_generation
    } else {
      existing.previous = row.clean_share
    }
    dataByState.set(row.state_id, existing)
  }

  const leaderboard = Array.from(dataByState.entries())
    .map(([stateId, data]) => {
      const state = stateMap.get(stateId)
      if (!state) return null
      return {
        ...state,
        cleanShare: data.latest,
        momentum: data.latest !== null && data.previous !== null
          ? data.latest - data.previous
          : null,
      }
    })
    .filter(Boolean) as Array<{
      id: number; name: string; abbreviation: string; slug: string;
      cleanShare: number | null; momentum: number | null;
    }>

  leaderboard.sort((a, b) => (b.cleanShare ?? -999) - (a.cleanShare ?? -999))
  return leaderboard
}

export async function getStateBySlug(slug: string) {
  const supabase = createReadClient()
  const { data } = await supabase
    .from('us_states')
    .select('*')
    .eq('slug', slug)
    .single()
  return data
}

export async function getStateLatestData(stateId: number) {
  const supabase = createReadClient()
  const { data } = await supabase
    .from('us_state_generation')
    .select('*')
    .eq('state_id', stateId)
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

export async function getStateHistoricalTrend(stateId: number) {
  const supabase = createReadClient()
  const { data } = await supabase
    .from('us_state_generation')
    .select('year, clean_share, fossil_share, clean_generation, fossil_generation, total_generation')
    .eq('state_id', stateId)
    .gte('year', 2000)
    .order('year', { ascending: true })
  return data || []
}

export async function getAllStateSlugs() {
  const supabase = createReadClient()
  const { data } = await supabase
    .from('us_states')
    .select('slug')
  return data || []
}
