// Recalculate valence with 50/50 blend using cached audio + reverse-engineered Gemini scores
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
    .select('id, rank, title, artist, valence')
    .eq('week_date', WEEK)
    .order('rank')

  console.log(`[Recalc] ${tracks.length} tracks for ${WEEK}`)

  let updated = 0
  for (const t of tracks) {
    // Get original audio valence from cache
    let { data: cache } = await supabase
      .from('valence_cache')
      .select('valence')
      .eq('title', t.title)
      .eq('artist', t.artist)
      .limit(1)
    if (!cache?.length) {
      // title-only fallback
      const { data: c2 } = await supabase
        .from('valence_cache')
        .select('valence')
        .eq('title', t.title)
        .limit(1)
      cache = c2
    }

    const audioVal = cache?.[0]?.valence
    if (audioVal == null) continue

    // Reverse-engineer Gemini mood score from current corrected valence
    // old formula: corrected = audio*0.3 + gemini*0.7
    // gemini = (corrected - audio*0.3) / 0.7
    const currentCorrected = t.valence * 100
    const geminiScore = (currentCorrected - audioVal * 100 * 0.3) / 0.7

    // New formula: 50/50
    const newCorrected = Math.round((audioVal * 100 * 0.5 + geminiScore * 0.5)) / 100

    await supabase.from('track_weekly').update({ valence: newCorrected }).eq('id', t.id)
    updated++

    if (t.rank <= 20) {
      console.log(`  #${t.rank} ${t.title} | audio: ${(audioVal*100).toFixed(0)} | gemini: ${geminiScore.toFixed(0)} | old: ${(t.valence*100).toFixed(0)} → new: ${(newCorrected*100).toFixed(0)}`)
    }
  }

  console.log(`\n  Updated: ${updated}`)

  // Recalculate BSI
  const { data: updatedTracks } = await supabase
    .from('track_weekly')
    .select('rank, title, artist, valence')
    .eq('week_date', WEEK)
    .order('rank')

  const withVal = updatedTracks.filter(t => t.valence != null)
  let ws = 0, tw = 0
  for (const t of withVal) { const w = 1/t.rank; ws += (1 - t.valence) * w; tw += w }
  const bsi = Math.round((ws / tw) * 10000) / 100
  const avgValence = Math.round(withVal.reduce((s, t) => s + t.valence, 0) / withVal.length * 10000) / 10000

  const mostSad = withVal.reduce((a, b) => a.valence < b.valence ? a : b)
  const mostHappy = withVal.reduce((a, b) => a.valence > b.valence ? a : b)

  await supabase.from('bsi_weekly').upsert({
    week_date: WEEK,
    bsi_score: bsi,
    avg_valence: avgValence,
    track_count: withVal.length,
    most_sad_track: { title: mostSad.title, artist: mostSad.artist, valence: mostSad.valence, rank: mostSad.rank },
    most_happy_track: { title: mostHappy.title, artist: mostHappy.artist, valence: mostHappy.valence, rank: mostHappy.rank },
  }, { onConflict: 'week_date' })

  console.log(`  BSI: ${bsi} | Avg Valence: ${avgValence}`)

  // New distribution
  let sad=0, neutral=0, happy=0
  withVal.forEach(t => {
    const v = Math.round(t.valence * 100)
    if (v >= 50) happy++; else if (v >= 40) neutral++; else sad++
  })
  console.log(`  Happy: ${happy} | Neutral: ${neutral} | Sad: ${sad}`)
}

main().catch(console.error)
