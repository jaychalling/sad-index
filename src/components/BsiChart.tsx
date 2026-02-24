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
  Legend,
} from 'recharts'

type BsiWeekly = { date: string; bsi: number; avgValence: number }
type Sp500Data = { date: string; value: number }

interface BsiChartProps {
  bsiData: BsiWeekly[]
  sp500Data: Sp500Data[]
}

const periods = [
  { label: '1Y', months: 12 },
  { label: '5Y', months: 60 },
  { label: '10Y', months: 120 },
  { label: 'ALL', months: 0 },
]

function monthsAgo(months: number): Date {
  const d = new Date()
  d.setMonth(d.getMonth() - months)
  return d
}

interface TooltipPayloadItem {
  name: string
  value: number
  color: string
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadItem[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border-[2px] border-navy rounded-lg p-3 shadow-[2px_2px_0_#023047] text-sm">
      <p className="font-bold text-navy mb-1">{label}</p>
      {payload.map((entry: TooltipPayloadItem) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: <span className="font-semibold">{entry.value?.toLocaleString()}</span>
        </p>
      ))}
    </div>
  )
}

export default function BsiChart({ bsiData, sp500Data }: BsiChartProps) {
  const [activePeriod, setActivePeriod] = useState('ALL')

  const mergedData = useMemo(() => {
    const sp500Map = new Map(sp500Data.map((d) => [d.date, d.value]))

    let filtered = bsiData
    const period = periods.find((p) => p.label === activePeriod)
    if (period && period.months > 0) {
      const cutoff = monthsAgo(period.months)
      filtered = bsiData.filter((d) => new Date(d.date) >= cutoff)
    }

    return filtered.map((d) => ({
      date: d.date,
      bsi: d.bsi,
      sp500: sp500Map.get(d.date) ?? null,
    }))
  }, [bsiData, sp500Data, activePeriod])

  return (
    <div className="card-brutal">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h2 className="text-xl font-bold text-navy" style={{ fontFamily: 'var(--font-poppins)' }}>
          BSI vs S&P 500
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

      <div className="w-full h-[350px] sm:h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={mergedData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#023047" opacity={0.1} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#023047' }}
              tickFormatter={(val: string) => {
                const d = new Date(val)
                return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
              }}
              minTickGap={40}
            />
            <YAxis
              yAxisId="bsi"
              orientation="left"
              reversed
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: '#219ebc' }}
              label={{ value: 'BSI', angle: -90, position: 'insideLeft', fill: '#219ebc', fontSize: 12 }}
            />
            <YAxis
              yAxisId="sp500"
              orientation="right"
              tick={{ fontSize: 11, fill: '#fb8500' }}
              label={{ value: 'S&P 500', angle: 90, position: 'insideRight', fill: '#fb8500', fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area
              yAxisId="bsi"
              type="monotone"
              dataKey="bsi"
              name="BSI"
              stroke="#219ebc"
              fill="#8ecae6"
              fillOpacity={0.2}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#219ebc', stroke: '#023047', strokeWidth: 2 }}
            />
            <Line
              yAxisId="sp500"
              type="monotone"
              dataKey="sp500"
              name="S&P 500"
              stroke="#fb8500"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#fb8500', stroke: '#023047', strokeWidth: 2 }}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <p className="text-xs text-navy/50 mt-3 text-center">
        BSI axis is inverted: lower values (top) = happier charts. Data updated weekly.
      </p>
    </div>
  )
}
