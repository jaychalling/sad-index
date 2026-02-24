'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import type { Track, CurrentWeek } from '@/data/bsi-data'

function getMoodTag(valence: number): { label: string; color: string; bg: string } {
  if (valence > 0.7) return { label: 'Happy', color: '#166534', bg: '#dcfce7' }
  if (valence >= 0.4) return { label: 'Neutral', color: '#92400e', bg: '#fef3c7' }
  return { label: 'Sad', color: '#9a3412', bg: '#ffedd5' }
}

function getBarColor(valence: number): string {
  if (valence > 0.7) return '#219ebc'
  if (valence >= 0.4) return '#ffb703'
  return '#fb8500'
}

function getBsiLabel(bsi: number): { label: string; color: string } {
  if (bsi <= 20) return { label: 'Euphoric', color: '#22c55e' }
  if (bsi <= 40) return { label: 'Bright', color: '#8ecae6' }
  if (bsi <= 60) return { label: 'Neutral', color: '#ffb703' }
  if (bsi <= 80) return { label: 'Moody', color: '#fb8500' }
  return { label: 'Dark', color: '#ef4444' }
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ payload: { name: string; artist: string; valence: number } }>
}

function CustomBarTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border-[3px] border-navy rounded-lg p-3 shadow-[4px_4px_0_#023047]">
      <p className="font-bold text-navy text-sm">{d.name}</p>
      <p className="text-navy/60 text-xs">{d.artist}</p>
      <p className="text-teal font-bold mt-1">Valence: {d.valence.toFixed(2)}</p>
    </div>
  )
}

interface ThisWeekClientProps {
  currentWeekData: CurrentWeek
  tracks: Track[]
}

