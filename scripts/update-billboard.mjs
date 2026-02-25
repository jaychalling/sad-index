// Fetch latest Billboard Hot 100 → update track_weekly + bsi_weekly
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Load env
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

const BILLBOARD_URL = 'https://raw.githubusercontent.com/mhollingshead/billboard-hot-100/main/recent.json'

// ─── Fetch Billboard ─────────────────────────────────────────────────
console.log('[Billboard] Fetching chart...')
const res = await fetch(BILLBOARD_URL)
if (!res.ok) { console.error(`HTTP ${res.status}`); process.exit(1) }

const chart = await res.json()
console.log(`  Date: ${chart.date}, Tracks: ${chart.data.length}`)

// ─── Lookup valence from cache ───────────────────────────────────────
async function lookupValence(title, artist) {
  // Try exact match
  const { data } = await supabase
    .from('valence_cache')
    .select('valence')
    .eq('title', title)
    .eq('artist', artist)
    .limit(1)
  if (data?.[0]?.valence) return Number(data[0].valence)

  // Try title-only match
  const { data: d2 } = await supabase
    .from('valence_cache')
    .select('valence')
    .eq('title', title)
    .limit(1)
  return d2?.[0]?.valence ? Number(d2[0].valence) : null
}

const tracks = []
let hits = 0
for (const e of chart.data) {
  const valence = await lookupValence(e.song, e.artist)
  if (valence !== null) hits++
  tracks.push({ rank: e.this_week, title: e.song, artist: e.artist, valence })
}
console.log(`  Valence cache hits: ${hits}/${chart.data.length}`)

// ─── Delete old data for this week (clean slate) ─────────────────────
await supabase.from('track_weekly').delete().eq('week_date', chart.date)

// ─── Upsert track_weekly ─────────────────────────────────────────────
for (let i = 0; i < tracks.length; i += 50) {
  const chunk = tracks.slice(i, i + 50).map(t => ({
    week_date: chart.date, rank: t.rank, title: t.title, artist: t.artist, valence: t.valence,
  }))
  const { error } = await supabase.from('track_weekly').upsert(chunk, { onConflict: 'week_date,rank' })
  if (error) console.error(`  track_weekly: ${error.message}`)
}
console.log(`  Inserted ${tracks.length} tracks for ${chart.date}`)

// Show top 10
console.log('\n  Top 10:')
tracks.slice(0, 10).forEach(t =>
  console.log(`  #${t.rank} ${t.title} — ${t.artist} | valence: ${t.valence ?? 'null'}`)
)

// ─── Calculate BSI ───────────────────────────────────────────────────
const withVal = tracks.filter(t => t.valence !== null)
let bsi = 50, avgValence = 0.5
if (withVal.length > 0) {
  let ws = 0, tw = 0
  for (const t of withVal) { const w = 1/t.rank; ws += (1 - t.valence) * w; tw += w }
  bsi = Math.round((ws / tw) * 10000) / 100
  avgValence = Math.round(withVal.reduce((s, t) => s + t.valence, 0) / withVal.length * 10000) / 10000
}

const mostSad = withVal.length ? withVal.reduce((a, b) => a.valence < b.valence ? a : b) : null
const mostHappy = withVal.length ? withVal.reduce((a, b) => a.valence > b.valence ? a : b) : null

const { error } = await supabase.from('bsi_weekly').upsert({
  week_date: chart.date,
  bsi_score: bsi,
  avg_valence: avgValence,
  track_count: withVal.length,
  most_sad_track: mostSad ? { title: mostSad.title, artist: mostSad.artist, valence: mostSad.valence, rank: mostSad.rank } : null,
  most_happy_track: mostHappy ? { title: mostHappy.title, artist: mostHappy.artist, valence: mostHappy.valence, rank: mostHappy.rank } : null,
}, { onConflict: 'week_date' })

if (error) console.error(`  bsi_weekly: ${error.message}`)
else console.log(`\n  BSI: ${bsi} | Avg Valence: ${avgValence} | Tracks w/ valence: ${withVal.length}/${tracks.length}`)

console.log('\n[Billboard] Done')
