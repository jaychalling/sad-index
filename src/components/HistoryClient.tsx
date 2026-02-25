'use client'

import { useState } from 'react'
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts'
import type { BsiDataPoint, HistoricalEvent } from '@/data/bsi-data'
import type { EconTimeSeries } from '@/lib/queries'

const eventDescriptions: Record<string, string> = {
  '2001-11-01': 'Charts turned euphoric as escapism — people craved upbeat pop after 9/11.',
  '2008-09-15': 'Recession Pop begins — dance music dominates as economy crashes.',
  '2008-10-01': 'Lady Gaga, Kesha, T-Pain — BSI hits all-time low as escapism peaks.',
  '2020-03-11': 'Rare genuine sadness spike — The Weeknd, isolation ballads.',
  '2020-04-01': 'Peak COVID sadness — lockdown isolation drives the darkest charts in decades.',
  '2021-03-01': 'Euphoric rebound — Olivia Rodrigo, Dua Lipa lead the charge.',
  '2024-08-01': 'Charli XCX & Sabrina Carpenter define the summer sound.',
}

const eventLabelsShort: Record<string, string> = {
  '2001-09-11': '9/11',
  '2008-09-15': 'Lehman',
  '2009-06-01': 'Recession Pop',
  '2020-03-11': 'COVID',
  '2021-03-01': 'Vaccines',
  '2024-08-01': 'Brat Summer',
}

function getBsiColor(bsi: number): string {
  if (bsi <= 20) return '#22c55e'
  if (bsi <= 40) return '#4ade80'
  if (bsi <= 60) return '#ffb703'
  if (bsi <= 80) return '#f87171'
  return '#ef4444'
}

function getMoodLabel(bsi: number): string {
  if (bsi < 30) return 'Happy'
  if (bsi < 50) return 'Mixed'
  return 'Sad'
}

interface HistoryClientProps {
  bsiData: BsiDataPoint[]
  historicalEvents: HistoricalEvent[]
  umcsentData: EconTimeSeries[]
}

type ChartView = 'bsi' | 'bsi-vs-sentiment'