export default function ThisWeekClient({ currentWeekData, tracks }: ThisWeekClientProps) {
  const { bsi, prevBsi, weeklyChange, weekDate } = currentWeekData
  const bsiInfo = getBsiLabel(bsi)
  const changeSign = weeklyChange > 0 ? '+' : ''

  const sortedTracks = [...tracks].sort((a, b) => b.valence - a.valence)
  const chartData = sortedTracks.map((t) => ({
    name: `#${t.rank} ${t.title}`,
    artist: t.artist,
    valence: t.valence,
    rank: t.rank,
  }))

  const allValences = tracks.map((t) => t.valence)
  const avgValence = allValences.reduce((a, b) => a + b, 0) / allValences.length
  const sortedValences = [...allValences].sort((a, b) => a - b)
  const medianValence =
    sortedValences.length % 2 === 0
      ? (sortedValences[sortedValences.length / 2 - 1] + sortedValences[sortedValences.length / 2]) / 2
      : sortedValences[Math.floor(sortedValences.length / 2)]

  const moodCounts = { Happy: 0, Neutral: 0, Sad: 0 }
  tracks.forEach((t) => {
    const mood = getMoodTag(t.valence)
    moodCounts[mood.label as keyof typeof moodCounts]++
  })
  const mostCommonMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]

  return (
    <>
      {/* Page Title */}
      <div className="mb-10">
        <h1
          className="text-3xl md:text-4xl font-bold text-navy mb-2"
          style={{ fontFamily: 'var(--font-poppins)' }}
        >
          This Week
        </h1>
        <p className="text-teal font-medium text-lg">
          {new Date(weekDate).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
      </div>

      {/* BSI Score Card */}
      <div className="card-brutal mb-10 flex flex-col md:flex-row items-center gap-8 p-6 md:p-8">
        <div className="flex-shrink-0 text-center">
          <div
            className="w-36 h-36 md:w-44 md:h-44 rounded-full border-[4px] border-navy flex items-center justify-center relative"
            style={{
              background: `conic-gradient(${bsiInfo.color} ${bsi * 3.6}deg, #f0f0f0 ${bsi * 3.6}deg)`,
              boxShadow: '4px 4px 0 #023047',
            }}
          >
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-white border-[3px] border-navy flex flex-col items-center justify-center">
              <span className="text-4xl md:text-5xl font-bold text-navy" style={{ fontFamily: 'var(--font-poppins)' }}>
                {bsi}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: bsiInfo.color }}>
                {bsiInfo.label}
              </span>
            </div>
          </div>
        </div>
        <div className="flex-1 text-center md:text-left">
          <h2
            className="text-2xl font-bold text-navy mb-3"
            style={{ fontFamily: 'var(--font-poppins)' }}
          >
            Weekly BSI Score
          </h2>
          <div className="flex flex-wrap gap-3 justify-center md:justify-start">
            <span className="tag-brutal bg-ocean/20 text-navy">
              Previous: {prevBsi}
            </span>
            <span
              className="tag-brutal font-bold"
              style={{
                backgroundColor: weeklyChange > 0 ? '#ffedd5' : '#dcfce7',
                color: weeklyChange > 0 ? '#9a3412' : '#166534',
              }}
            >
              {changeSign}{weeklyChange.toFixed(2)} pts
            </span>
            <span className="tag-brutal bg-amber/20 text-navy">
              Avg Valence: {currentWeekData.avgValence.toFixed(3)}
            </span>
          </div>
          <p className="text-navy/60 mt-4 text-sm leading-relaxed">
            The chart mood is <strong>{bsiInfo.label.toLowerCase()}</strong> this week.
            {weeklyChange > 0
              ? ' Songs have shifted slightly sadder compared to last week.'
              : ' Songs have shifted slightly brighter compared to last week.'}
          </p>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="card-brutal mb-10 p-4 md:p-8">
        <h2
          className="text-xl font-bold text-navy mb-6"
          style={{ fontFamily: 'var(--font-poppins)' }}
        >
          Top 20 Tracks by Valence
        </h2>
        <div className="w-full h-[600px] md:h-[700px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 30, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#023047" opacity={0.1} horizontal={false} />
              <XAxis type="number" domain={[0, 1]} tick={{ fontSize: 11, fill: '#023047' }} tickFormatter={(v: number) => v.toFixed(1)} />
              <YAxis type="category" dataKey="name" width={200} tick={{ fontSize: 11, fill: '#023047' }} />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar dataKey="valence" radius={[0, 6, 6, 0]} barSize={22}>
                {chartData.map((entry, idx) => (
                  <Cell key={idx} fill={getBarColor(entry.valence)} stroke="#023047" strokeWidth={1.5} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap gap-4 mt-4 text-xs text-navy/60">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-teal border border-navy/20" /> Happy (&gt;0.7)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-amber border border-navy/20" /> Neutral (0.4–0.7)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-orange border border-navy/20" /> Sad (&lt;0.4)
          </span>
        </div>
      </div>

      {/* Full Track Table */}
      <div className="card-brutal mb-10 p-4 md:p-8 overflow-x-auto">
        <h2 className="text-xl font-bold text-navy mb-6" style={{ fontFamily: 'var(--font-poppins)' }}>
          Full Chart Breakdown
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-[3px] border-navy">
              <th className="text-left py-3 px-2 font-bold text-navy">Rank</th>
              <th className="text-left py-3 px-2 font-bold text-navy">Title</th>
              <th className="text-left py-3 px-2 font-bold text-navy hidden md:table-cell">Artist</th>
              <th className="text-left py-3 px-2 font-bold text-navy">Valence</th>
              <th className="text-left py-3 px-2 font-bold text-navy">Mood</th>
            </tr>
          </thead>
          <tbody>
            {tracks.map((track, i) => {
              const mood = getMoodTag(track.valence)
              return (
                <tr key={track.rank} className={`border-b-2 border-navy/10 ${i % 2 === 0 ? 'bg-ocean/5' : 'bg-white'}`}>
                  <td className="py-3 px-2 font-bold text-navy">#{track.rank}</td>
                  <td className="py-3 px-2">
                    <div className="font-semibold text-navy">{track.title}</div>
                    <div className="text-navy/50 text-xs md:hidden">{track.artist}</div>
                  </td>
                  <td className="py-3 px-2 text-navy/70 hidden md:table-cell">{track.artist}</td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <div className="w-16 md:w-24 h-3 bg-navy/10 rounded-full overflow-hidden border border-navy/20">
                        <div className="h-full rounded-full" style={{ width: `${track.valence * 100}%`, backgroundColor: getBarColor(track.valence) }} />
                      </div>
                      <span className="text-navy font-mono text-xs">{track.valence.toFixed(2)}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <span className="inline-block px-2.5 py-1 text-xs font-bold rounded-md border-2 border-navy" style={{ backgroundColor: mood.bg, color: mood.color }}>
                      {mood.label}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="card-brutal text-center p-6">
          <p className="text-sm font-semibold text-navy/50 uppercase tracking-wider mb-2">Average Valence</p>
          <p className="text-3xl font-bold text-teal" style={{ fontFamily: 'var(--font-poppins)' }}>{avgValence.toFixed(3)}</p>
        </div>
        <div className="card-brutal text-center p-6">
          <p className="text-sm font-semibold text-navy/50 uppercase tracking-wider mb-2">Median Valence</p>
          <p className="text-3xl font-bold text-teal" style={{ fontFamily: 'var(--font-poppins)' }}>{medianValence.toFixed(3)}</p>
        </div>
        <div className="card-brutal text-center p-6">
          <p className="text-sm font-semibold text-navy/50 uppercase tracking-wider mb-2">Most Common Mood</p>
          <p className="text-3xl font-bold" style={{ fontFamily: 'var(--font-poppins)', color: getMoodTag(mostCommonMood[0] === 'Happy' ? 0.8 : mostCommonMood[0] === 'Neutral' ? 0.5 : 0.2).color }}>
            {mostCommonMood[0]}
          </p>
          <p className="text-sm text-navy/50 mt-1">{mostCommonMood[1]} of {tracks.length} tracks</p>
        </div>
      </div>
    </>
  )
}
