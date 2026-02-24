'use client'

interface BsiGaugeProps {
  value: number
  prevValue: number
}

const segments = [
  { min: 0, max: 20, label: 'Euphoric', color: '#22c55e' },
  { min: 20, max: 40, label: 'Bright', color: '#8ecae6' },
  { min: 40, max: 60, label: 'Neutral', color: '#ffb703' },
  { min: 60, max: 80, label: 'Moody', color: '#fb8500' },
  { min: 80, max: 100, label: 'Dark', color: '#ef4444' },
]

function getSegment(value: number) {
  return segments.find((s) => value >= s.min && value < s.max) || segments[segments.length - 1]
}

function getInterpretation(value: number): string {
  if (value < 20) return 'Charts are unusually bright — historically a pre-recession signal'
  if (value < 40) return 'Upbeat mood dominates the charts — people are vibing'
  if (value < 60) return 'A balanced emotional mix on the charts — business as usual'
  if (value < 80) return 'Melancholy is creeping in — watch for cultural shifts'
  return 'Deep sadness dominates the charts — often mirrors economic anxiety'
}

function getEmoji(value: number): string {
  if (value < 20) return '\u{1F60E}'
  if (value < 40) return '\u{1F60A}'
  if (value < 60) return '\u{1F610}'
  if (value < 80) return '\u{1F614}'
  return '\u{1F622}'
}

export default function BsiGauge({ value, prevValue }: BsiGaugeProps) {
  const segment = getSegment(value)
  const change = value - prevValue
  const changeSign = change > 0 ? '+' : ''

  // SVG gauge parameters
  const cx = 150
  const cy = 140
  const r = 110
  const startAngle = Math.PI // 180 degrees (left)
  const endAngle = 0 // 0 degrees (right)
  const totalAngle = Math.PI

  // Needle angle: value 0 = left (180deg), value 100 = right (0deg)
  const needleAngle = startAngle - (value / 100) * totalAngle

  // Draw arc segments
  function describeArc(startVal: number, endVal: number): string {
    const start = startAngle - (startVal / 100) * totalAngle
    const end = startAngle - (endVal / 100) * totalAngle
    const x1 = cx + r * Math.cos(start)
    const y1 = cy - r * Math.sin(start)
    const x2 = cx + r * Math.cos(end)
    const y2 = cy - r * Math.sin(end)
    const largeArc = Math.abs(start - end) > Math.PI ? 1 : 0
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`
  }

  // Needle tip position
  const needleLen = 85
  const needleTipX = cx + needleLen * Math.cos(needleAngle)
  const needleTipY = cy - needleLen * Math.sin(needleAngle)

  return (
    <div className="card-brutal text-center max-w-md mx-auto">
      <svg viewBox="0 0 300 190" className="w-full max-w-[360px] mx-auto">
        {/* Gauge arc segments */}
        {segments.map((seg) => (
          <path
            key={seg.label}
            d={describeArc(seg.min, seg.max)}
            fill="none"
            stroke={seg.color}
            strokeWidth={22}
            strokeLinecap="butt"
          />
        ))}

        {/* Segment labels */}
        {segments.map((seg) => {
          const midVal = (seg.min + seg.max) / 2
          const midAngle = startAngle - (midVal / 100) * totalAngle
          const labelR = r + 16
          const lx = cx + labelR * Math.cos(midAngle)
          const ly = cy - labelR * Math.sin(midAngle)
          return (
            <text
              key={`label-${seg.label}`}
              x={lx}
              y={ly}
              textAnchor="middle"
              className="fill-navy"
              fontSize="8"
              fontWeight="600"
            >
              {seg.label}
            </text>
          )
        })}

        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={needleTipX}
          y2={needleTipY}
          stroke="#023047"
          strokeWidth={3}
          strokeLinecap="round"
        />
        {/* Needle center dot */}
        <circle cx={cx} cy={cy} r={6} fill="#023047" />
        <circle cx={cx} cy={cy} r={3} fill="white" />

        {/* Value display */}
        <text
          x={cx}
          y={cy + 45}
          textAnchor="middle"
          className="fill-navy"
          fontSize="36"
          fontWeight="800"
          style={{ fontFamily: 'var(--font-poppins)' }}
        >
          {value}
        </text>
      </svg>

      {/* Label + change */}
      <div className="mt-2 flex items-center justify-center gap-3">
        <span
          className="tag-brutal text-base"
          style={{ backgroundColor: segment.color, color: segment.color === '#ffb703' || segment.color === '#8ecae6' ? '#023047' : '#fff' }}
        >
          {getEmoji(value)} {segment.label}
        </span>
        <span
          className={`font-bold text-lg ${change > 0 ? 'text-orange' : change < 0 ? 'text-teal' : 'text-navy'}`}
        >
          {change > 0 ? '\u25B2' : change < 0 ? '\u25BC' : '\u25CF'} {changeSign}{change.toFixed(2)} from last week
        </span>
      </div>

      {/* Interpretation */}
      <p className="mt-4 text-sm text-navy/70 px-4 leading-relaxed">
        {getInterpretation(value)}
      </p>
    </div>
  )
}
