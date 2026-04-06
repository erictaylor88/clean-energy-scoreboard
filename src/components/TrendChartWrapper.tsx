'use client'

import dynamic from 'next/dynamic'

const TrendChart = dynamic(() => import('@/components/TrendChart'), { 
  ssr: false,
  loading: () => (
    <div className="border border-border-default rounded-xl bg-bg-surface p-8 text-center aspect-video flex items-center justify-center">
      <div className="h-6 w-32 rounded bg-bg-elevated animate-pulse" />
    </div>
  ),
})

export default TrendChart
