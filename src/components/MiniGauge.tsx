'use client'

interface Segment {
  min: number
  max: number
  label: string
  color: string
}

interface MiniGaugeProps {
  value: number
  prevValue?: number
  title: string
  source: string
  segments: Segment[]
}

function getSegment(value: number, segments: Segment[]) {
  return segments.find((s) => value >= s.min && value < s.max) || segments[segments.length - 1]
}

export default function MiniGauge({ value, prevValue, title, source, segments }: MiniGaugeProps) {
  const segment = getSegment(value, segments)
  const change = prevValue != null ? value - prevValue : null

  // SVG gauge parameters (compact)
  const cx = 100
  const cy = 90
  const r = 70
  const startAngle = Math.PI
  const totalAngle = Math.PI

  const needleAngle = startAngle - (Math.min(100, Math.max(0, value)) / 100) * totalAngle

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

  const needleLen = 52
  const needleTipX = cx + needleLen * Math.cos(needleAngle)
  const needleTipY = cy - needleLen * Math.sin(needleAngle)

  return (
    <div className="card-brutal text-center !p-4">
      <p className="text-xs font-bold uppercase tracking-widest text-navy/60 mb-1">{title}</p>

      <svg viewBox="0 0 200 120" className="w-full max-w-[200px] mx-auto">
        {segments.map((seg) => (
          <path
            key={seg.label}
            d={describeArc(seg.min, seg.max)}
            fill="none"
            stroke={seg.color}
            strokeWidth={14}
            strokeLinecap="butt"
          />
        ))}
        <line
          x1={cx}
          y1={cy}
          x2={needleTipX}
          y2={needleTipY}
          stroke="#023047"
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r={4} fill="#023047" />
        <circle cx={cx} cy={cy} r={2} fill="white" />
        <text
          x={cx}
          y={cy + 28}
          textAnchor="middle"
          className="fill-navy"
          fontSize="24"
          fontWeight="800"
          style={{ fontFamily: 'var(--font-poppins)' }}
        >
          {Math.round(value)}
        </text>
      </svg>

      <span
        className="inline-block tag-brutal !text-[10px] !px-2 !py-0 font-bold"
        style={{ backgroundColor: segment.color, color: segment.color === '#ffb703' || segment.color === '#4ade80' ? '#023047' : '#fff' }}
      >
        {segment.label}
      </span>

      {change != null && (
        <p className={`text-xs font-semibold mt-1 ${change > 0 ? 'text-orange' : change < 0 ? 'text-teal' : 'text-navy/40'}`}>
          {change > 0 ? '\u25B2' : change < 0 ? '\u25BC' : '\u25CF'}{' '}
          {change > 0 ? '+' : ''}{change.toFixed(1)}
        </p>
      )}

      <p className="text-[9px] text-navy/40 mt-1">{source}</p>
    </div>
  )
}
