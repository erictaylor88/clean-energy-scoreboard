import { NextResponse } from 'next/server'

export async function GET() {
  const apiKey = process.env.EIA_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'No EIA_API_KEY' }, { status: 500 })

  const params = [
    `api_key=${apiKey}`,
    `frequency=annual`,
    `data[0]=generation`,
    `facets[sectorid][]=99`,
    `start=2022`,
    `sort[0][column]=period`,
    `sort[0][direction]=desc`,
    `offset=0`,
    `length=3`,
  ].join('&')

  const url = `https://api.eia.gov/v2/electricity/electric-power-operational-data/data?${params}`

  try {
    const res = await fetch(url, { next: { revalidate: 0 } })
    const json = await res.json()
    
    // Return the raw response structure so we can inspect field names
    return NextResponse.json({
      status: res.status,
      hasResponseData: !!json.response?.data,
      total: json.response?.total,
      sampleRows: json.response?.data?.slice(0, 3),
      fieldNames: json.response?.data?.[0] ? Object.keys(json.response.data[0]) : null,
      // If no data, show the raw response shape
      rawKeys: Object.keys(json),
      responseKeys: json.response ? Object.keys(json.response) : null,
      rawSnippet: JSON.stringify(json).slice(0, 500),
    })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown' }, { status: 500 })
  }
}
