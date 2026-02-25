// Restore original audio valence from valence_cache to track_weekly
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf-8')
for (const line of env.split('\n')) {
  const [key, ...vals] = line.split('=')
  if (key && !key.startsWith('#') && key.trim()) {
    process.env[key.trim()] = vals.join('=').trim()
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)

const WEEK = '2026-02-21'

async function main() {
  const { data: tracks } = await supabase
    .from('track_weekly')
    .select('id, rank, title, artist')
    .eq('week_date', WEEK)
    .order('rank')

  console.log(`[Restore] ${tracks.length} tracks for ${WEEK}`)

  let restored = 0
  for (const t of tracks) {
    let { data: cache } = await supabase.from('valence_cache').select('valence').eq('title', t.title).eq('artist', t.artist).limit(1)
    if (!cache?.length) {
      const { data: c2 } = await supabase.from('valence_cache').select('valence').eq('title', t.title).limit(1)
      cache = c2
    }
    const audioVal = cache?.[0]?.valence ?? null
    await supabase.from('track_weekly').update({ valence: audioVal }).eq('id', t.id)
    restored++
  }

  console.log(`  Restored: ${restored}`)

  // Recalculate BSI
  const { data: updated } = await supabase.from('track_weekly').select('rank,title,artist,valence').eq('week_date', WEEK).order('rank')
  const withVal = updated.filter(t => t.valence != null)
  let ws = 0, tw = 0
  for (const t of withVal) { const w = 1/t.rank; ws += (1 - t.valence) * w; tw += w }
  const bsi = Math.round((ws / tw) * 10000) / 100
  const avgValence = Math.round(withVal.reduce((s,t) => s+t.valence,0)/withVal.length*10000)/10000

  const mostSad = withVal.reduce((a,b) => a.valence < b.valence ? a : b)
  const mostHappy = withVal.reduce((a,b) => a.valence > b.valence ? a : b)

  await supabase.from('bsi_weekly').upsert({
    week_date: WEEK, bsi_score: bsi, avg_valence: avgValence, track_count: withVal.length,
    most_sad_track: { title: mostSad.title, artist: mostSad.artist, valence: mostSad.valence, rank: mostSad.rank },
    most_happy_track: { title: mostHappy.title, artist: mostHappy.artist, valence: mostHappy.valence, rank: mostHappy.rank },
  }, { onConflict: 'week_date' })

  console.log(`  BSI: ${bsi} | Avg Valence: ${avgValence}`)

  let sad=0, neutral=0, happy=0
  withVal.forEach(t => {
    const v = Math.round(t.valence * 100)
    if (v >= 55) happy++; else if (v >= 35) neutral++; else sad++
  })
  console.log(`  Happy(>=55): ${happy} | Neutral(35-54): ${neutral} | Sad(<35): ${sad}`)

  updated.slice(0,10).forEach(t => console.log(`  #${t.rank} ${t.title} - ${t.valence ? (t.valence*100).toFixed(0) : 'null'}`))
}

main().catch(console.error)
