'use client'

import { useState, useMemo } from 'react'
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import type { EconTimeSeries } from '@/lib/queries'
import { vixToFear, umcsentToGloom, unrateToAnxiety, calcNMS, indexColors, indexLabels } from '@/lib/mood-indices'

type BsiWeekly = { date: string; bsi: number; avgValence: number }

interface MoodChartProps {
  bsiData: BsiWeekly[]
  econData: Record<string, EconTimeSeries[]>
}

type IndexKey = 'bsi' | 'fear' | 'gloom' | 'anxiety' | 'nms'

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
  dataKey: string
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadItem[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border-[2px] border-navy rounded-lg p-3 shadow-[2px_2px_0_#023047] text-sm min-w-[180px]">
      <p className="font-bold text-navy mb-2 text-xs border-b border-navy/10 pb-1">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2 py-0.5">
          <span
            className="w-3 h-3 rounded-sm flex-shrink-0"
            style={{ backgroundColor: entry.color, border: `1px solid ${entry.color}` }}
          />
          <span className="text-navy/70 text-xs">{entry.name}:</span>
          <span className="font-bold ml-auto text-xs" style={{ color: entry.color }}>
            {typeof entry.value === 'number' ? entry.value.toFixed(1) : '—'}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function MoodChart({ bsiData, econData }: MoodChartProps) {
  const [activePeriod, setActivePeriod] = useState('1Y')
  const [visible, setVisible] = useState<Record<IndexKey, boolean>>({
    bsi: true, fear: true, gloom: true, anxiety: true, nms: false,
  })

  function toggle(key: IndexKey) {
    setVisible(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const mergedData = useMemo(() => {
    const vixMap = new Map<string, number>()
    const umcMap = new Map<string, number>()
    const unrMap = new Map<string, number>()
    for (const d of econData['VIX'] ?? []) vixMap.set(d.date.slice(0, 7), d.value)
    for (const d of econData['UMCSENT'] ?? []) umcMap.set(d.date.slice(0, 7), d.value)
    for (const d of econData['UNRATE'] ?? []) unrMap.set(d.date.slice(0, 7), d.value)

    const period = periods.find(p => p.label === activePeriod)
    const cutoff = period && period.months > 0 ? monthsAgo(period.months) : null

    const filtered = cutoff
      ? bsiData.filter(d => new Date(d.date) >= cutoff)
      : bsiData

    const seen = new Set<string>()
    return filtered
      .filter(d => {
        const ym = d.date.slice(0, 7)
        if (seen.has(ym)) return false
        seen.add(ym)
        return true
      })
      .map(d => {
        const ym = d.date.slice(0, 7)
        const bsi = Math.round(d.bsi * 10) / 10

        // Find closest match (current month or up to 3 months back)
        function findClosest(map: Map<string, number>): number | null {
          let val = map.get(ym) ?? null
          if (val != null) return val
          for (let i = 1; i <= 3; i++) {
            const dt = new Date(d.date)
            dt.setMonth(dt.getMonth() - i)
            const prevYM = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
            val = map.get(prevYM) ?? null
            if (val != null) return val
          }
          return null
        }

        const vixRaw = findClosest(vixMap)
        const umcRaw = findClosest(umcMap)
        const unrRaw = findClosest(unrMap)

        const fear = vixRaw != null ? Math.round(vixToFear(vixRaw) * 10) / 10 : null
        const gloom = umcRaw != null ? Math.round(umcsentToGloom(umcRaw) * 10) / 10 : null
        const anxiety = unrRaw != null ? Math.round(unrateToAnxiety(unrRaw) * 10) / 10 : null
        const nms = fear != null && gloom != null && anxiety != null
          ? Math.round(calcNMS(bsi, fear, gloom, anxiety) * 10) / 10
          : null

        return { date: d.date, bsi, fear, gloom, anxiety, nms }
      })
  }, [bsiData, econData, activePeriod])

  const toggles: { key: IndexKey; label: string; color: string }[] = [
    { key: 'bsi', label: indexLabels.bsi, color: indexColors.bsi },
    { key: 'fear', label: indexLabels.fear, color: indexColors.fear },
    { key: 'gloom', label: indexLabels.gloom, color: indexColors.gloom },
    { key: 'anxiety', label: indexLabels.anxiety, color: indexColors.anxiety },
    { key: 'nms', label: indexLabels.nms, color: indexColors.nms },
  ]

  return (
    <div className="card-brutal">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h2 className="text-xl font-bold text-navy" style={{ fontFamily: 'var(--font-poppins)' }}>
          Mood Trends
        </h2>
        <div className="flex gap-2">
          {periods.map(p => (
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

      {/* Toggle buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {toggles.map(t => (
          <button
            key={t.key}
            onClick={() => toggle(t.key)}
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md border-2 transition-all ${
              visible[t.key]
                ? 'border-navy shadow-[2px_2px_0_#023047]'
                : 'border-navy/20 opacity-40'
            }`}
            style={visible[t.key] ? { backgroundColor: t.color + '20', color: t.color } : undefined}
          >
            <span
              className="w-3 h-3 rounded-sm"
              style={{
                backgroundColor: visible[t.key] ? t.color : '#ccc',
                border: `2px solid ${visible[t.key] ? t.color : '#ccc'}`,
              }}
            />
            {t.label}
          </button>
        ))}
      </div>

      <div className="w-full h-[320px] sm:h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={mergedData} margin={{ top: 5, right: 5, left: -5, bottom: 5 }}>
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
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: '#023047' }}
              tickLine={false}
              axisLine={false}
              width={28}
            />
            <Tooltip content={<CustomTooltip />} />

            {visible.bsi && (
              <Line type="monotone" dataKey="bsi" name={indexLabels.bsi} stroke={indexColors.bsi} strokeWidth={2} dot={false} activeDot={{ r: 4, fill: indexColors.bsi, stroke: '#fff', strokeWidth: 2 }} />
            )}
            {visible.fear && (
              <Line type="monotone" dataKey="fear" name={indexLabels.fear} stroke={indexColors.fear} strokeWidth={1.5} dot={false} activeDot={{ r: 4, fill: indexColors.fear, stroke: '#fff', strokeWidth: 2 }} connectNulls />
            )}
            {visible.gloom && (
              <Line type="monotone" dataKey="gloom" name={indexLabels.gloom} stroke={indexColors.gloom} strokeWidth={1.5} dot={false} activeDot={{ r: 4, fill: indexColors.gloom, stroke: '#fff', strokeWidth: 2 }} connectNulls />
            )}
            {visible.anxiety && (
              <Line type="monotone" dataKey="anxiety" name={indexLabels.anxiety} stroke={indexColors.anxiety} strokeWidth={1.5} dot={false} activeDot={{ r: 4, fill: indexColors.anxiety, stroke: '#fff', strokeWidth: 2 }} connectNulls />
            )}
            {visible.nms && (
              <Line type="monotone" dataKey="nms" name={indexLabels.nms} stroke={indexColors.nms} strokeWidth={2.5} strokeDasharray="6 3" dot={false} activeDot={{ r: 5, fill: indexColors.nms, stroke: '#fff', strokeWidth: 2 }} connectNulls />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[10px] text-navy/40 mt-3 text-center">
        All indices normalized to 0–100 (0 = bright, 100 = dark). Click labels to toggle.
      </p>
    </div>
  )
}
