import { ImageResponse } from '@vercel/og'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

function getSegment(value: number) {
  if (value < 20) return { label: 'Euphoric', color: '#22c55e', emoji: '😎' }
  if (value < 40) return { label: 'Bright', color: '#8ecae6', emoji: '😊' }
  if (value < 60) return { label: 'Neutral', color: '#ffb703', emoji: '😐' }
  if (value < 80) return { label: 'Moody', color: '#fb8500', emoji: '😔' }
  return { label: 'Dark', color: '#ef4444', emoji: '😢' }
}

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const { data } = await supabase
    .from('bsi_weekly')
    .select('week_date, bsi_score')
    .order('week_date', { ascending: false })
    .limit(2)

  const latest = data?.[0]
  const prev = data?.[1]
  const bsi = Number(latest?.bsi_score ?? 50)
  const prevBsi = Number(prev?.bsi_score ?? 50)
  const change = bsi - prevBsi
  const seg = getSegment(bsi)
  const weekDate = latest?.week_date ?? ''

  const response = new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: 'linear-gradient(135deg, #023047 0%, #0a4a6e 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          color: 'white',
          position: 'relative',
        }}
      >
        {/* Title */}
        <div
          style={{
            fontSize: '28px',
            fontWeight: 600,
            opacity: 0.8,
            letterSpacing: '3px',
            textTransform: 'uppercase' as const,
            marginBottom: '8px',
          }}
        >
          Sad Index — Billboard Sadness Index
        </div>

        {/* BSI Score */}
        <div
          style={{
            fontSize: '180px',
            fontWeight: 800,
            color: seg.color,
            lineHeight: 1,
            display: 'flex',
            alignItems: 'baseline',
          }}
        >
          {Math.round(bsi)}
        </div>

        {/* Label */}
        <div
          style={{
            fontSize: '40px',
            fontWeight: 700,
            color: seg.color,
            marginTop: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          {seg.emoji} {seg.label}
        </div>

        {/* Change */}
        <div
          style={{
            fontSize: '24px',
            marginTop: '20px',
            opacity: 0.7,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {change > 0 ? '▲' : change < 0 ? '▼' : '●'}{' '}
          {change > 0 ? '+' : ''}
          {change.toFixed(1)} from last week
        </div>

        {/* Footer */}
        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            fontSize: '16px',
            opacity: 0.4,
            display: 'flex',
            gap: '20px',
          }}
        >
          <span>sadindex.com</span>
          <span>Week of {weekDate}</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  )

  response.headers.set('Cache-Control', 'public, max-age=3600, s-maxage=3600')
  return response
}
