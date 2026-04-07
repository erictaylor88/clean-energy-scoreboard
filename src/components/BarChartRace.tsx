'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import * as d3 from 'd3'

type RaceRecord = {
  year: number
  name: string
  code: string
  slug: string
  cleanShare: number
}

type Props = {
  data: RaceRecord[]
  years: number[]
}

const TOP_N = 15
const BAR_HEIGHT = 36
const MARGIN = { top: 16, right: 80, bottom: 10, left: 160 }
const MOBILE_MARGIN = { top: 16, right: 60, bottom: 10, left: 110 }
const TRANSITION_MS = 450

// Country code → emoji flag
function codeToFlag(code: string) {
  if (code.length !== 3) return ''
  // Map common 3-letter to 2-letter ISO codes for flag emoji
  const map: Record<string, string> = {
    USA: 'US', GBR: 'GB', FRA: 'FR', DEU: 'DE', JPN: 'JP', CHN: 'CN',
    IND: 'IN', BRA: 'BR', CAN: 'CA', AUS: 'AU', KOR: 'KR', MEX: 'MX',
    IDN: 'ID', TUR: 'TR', SAU: 'SA', ARG: 'AR', ZAF: 'ZA', NGA: 'NG',
    EGY: 'EG', PAK: 'PK', BGD: 'BD', RUS: 'RU', ITA: 'IT', ESP: 'ES',
    NLD: 'NL', SWE: 'SE', NOR: 'NO', DNK: 'DK', FIN: 'FI', CHE: 'CH',
    AUT: 'AT', BEL: 'BE', PRT: 'PT', GRC: 'GR', POL: 'PL', CZE: 'CZ',
    ROU: 'RO', HUN: 'HU', UKR: 'UA', THA: 'TH', VNM: 'VN', PHL: 'PH',
    MYS: 'MY', SGP: 'SG', TWN: 'TW', NZL: 'NZ', CHL: 'CL', COL: 'CO',
    PER: 'PE', VEN: 'VE', IRN: 'IR', IRQ: 'IQ', ISR: 'IL', ARE: 'AE',
    KWT: 'KW', QAT: 'QA', ETH: 'ET', KEN: 'KE', TZA: 'TZ', GHA: 'GH',
    CIV: 'CI', CMR: 'CM', AGO: 'AO', MOZ: 'MZ', MMR: 'MM', LKA: 'LK',
    NPL: 'NP', PRY: 'PY', URY: 'UY', ECU: 'EC', BOL: 'BO', PAN: 'PA',
    CRI: 'CR', GTM: 'GT', HND: 'HN', SLV: 'SV', NIC: 'NI', DOM: 'DO',
    CUB: 'CU', HTI: 'HT', JAM: 'JM', TTO: 'TT', ISL: 'IS', LUX: 'LU',
    IRL: 'IE', HRV: 'HR', SVK: 'SK', SVN: 'SI', SRB: 'RS', BGR: 'BG',
    LTU: 'LT', LVA: 'LV', EST: 'EE', ALB: 'AL', MKD: 'MK', BIH: 'BA',
    MNE: 'ME', GEO: 'GE', ARM: 'AM', AZE: 'AZ', KAZ: 'KZ', UZB: 'UZ',
    TKM: 'TM', KGZ: 'KG', TJK: 'TJ', MNG: 'MN', LAO: 'LA', KHM: 'KH',
    BRN: 'BN', MAC: 'MO', HKG: 'HK', JOR: 'JO', LBN: 'LB', OMN: 'OM',
    BHR: 'BH', YEM: 'YE', SYR: 'SY', LBY: 'LY', TUN: 'TN', DZA: 'DZ',
    MAR: 'MA', SDN: 'SD', SSD: 'SS', COD: 'CD', COG: 'CG', GAB: 'GA',
    SEN: 'SN', MLI: 'ML', BFA: 'BF', NER: 'NE', TCD: 'TD', ZMB: 'ZM',
    ZWE: 'ZW', BWA: 'BW', NAM: 'NA', MWI: 'MW', MDG: 'MG', UGA: 'UG',
    RWA: 'RW', BDI: 'BI', SOM: 'SO', ERI: 'ER', DJI: 'DJ', LSO: 'LS',
    SWZ: 'SZ', MUS: 'MU', CPV: 'CV', STP: 'ST', GNQ: 'GQ', COM: 'KM',
    SYC: 'SC', MRT: 'MR', GMB: 'GM', GNB: 'GW', GIN: 'GN', SLE: 'SL',
    LBR: 'LR', TGO: 'TG', BEN: 'BJ', BLZ: 'BZ', GUY: 'GY', SUR: 'SR',
    FJI: 'FJ', PNG: 'PG', SLB: 'SB', VUT: 'VU', WSM: 'WS', TON: 'TO',
    FSM: 'FM', PLW: 'PW', MHL: 'MH', KIR: 'KI', NRU: 'NR', TUV: 'TV',
    MDV: 'MV', BTN: 'BT', TLS: 'TL', AFG: 'AF', MDA: 'MD', BLR: 'BY',
    CYP: 'CY', MLT: 'MT', MCO: 'MC', AND: 'AD', LIE: 'LI', SMR: 'SM',
    SXM: 'SX', ABW: 'AW', CUW: 'CW', BMU: 'BM', CYM: 'KY', VGB: 'VG',
    GIB: 'GI', FLK: 'FK', GRL: 'GL', FRO: 'FO', NCL: 'NC', PYF: 'PF',
  }
  const iso2 = map[code]
  if (!iso2) return ''
  return String.fromCodePoint(...[...iso2].map(c => 0x1F1E6 + c.charCodeAt(0) - 65))
}

