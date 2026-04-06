'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

type TrendDataPoint = {
  year: number
  clean_share: number | null
  fossil_share: number | null
}

export default function TrendChart({ data }: { data: TrendDataPoint[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="border border-border-default rounded-xl bg-bg-surface p-8 text-center aspect-video flex items-center justify-center">
        <p className="text-sm text-text-secondary font-body">No trend data available.</p>
      </div>
    )
  }

  return (
    <div className="border border-border-default rounded-xl bg-bg-surface p-4 md:p-6">
      <div className="w-full aspect-[4/3] md:aspect-video">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="cleanGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22C55E" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="fossilGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#A8A29E" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#A8A29E" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              horizontal={true}
              vertical={false}
              strokeDasharray="4 4"
              stroke="#142920"
            />
            <XAxis
              dataKey="year"
              tick={{ fill: '#64748B', fontSize: 12, fontFamily: 'Inter Variable, system-ui' }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              tickFormatter={(y: number) => String(y)}
            />
            <YAxis
              tick={{ fill: '#64748B', fontSize: 12, fontFamily: 'Inter Variable, system-ui' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${v}%`}
              domain={[0, 100]}
              width={45}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="clean_share"
              name="Clean"
              stroke="#22C55E"
              strokeWidth={2}
              fill="url(#cleanGradient)"
              dot={false}
              activeDot={{ r: 4, fill: '#22C55E', strokeWidth: 0 }}
            />
            <Area
              type="monotone"
              dataKey="fossil_share"
              name="Fossil"
              stroke="#A8A29E"
              strokeWidth={2}
              fill="url(#fossilGradient)"
              dot={false}
              activeDot={{ r: 4, fill: '#A8A29E', strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: number }) {
  if (!active || !payload) return null

  return (
    <div className="bg-bg-elevated border border-border-default rounded-lg px-3 py-2 shadow-lg">
      <p className="text-xs font-body font-medium text-text-secondary mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-sm font-body tabular-nums" style={{ color: entry.color }}>
          {entry.name}: {entry.value?.toFixed(1)}%
        </p>
      ))}
    </div>
  )
}