export default function HistoryClient({ bsiData, historicalEvents, umcsentData }: HistoryClientProps) {
  const [chartView, setChartView] = useState<ChartView>('bsi')

  // Merge BSI + UMCSENT data by month for comparison chart
  const mergedData = (() => {
    if (umcsentData.length === 0) return []
    // Index UMCSENT by YYYY-MM
    const umcMap = new Map<string, number>()
    for (const d of umcsentData) umcMap.set(d.date.slice(0, 7), d.value)

    // Sample BSI monthly (first entry per month)
    const monthlyBsi = new Map<string, number>()
    for (const d of bsiData) {
      const ym = d.date.slice(0, 7)
      if (!monthlyBsi.has(ym)) monthlyBsi.set(ym, d.bsi)
    }

    const months = Array.from(monthlyBsi.keys()).sort()
    return months.map(ym => {
      const bsi = monthlyBsi.get(ym) ?? 0
      // Find closest UMCSENT (same month or previous)
      let umcsent = umcMap.get(ym)
      if (umcsent == null) {
        // Try previous months
        for (let i = 1; i <= 3; i++) {
          const [y, m] = ym.split('-').map(Number)
          const prevDate = new Date(y, m - 1 - i, 1)
          const prevYM = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`
          umcsent = umcMap.get(prevYM)
          if (umcsent != null) break
        }
      }
      return {
        date: `${ym}-01`,
        bsi,
        umcsent: umcsent ?? null,
        // Invert BSI for correlation view (high sentiment = low sadness)
        bsiInverted: 100 - bsi,
      }
    }).filter(d => d.umcsent != null)
  })()

  return (
    <>
      {/* Chart Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setChartView('bsi')}
          className={`btn-brutal text-sm ${chartView === 'bsi' ? 'bg-teal text-white' : 'bg-white text-navy'}`}
        >
          BSI Timeline
        </button>
        <button
          onClick={() => setChartView('bsi-vs-sentiment')}
          className={`btn-brutal text-sm ${chartView === 'bsi-vs-sentiment' ? 'bg-teal text-white' : 'bg-white text-navy'}`}
        >
          BSI vs Consumer Sentiment
        </button>
      </div>

      {/* Main BSI Chart */}
      {chartView === 'bsi' && (
        <div className="card-brutal mb-12 p-4 md:p-8">
          <h2 className="text-xl font-bold text-navy mb-6" style={{ fontFamily: 'var(--font-poppins)' }}>
            Billboard Sadness Index Over Time
          </h2>
          <div className="w-full h-[400px] md:h-[500px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={bsiData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                <defs>
                  <linearGradient id="bsiGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8ecae6" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#8ecae6" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#023047" opacity={0.1} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#023047' }}
                  tickFormatter={(v: string) => {
                    const year = v.slice(0, 4)
                    const month = v.slice(5, 7)
                    return month === '01' ? year : ''
                  }}
                  interval={51}
                />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#023047' }} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    return (
                      <div className="bg-white border-[3px] border-navy rounded-lg p-3 shadow-[4px_4px_0_#023047]">
                        <p className="font-semibold text-navy text-sm">{label}</p>
                        <p className="text-teal font-bold">BSI: {payload[0].value}</p>
                      </div>
                    )
                  }}
                />
                <Area type="monotone" dataKey="bsi" stroke="#219ebc" strokeWidth={2.5} fill="url(#bsiGradient)" />
                {historicalEvents.map((event) => (
                  <ReferenceLine
                    key={event.date}
                    x={bsiData.find(d => {
                      const eventYM = event.date.slice(0, 7)
                      const dataYM = d.date.slice(0, 7)
                      return eventYM === dataYM
                    })?.date}
                    stroke="#ef4444"
                    strokeDasharray="4 4"
                    strokeWidth={2}
                    label={{
                      value: eventLabelsShort[event.date] || event.label,
                      position: 'top',
                      fill: '#023047',
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-4 mt-4 text-xs text-navy/60">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-ocean border border-navy/20" /> BSI Value
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-6 h-0 border-t-2 border-dashed" style={{ borderColor: '#ef4444' }} /> Historical Event
            </span>
          </div>
        </div>
      )}

      {/* BSI vs Consumer Sentiment */}
      {chartView === 'bsi-vs-sentiment' && (
        <div className="card-brutal mb-12 p-4 md:p-8">
          <h2 className="text-xl font-bold text-navy mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
            BSI vs Consumer Sentiment (UMCSENT)
          </h2>
          <p className="text-sm text-navy/60 mb-6">
            When consumer confidence drops, do charts get brighter (escapism) or sadder?
            BSI is inverted (100 - BSI = &quot;Brightness&quot;) for easier comparison.
          </p>
          <div className="w-full h-[400px] md:h-[500px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mergedData} margin={{ top: 20, right: 60, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#023047" opacity={0.1} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#023047' }}
                  tickFormatter={(v: string) => v.slice(0, 4)}
                  interval={11}
                />
                <YAxis
                  yAxisId="bsi"
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: '#22c55e' }}
                  label={{ value: 'Chart Brightness', angle: -90, position: 'insideLeft', fill: '#22c55e', fontSize: 12 }}
                />
                <YAxis
                  yAxisId="umcsent"
                  orientation="right"
                  domain={[40, 120]}
                  tick={{ fontSize: 11, fill: '#f59e0b' }}
                  label={{ value: 'Consumer Sentiment', angle: 90, position: 'insideRight', fill: '#f59e0b', fontSize: 12 }}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    return (
                      <div className="bg-white border-[3px] border-navy rounded-lg p-3 shadow-[4px_4px_0_#023047]">
                        <p className="font-semibold text-navy text-sm">{label}</p>
                        {payload.map((p, i) => (
                          <p key={i} style={{ color: p.color }} className="font-bold text-sm">
                            {p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
                          </p>
                        ))}
                      </div>
                    )
                  }}
                />
                <Legend />
                <Line
                  yAxisId="bsi"
                  type="monotone"
                  dataKey="bsiInverted"
                  name="Chart Brightness (100-BSI)"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  yAxisId="umcsent"
                  type="monotone"
                  dataKey="umcsent"
                  name="Consumer Sentiment"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 p-4 bg-amber/10 rounded-lg border-2 border-amber/30">
            <p className="text-sm text-navy/80">
              <strong>Escapism Hypothesis:</strong> When consumer sentiment drops (economic fear),
              chart brightness often increases — people seek upbeat music as escapism.
              The 2008 financial crisis and 2020 COVID lockdowns are notable examples.
            </p>
          </div>
        </div>
      )}

      {/* Notable Events Timeline */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-navy mb-8" style={{ fontFamily: 'var(--font-poppins)' }}>
          Notable Events
        </h2>
        <div className="relative">
          <div className="hidden md:block absolute left-8 top-0 bottom-0 w-[3px] bg-navy/15 rounded-full" />
          <div className="space-y-6">
            {historicalEvents.map((event, i) => {
              const description = eventDescriptions[event.date] || ''
              const year = event.date.slice(0, 4)
              const month = new Date(event.date).toLocaleString('en-US', { month: 'short' })
              const bsiVal = event.bsi ?? 0
              const bsiColor = getBsiColor(bsiVal)
              return (
                <div key={event.date} className="flex gap-4 md:gap-8 items-start">
                  <div className="hidden md:flex flex-col items-center flex-shrink-0 w-16">
                    <div className="w-5 h-5 rounded-full border-[3px] border-navy z-10" style={{ backgroundColor: bsiColor }} />
                  </div>
                  <div className="flex-1 bg-white rounded-lg p-5 md:p-6 border-[3px] border-navy" style={{ boxShadow: i % 2 === 0 ? '4px 4px 0 #023047' : '4px 4px 0 #219ebc' }}>
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                      <div>
                        <span className="tag-brutal bg-ocean/30 text-navy text-xs mr-2">{month} {year}</span>
                        <h3 className="inline text-lg font-bold text-navy" style={{ fontFamily: 'var(--font-poppins)' }}>{event.label}</h3>
                      </div>
                      <div className="tag-brutal font-bold text-sm" style={{ backgroundColor: bsiColor + '30', color: bsiColor }}>{getMoodLabel(bsiVal)} · BSI {bsiVal}</div>
                    </div>
                    <p className="text-navy/70 leading-relaxed text-sm md:text-base">{description}</p>
                    <div className="mt-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold w-11 text-right" style={{ color: '#22c55e' }}>Happy</span>
                        <div className="flex-1 relative h-3 bg-navy/5 rounded-full border border-navy/15 overflow-hidden">
                          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-navy/25 z-10" />
                          {bsiVal <= 50 ? (
                            <div
                              className="absolute top-0 bottom-0 rounded-l-full"
                              style={{
                                right: '50%',
                                width: `${((50 - bsiVal) / 50) * 50}%`,
                                backgroundColor: '#22c55e',
                              }}
                            />
                          ) : (
                            <div
                              className="absolute top-0 bottom-0 rounded-r-full"
                              style={{
                                left: '50%',
                                width: `${((bsiVal - 50) / 50) * 50}%`,
                                backgroundColor: '#ef4444',
                              }}
                            />
                          )}
                        </div>
                        <span className="text-[11px] font-bold w-7" style={{ color: '#ef4444' }}>Sad</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Key Insight Box */}
      <div className="card-brutal bg-amber/10 border-amber mb-4" style={{ borderColor: '#ffb703', boxShadow: '4px 4px 0 #fb8500' }}>
        <h3 className="font-bold text-navy text-lg mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
          Key Insight: The Escapism Pattern
        </h3>
        <p className="text-navy/80 leading-relaxed">
          Notice how the BSI drops (charts get brighter) during recessions?
          When times get hard, people don&apos;t wallow — they seek musical escapism.
          The 2008 financial crisis gave us Gaga and Kesha.
          COVID was the rare exception where genuine sadness briefly dominated the charts.
        </p>
      </div>
    </>
  )
}
