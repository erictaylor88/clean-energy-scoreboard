'use client'

import dynamic from 'next/dynamic'

type RaceRecord = {
  year: number
  name: string
  code: string
  slug: string
  cleanShare: number
}

const BarChartRace = dynamic(() => import('@/components/BarChartRace'), {
  ssr: false,
  loading: () => (
    <div className="w-full flex items-center justify-center" style={{ height: 640 }}>
      <div className="text-sm font-body" style={{ color: 'var(--text-muted)' }}>
        Loading animation…
      </div>
    </div>
  ),
})

export default function BarChartRaceWrapper({ data, years }: { data: RaceRecord[]; years: number[] }) {
  return <BarChartRace data={data} years={years} />
}