export default function BarChartRace({ data, years }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [currentYearIdx, setCurrentYearIdx] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const currentYear = years[currentYearIdx] ?? years[0]

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Get top N for a given year
  const getTopN = useCallback((year: number) => {
    const yearData = data.filter(d => d.year === year)
    yearData.sort((a, b) => b.cleanShare - a.cleanShare)
    return yearData.slice(0, TOP_N)
  }, [data])

  // Draw / update chart
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || years.length === 0) return

    const margin = isMobile ? MOBILE_MARGIN : MARGIN
    const containerWidth = containerRef.current.clientWidth
    const width = containerWidth
    const height = margin.top + TOP_N * BAR_HEIGHT + margin.bottom

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)

    const topData = getTopN(currentYear)
    if (topData.length === 0) return

    const innerWidth = width - margin.left - margin.right

    const x = d3.scaleLinear()
      .domain([0, 100])
      .range([0, innerWidth])

    const y = d3.scaleBand<number>()
      .domain(d3.range(TOP_N))
      .range([margin.top, height - margin.bottom])
      .padding(0.15)

    // Ensure group exists
    let g = svg.select<SVGGElement>('g.chart-area')
    if (g.empty()) {
      g = svg.append('g').attr('class', 'chart-area')
    }

    // Year watermark — large background year
    let watermark = svg.select<SVGTextElement>('text.year-watermark')
    if (watermark.empty()) {
      watermark = svg.append('text')
        .attr('class', 'year-watermark')
        .attr('text-anchor', 'end')
        .attr('dominant-baseline', 'auto')
        .attr('fill', 'var(--border-default)')
        .attr('opacity', 0.5)
        .attr('font-family', "'Inter Variable', system-ui, sans-serif")
        .attr('font-weight', '700')
        .attr('font-variant-numeric', 'tabular-nums')
        .style('pointer-events', 'none')
    }
    watermark
      .attr('font-size', isMobile ? '80px' : '120px')
      .attr('x', width - (isMobile ? 12 : 20))
      .attr('y', height - 10)
      .text(currentYear)

    // Bars
    const bars = g.selectAll<SVGRectElement, typeof topData[number]>('rect.bar')
      .data(topData, d => d.code)

    bars.enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('rx', 4)
      .attr('fill', 'var(--accent-green)')
      .attr('opacity', 0.85)
      .attr('x', margin.left)
      .attr('height', y.bandwidth())
      .attr('width', 0)
      .attr('y', (_, i) => y(i)!)
      .merge(bars)
      .transition()
      .duration(TRANSITION_MS)
      .ease(d3.easeLinear)
      .attr('y', (_, i) => y(i)!)
      .attr('width', d => Math.max(0, x(d.cleanShare)))
      .attr('height', y.bandwidth())

    bars.exit()
      .transition()
      .duration(TRANSITION_MS / 2)
      .attr('width', 0)
      .attr('opacity', 0)
      .remove()

    // Country labels (left of bars)
    const labels = g.selectAll<SVGTextElement, typeof topData[number]>('text.label')
      .data(topData, d => d.code)

    const labelFontSize = isMobile ? '11px' : '13px'

    labels.enter()
      .append('text')
      .attr('class', 'label')
      .attr('text-anchor', isMobile ? 'start' : 'end')
      .attr('fill', 'var(--text-primary)')
      .attr('font-family', "'Inter Variable', system-ui, sans-serif")
      .attr('font-weight', '500')
      .attr('font-size', labelFontSize)
      .attr('x', isMobile ? 8 : margin.left - 8)
      .attr('y', (_, i) => y(i)! + y.bandwidth() / 2 + 4)
      .text(d => `${codeToFlag(d.code)} ${isMobile ? d.code : d.name}`)
      .merge(labels)
      .transition()
      .duration(TRANSITION_MS)
      .ease(d3.easeLinear)
      .attr('text-anchor', isMobile ? 'start' : 'end')
      .attr('x', isMobile ? 8 : margin.left - 8)
      .attr('y', (_, i) => y(i)! + y.bandwidth() / 2 + 4)
      .attr('font-size', labelFontSize)
      .text(d => `${codeToFlag(d.code)} ${isMobile ? d.code : d.name}`)

    labels.exit()
      .transition()
      .duration(TRANSITION_MS / 2)
      .attr('opacity', 0)
      .remove()

    // Value labels (right of bars)
    const values = g.selectAll<SVGTextElement, typeof topData[number]>('text.value')
      .data(topData, d => d.code)

    values.enter()
      .append('text')
      .attr('class', 'value')
      .attr('fill', 'var(--accent-green-bright)')
      .attr('font-family', "'Inter Variable', system-ui, sans-serif")
      .attr('font-weight', '600')
      .attr('font-size', isMobile ? '11px' : '12px')
      .attr('font-variant-numeric', 'tabular-nums')
      .attr('x', d => margin.left + x(d.cleanShare) + 6)
      .attr('y', (_, i) => y(i)! + y.bandwidth() / 2 + 4)
      .text(d => `${d.cleanShare.toFixed(1)}%`)
      .merge(values)
      .transition()
      .duration(TRANSITION_MS)
      .ease(d3.easeLinear)
      .attr('x', d => margin.left + x(d.cleanShare) + 6)
      .attr('y', (_, i) => y(i)! + y.bandwidth() / 2 + 4)
      .text(d => `${d.cleanShare.toFixed(1)}%`)

    values.exit()
      .transition()
      .duration(TRANSITION_MS / 2)
      .attr('opacity', 0)
      .remove()
  }, [currentYear, years, getTopN, isMobile])

  // Animation runs entirely through refs — no useEffect timer, no stale closures
  const yearIdxRef = useRef(0)
  const animRunning = useRef(false)

  const stopAnimation = useCallback(() => {
    animRunning.current = false
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const startAnimation = useCallback(() => {
    animRunning.current = true

    const step = () => {
      if (!animRunning.current) return
      const nextIdx = yearIdxRef.current + 1
      if (nextIdx >= years.length) {
        animRunning.current = false
        setIsPlaying(false)
        return
      }
      yearIdxRef.current = nextIdx
      setCurrentYearIdx(nextIdx)
      timerRef.current = setTimeout(step, TRANSITION_MS + 100)
    }

    timerRef.current = setTimeout(step, TRANSITION_MS + 100)
  }, [years.length])

  // Cleanup on unmount only
  useEffect(() => {
    return () => stopAnimation()
  }, [stopAnimation])

  const handlePlayPause = () => {
    if (isPlaying) {
      stopAnimation()
      setIsPlaying(false)
    } else {
      if (currentYearIdx >= years.length - 1) {
        setCurrentYearIdx(0)
        yearIdxRef.current = 0
      } else {
        yearIdxRef.current = currentYearIdx
      }
      setIsPlaying(true)
      startAnimation()
    }
  }

  const margin = isMobile ? MOBILE_MARGIN : MARGIN
  const height = margin.top + TOP_N * BAR_HEIGHT + margin.bottom

  return (
    <div className="w-full">
      {/* Controls */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={handlePlayPause}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-body text-sm font-medium transition-all duration-150"
          style={{
            background: 'var(--accent-green-dim)',
            color: 'var(--accent-green)',
          }}
        >
          {isPlaying ? (
            <>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><rect x="2" y="1" width="4" height="12" rx="1" /><rect x="8" y="1" width="4" height="12" rx="1" /></svg>
              Pause
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path d="M3 1.5v11l9-5.5z" /></svg>
              {currentYearIdx >= years.length - 1 ? 'Replay' : 'Play'}
            </>
          )}
        </button>

        {/* Year slider */}
        <input
          type="range"
          min={0}
          max={years.length - 1}
          value={currentYearIdx}
          onChange={(e) => {
            stopAnimation()
            setIsPlaying(false)
            const idx = parseInt(e.target.value)
            yearIdxRef.current = idx
            setCurrentYearIdx(idx)
          }}
          className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, var(--accent-green) ${(currentYearIdx / (years.length - 1)) * 100}%, var(--border-default) ${(currentYearIdx / (years.length - 1)) * 100}%)`,
            accentColor: 'var(--accent-green)',
          }}
          aria-label={`Year: ${currentYear}`}
        />

        <span
          className="text-sm font-body tabular-nums font-semibold min-w-[3rem] text-right"
          style={{ color: 'var(--accent-green)' }}
        >
          {currentYear}
        </span>
      </div>

      {/* Chart */}
      <div ref={containerRef} className="w-full overflow-hidden">
        <svg
          ref={svgRef}
          style={{ width: '100%', height }}
          aria-label={`Bar chart race showing top ${TOP_N} countries by clean energy share in ${currentYear}`}
        />
      </div>
    </div>
  )
}
