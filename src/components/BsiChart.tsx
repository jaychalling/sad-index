'use client'

import { useState, useMemo } from 'react'
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import type { EconTimeSeries } from '@/lib/queries'
import type { IndicatorKey } from './EconDashboard'
import { indicatorDbKey } from './EconDashboard'

type BsiWeekly = { date: string; bsi: number; avgValence: number }

interface BsiChartProps {
  bsiData: BsiWeekly[]
  econData: Record<string, EconTimeSeries[]>
  activeIndicator: IndicatorKey
}

const periods = [
  { label: '1Y', months: 12 },
  { label: '5Y', months: 60 },
  { label: '10Y', months: 120 },
  { label: 'ALL', months: 0 },
]

const indicatorConfig: Record<IndicatorKey, {
  label: string
  color: string
  domainMin?: number
  domainMax?: number
}> = {
  sp500: { label: 'S&P 500', color: '#e63946' },
  vix: { label: 'VIX (Fear Index)', color: '#e63946' },
  unemployment: { label: 'Unemployment %', color: '#e63946', domainMin: 0, domainMax: 15 },
  consumerSentiment: { label: 'Consumer Sentiment', color: '#e63946', domainMin: 40, domainMax: 120 },
}

function monthsAgo(months: number): Date {
  const d = new Date()
  d.setMonth(d.getMonth() - months)
  return d
}

interface TooltipPayloadItem {
  name: string
  value: number
  color: string
  dataKey: string
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadItem[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border-[2px] border-navy rounded-lg p-3 shadow-[2px_2px_0_#023047] text-sm min-w-[160px]">
      <p className="font-bold text-navy mb-2 text-xs border-b border-navy/10 pb-1">{label}</p>
      {payload.map((entry: TooltipPayloadItem) => (
        <div key={entry.name} className="flex items-center gap-2 py-0.5">
          <span
            className="w-3 h-3 rounded-sm flex-shrink-0"
            style={{
              backgroundColor: entry.dataKey === 'bsi' ? '#219ebc' : entry.color,
              opacity: entry.dataKey === 'bsi' ? 0.6 : 1,
              border: `2px solid ${entry.dataKey === 'bsi' ? '#0a6e8a' : entry.color}`,
            }}
          />
          <span className="text-navy/70">{entry.name}:</span>
          <span className="font-bold ml-auto" style={{ color: entry.dataKey === 'bsi' ? '#0a6e8a' : entry.color }}>
            {typeof entry.value === 'number' ? entry.value.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '—'}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function BsiChart({ bsiData, econData, activeIndicator }: BsiChartProps) {
  const [activePeriod, setActivePeriod] = useState('1Y')
  const config = indicatorConfig[activeIndicator]
  const dbKey = indicatorDbKey[activeIndicator]

  const mergedData = useMemo(() => {
    const indicatorSeries = econData[dbKey] ?? []
    const econMap = new Map<string, number>()
    for (const d of indicatorSeries) econMap.set(d.date.slice(0, 7), d.value)

    const period = periods.find((p) => p.label === activePeriod)
    const cutoff = period && period.months > 0 ? monthsAgo(period.months) : null

    const filtered = cutoff
      ? bsiData.filter((d) => new Date(d.date) >= cutoff)
      : bsiData

    // Sample monthly for cleaner chart
    const seen = new Set<string>()
    return filtered
      .filter(d => {
        const ym = d.date.slice(0, 7)
        if (seen.has(ym)) return false
        seen.add(ym)
        return true
      })
      .map((d) => {
        const ym = d.date.slice(0, 7)
        let econVal: number | null = econMap.get(ym) ?? null
        if (econVal == null) {
          for (let i = 1; i <= 3; i++) {
            const dt = new Date(d.date)
            dt.setMonth(dt.getMonth() - i)
            const prevYM = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
            econVal = econMap.get(prevYM) ?? null
            if (econVal != null) break
          }
        }
        return {
          date: d.date,
          bsi: Math.round(d.bsi * 10) / 10,
          indicator: econVal,
        }
      })
  }, [bsiData, econData, dbKey, activePeriod])

  // Auto domain for indicators without fixed range
  const econDomain: [number | string, number | string] = config.domainMin != null
    ? [config.domainMin, config.domainMax!]
    : ['auto', 'auto']

  return (
    <div className="card-brutal">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h2 className="text-xl font-bold text-navy" style={{ fontFamily: 'var(--font-poppins)' }}>
          BSI vs {config.label}
        </h2>
        <div className="flex gap-2">
          {periods.map((p) => (
            <button
              key={p.label}
              onClick={() => setActivePeriod(p.label)}
              className={`btn-brutal text-xs px-3 py-1.5 ${
                activePeriod === p.label
                  ? 'bg-teal text-white'
                  : 'bg-white text-navy hover:bg-ocean/30'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mb-4 px-1">
        <div className="flex items-center gap-2">
          <span className="w-5 h-3 rounded-sm" style={{ backgroundColor: '#8ecae6', border: '2px solid #0a6e8a' }} />
          <span className="text-xs font-semibold text-navy/70">BSI (Sadness)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-5 h-[3px] rounded-full" style={{ backgroundColor: config.color }} />
          <span className="text-xs font-semibold" style={{ color: config.color }}>{config.label}</span>
        </div>
      </div>

      <div className="w-full h-[320px] sm:h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={mergedData} margin={{ top: 5, right: 5, left: -5, bottom: 5 }}>
            <defs>
              <linearGradient id="bsiAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#219ebc" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#8ecae6" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#023047" opacity={0.08} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#023047' }}
              tickFormatter={(val: string) => {
                const year = val.slice(2, 4)
                const month = new Date(val).toLocaleDateString('en-US', { month: 'short' })
                return activePeriod === 'ALL' ? `'${year}` : `${month} '${year}`
              }}
              minTickGap={50}
              axisLine={{ stroke: '#023047', strokeWidth: 1, opacity: 0.2 }}
              tickLine={false}
            />
            <YAxis
              yAxisId="bsi"
              orientation="left"
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: '#0a6e8a' }}
              tickLine={false}
              axisLine={false}
              width={28}
            />
            <YAxis
              yAxisId="econ"
              orientation="right"
              domain={econDomain}
              tick={{ fontSize: 10, fill: config.color }}
              tickLine={false}
              axisLine={false}
              width={30}
            />
            <Tooltip content={<CustomTooltip />} />
            {/* BSI as filled area — soft background layer */}
            <Area
              yAxisId="bsi"
              type="monotone"
              dataKey="bsi"
              name="BSI"
              stroke="#219ebc"
              fill="url(#bsiAreaGrad)"
              strokeWidth={1.2}
              strokeOpacity={0.7}
              dot={false}
              activeDot={{ r: 4, fill: '#219ebc', stroke: '#fff', strokeWidth: 2 }}
            />
            {/* Economic indicator — thin semi-transparent line */}
            <Line
              yAxisId="econ"
              type="monotone"
              dataKey="indicator"
              name={config.label}
              stroke={config.color}
              strokeWidth={1.5}
              strokeOpacity={0.65}
              dot={false}
              activeDot={{ r: 4, fill: config.color, stroke: '#fff', strokeWidth: 2 }}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <p className="text-xs text-navy/40 mt-3 text-center">
        Click an Economic Pulse card to switch indicator
      </p>
    </div>
  )
}
