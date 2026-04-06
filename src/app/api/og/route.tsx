import { ImageResponse } from '@vercel/og'
import { createReadClient } from '@/lib/supabase/server'

export const runtime = 'edge'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'home'
  const slug = searchParams.get('slug')

  const supabase = createReadClient()

  if (type === 'country' && slug) {
    return countryOG(supabase, slug)
  }

  return homeOG(supabase)
}

async function homeOG(supabase: ReturnType<typeof createReadClient>) {
  // Get world data
  const { data: world } = await supabase
    .from('countries')
    .select('id')
    .eq('code', 'WLD')
    .single()

  let cleanShare = 40.8
  let momentum = 1.5
  let year = 2024

  if (world) {
    const { data } = await supabase
      .from('generation_yearly')
      .select('year, clean_share')
      .eq('country_id', world.id)
      .order('year', { ascending: false })
      .limit(2)

    if (data && data.length > 0) {
      cleanShare = data[0].clean_share ?? 40.8
      year = data[0].year
      if (data.length > 1) {
        momentum = (data[0].clean_share ?? 0) - (data[1].clean_share ?? 0)
      }
    }
  }

  const fossilShare = 100 - cleanShare

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#080F0C',
          padding: '60px',
        }}
      >
        <div style={{ display: 'flex', fontSize: '20px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>
          Global Clean Energy Share ({year})
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline' }}>
          <span style={{ fontSize: '120px', fontWeight: 700, color: '#22C55E', lineHeight: 1 }}>
            {cleanShare.toFixed(1)}
          </span>
          <span style={{ fontSize: '72px', fontWeight: 700, color: '#94A3B8', lineHeight: 1 }}>%</span>
        </div>
        <div style={{ display: 'flex', fontSize: '24px', color: momentum >= 0 ? '#22C55E' : '#EF4444', marginTop: '12px' }}>
          {momentum >= 0 ? '↑' : '↓'} {Math.abs(momentum).toFixed(1)}pp from {year - 1}
        </div>
        {/* Score bar */}
        <div style={{ display: 'flex', width: '600px', height: '20px', borderRadius: '9999px', overflow: 'hidden', marginTop: '40px' }}>
          <div style={{ width: `${cleanShare}%`, backgroundColor: '#22C55E', height: '100%' }} />
          <div style={{ width: '3px', backgroundColor: '#ffffff', height: '100%' }} />
          <div style={{ flex: 1, backgroundColor: '#A8A29E', height: '100%' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '600px', marginTop: '12px', fontSize: '18px' }}>
          <span style={{ color: '#22C55E' }}>{cleanShare.toFixed(1)}% Clean</span>
          <span style={{ color: '#A8A29E' }}>{fossilShare.toFixed(1)}% Fossil</span>
        </div>
        {/* Branding */}
        <div style={{ display: 'flex', position: 'absolute', bottom: '40px', fontSize: '18px', color: '#64748B' }}>
          Clean Energy Scoreboard · Data from Ember (CC-BY-4.0)
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  )
}

async function countryOG(supabase: ReturnType<typeof createReadClient>, slug: string) {
  const { data: country } = await supabase
    .from('countries')
    .select('id, name, code')
    .eq('slug', slug)
    .single()

  if (!country) {
    return homeOG(supabase)
  }

  const { data } = await supabase
    .from('generation_yearly')
    .select('year, clean_share')
    .eq('country_id', country.id)
    .order('year', { ascending: false })
    .limit(2)

  const cleanShare = data?.[0]?.clean_share ?? 0
  const year = data?.[0]?.year ?? 2024
  const momentum = data && data.length > 1
    ? (data[0].clean_share ?? 0) - (data[1].clean_share ?? 0)
    : 0
  const fossilShare = 100 - cleanShare

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#080F0C',
          padding: '60px',
        }}
      >
        <div style={{ display: 'flex', fontSize: '48px', fontWeight: 700, color: '#ECFDF5', marginBottom: '8px' }}>
          {country.name}
        </div>
        <div style={{ display: 'flex', fontSize: '18px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>
          Clean Energy Share ({year})
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline' }}>
          <span style={{ fontSize: '100px', fontWeight: 700, color: '#22C55E', lineHeight: 1 }}>
            {cleanShare.toFixed(1)}
          </span>
          <span style={{ fontSize: '60px', fontWeight: 700, color: '#94A3B8', lineHeight: 1 }}>%</span>
        </div>
        <div style={{ display: 'flex', fontSize: '22px', color: momentum >= 0 ? '#22C55E' : '#EF4444', marginTop: '12px' }}>
          {momentum >= 0 ? '↑' : '↓'} {Math.abs(momentum).toFixed(1)}pp from {year - 1}
        </div>
        {/* Score bar */}
        <div style={{ display: 'flex', width: '500px', height: '16px', borderRadius: '9999px', overflow: 'hidden', marginTop: '32px' }}>
          <div style={{ width: `${cleanShare}%`, backgroundColor: '#22C55E', height: '100%' }} />
          <div style={{ width: '3px', backgroundColor: '#ffffff', height: '100%' }} />
          <div style={{ flex: 1, backgroundColor: '#A8A29E', height: '100%' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '500px', marginTop: '10px', fontSize: '16px' }}>
          <span style={{ color: '#22C55E' }}>{cleanShare.toFixed(1)}% Clean</span>
          <span style={{ color: '#A8A29E' }}>{fossilShare.toFixed(1)}% Fossil</span>
        </div>
        <div style={{ display: 'flex', position: 'absolute', bottom: '40px', fontSize: '18px', color: '#64748B' }}>
          Clean Energy Scoreboard · Data from Ember (CC-BY-4.0)
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  )
}
