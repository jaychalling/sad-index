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
  try {
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
    const changeText = `${change > 0 ? '▲ +' : change < 0 ? '▼ ' : '● '}${change.toFixed(1)} from last week`

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            background: '#023047',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'system-ui, sans-serif',
            color: 'white',
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 600, opacity: 0.5, letterSpacing: 3, marginBottom: 16 }}>
            THE VIBE INDEX
          </div>
          <div style={{ fontSize: 36, fontWeight: 800, marginBottom: 24 }}>
            Is America Sad Right Now?
          </div>
          <div
            style={{
              width: 220,
              height: 220,
              borderRadius: 110,
              border: `5px solid ${seg.color}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255,255,255,0.05)',
            }}
          >
            <div style={{ fontSize: 80, fontWeight: 800, color: seg.color, lineHeight: 1 }}>
              {Math.round(bsi)}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: seg.color, marginTop: 4 }}>
              {seg.emoji} {seg.label}
            </div>
          </div>
          <div style={{ fontSize: 18, marginTop: 16, opacity: 0.6 }}>
            {changeText}
          </div>
          <div style={{ fontSize: 14, marginTop: 24, opacity: 0.3 }}>
            sadindex.com — Billboard Hot 100 emotional valence tracker
          </div>
        </div>
      ),
      { width: 1200, height: 630 },
    )
  } catch {
    // Fallback static OG image
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            background: '#023047',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'system-ui, sans-serif',
            color: 'white',
          }}
        >
          <div style={{ fontSize: 24, opacity: 0.5, letterSpacing: 3, marginBottom: 16 }}>
            THE VIBE INDEX
          </div>
          <div style={{ fontSize: 44, fontWeight: 800 }}>
            Billboard Sadness Index
          </div>
          <div style={{ fontSize: 18, opacity: 0.6, marginTop: 16 }}>
            sadindex.com
          </div>
        </div>
      ),
      { width: 1200, height: 630 },
    )
  }
}
