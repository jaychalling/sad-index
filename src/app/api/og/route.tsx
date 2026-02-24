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

  const response = new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: 'linear-gradient(135deg, #023047 0%, #0a4a6e 50%, #219ebc 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          color: 'white',
          position: 'relative',
        }}
      >
        {/* Left side — Branding */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            flex: 1,
            paddingLeft: '80px',
          }}
        >
          <div
            style={{
              fontSize: '24px',
              fontWeight: 600,
              opacity: 0.6,
              letterSpacing: '3px',
              textTransform: 'uppercase' as const,
              marginBottom: '12px',
            }}
          >
            The Vibe Index
          </div>
          <div
            style={{
              fontSize: '44px',
              fontWeight: 800,
              lineHeight: 1.2,
              maxWidth: '400px',
            }}
          >
            Is America Sad Right Now?
          </div>
          <div
            style={{
              fontSize: '18px',
              opacity: 0.6,
              marginTop: '16px',
              maxWidth: '380px',
              lineHeight: 1.5,
            }}
          >
            Tracking Billboard Hot 100 emotional valence vs. the economy
          </div>
        </div>

        {/* Right side — Score */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            paddingRight: '80px',
          }}
        >
          <div
            style={{
              width: '260px',
              height: '260px',
              borderRadius: '50%',
              border: `6px solid ${seg.color}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.3)',
            }}
          >
            <div style={{ fontSize: '100px', fontWeight: 800, color: seg.color, lineHeight: 1 }}>
              {bsi}
            </div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: seg.color, marginTop: '4px' }}>
              {seg.emoji} {seg.label}
            </div>
          </div>
          <div
            style={{
              fontSize: '20px',
              marginTop: '16px',
              opacity: 0.7,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {change > 0 ? '▲' : change < 0 ? '▼' : '●'}{' '}
            {change > 0 ? '+' : ''}
            {change.toFixed(1)} from last week
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: 'absolute',
            bottom: '0',
            left: '0',
            right: '0',
            height: '6px',
            display: 'flex',
          }}
        >
          <div style={{ flex: 1, background: '#22c55e' }} />
          <div style={{ flex: 1, background: '#8ecae6' }} />
          <div style={{ flex: 1, background: '#ffb703' }} />
          <div style={{ flex: 1, background: '#fb8500' }} />
          <div style={{ flex: 1, background: '#ef4444' }} />
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
