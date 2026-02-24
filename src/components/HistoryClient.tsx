'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import type { BsiDataPoint, HistoricalEvent } from '@/data/bsi-data'

const eventDescriptions: Record<string, string> = {
  '2001-09-15': 'Charts turned euphoric as escapism — people craved upbeat pop.',
  '2008-09-15': 'Recession Pop begins — dance music dominates as economy crashes.',
  '2009-01-10': 'Lady Gaga & Kesha dominate — peak musical escapism.',
  '2020-03-15': 'Rare genuine sadness spike — The Weeknd, isolation ballads.',
  '2021-01-10': 'Euphoric rebound — Olivia Rodrigo, Dua Lipa lead the charge.',
  '2024-06-15': 'Charli XCX & Sabrina Carpenter define the summer sound.',
}

const eventLabelsShort: Record<string, string> = {
  '2001-09-15': '9/11',
  '2008-09-15': 'Lehman',
  '2009-01-10': 'Gaga Era',
  '2020-03-15': 'COVID',
  '2021-01-10': 'Vaccines',
  '2024-06-15': 'Brat Summer',
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border-[3px] border-navy rounded-lg p-3 shadow-[4px_4px_0_#023047]">
      <p className="font-semibold text-navy text-sm">{label}</p>
      <p className="text-teal font-bold">BSI: {payload[0].value}</p>
    </div>
  )
}

function getBsiColor(bsi: number): string {
  if (bsi <= 20) return '#22c55e'
  if (bsi <= 40) return '#8ecae6'
  if (bsi <= 60) return '#ffb703'
  if (bsi <= 80) return '#fb8500'
  return '#ef4444'
}

interface HistoryClientProps {
  bsiData: BsiDataPoint[]
  historicalEvents: HistoricalEvent[]
}

export default function HistoryClient({ bsiData, historicalEvents }: HistoryClientProps) {
  return (
    <>
      {/* Main Chart */}
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
                interval={11}
              />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#023047' }} tickFormatter={(v: number) => `${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="bsi" stroke="#219ebc" strokeWidth={2.5} fill="url(#bsiGradient)" />
              {historicalEvents.map((event) => (
                <ReferenceLine
                  key={event.date}
                  x={bsiData.find(d => {
                    const eventYM = event.date.slice(0, 7)
                    const dataYM = d.date.slice(0, 7)
                    return eventYM === dataYM
                  })?.date}
                  stroke="#fb8500"
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
            <span className="w-6 h-0 border-t-2 border-dashed border-orange" /> Historical Event
          </span>
        </div>
      </div>

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
              const bsiColor = getBsiColor(event.bsi)
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
                      <div className="tag-brutal font-bold text-sm" style={{ backgroundColor: bsiColor + '30', color: '#023047' }}>BSI {event.bsi}</div>
                    </div>
                    <p className="text-navy/70 leading-relaxed text-sm md:text-base">{description}</p>
                    <div className="mt-4 flex items-center gap-3">
                      <div className="flex-1 h-3 bg-navy/10 rounded-full overflow-hidden border border-navy/20">
                        <div className="h-full rounded-full transition-all" style={{ width: `${event.bsi}%`, backgroundColor: bsiColor }} />
                      </div>
                      <span className="text-xs font-semibold text-navy/60 w-10 text-right">{event.bsi}/100</span>
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
