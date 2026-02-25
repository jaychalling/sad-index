// Fast BSI calculator — joins track_weekly with valence_cache in memory
// Skips slow individual track_weekly updates, directly computes BSI per week

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf-8')
for (const line of env.split('\n')) {
  const [key, ...vals] = line.split('=')
  if (key && !key.startsWith('#') && key.trim()) process.env[key.trim()] = vals.join('=').trim()
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)

async function paginate(table, select, filters = {}, orderBy) {
  const all = []
  let from = 0
  while (true) {
    let q = supabase.from(table).select(select).range(from, from + 999)
    if (orderBy) q = q.order(orderBy, { ascending: true })
    for (const [k, v] of Object.entries(filters)) q = q.eq(k, v)
    const { data } = await q
    if (!data || data.length === 0) break
    all.push(...data)
    from += 1000
    if (from % 10000 === 0) console.log(`    ... ${table}: ${all.length} rows`)
  }
  return all
}

async function main() {
  console.log('[Fast BSI] Loading data...')

  // Load valence cache into memory (title+artist → valence)
  console.log('  Loading valence_cache...')
  const cache = await paginate('valence_cache', 'title, artist, valence')
  console.log(`  Cache: ${cache.length} entries`)

  const cacheExact = new Map()
  const cacheTitle = new Map()
  for (const c of cache) {
    cacheExact.set(`${c.title}|||${c.artist}`, Number(c.valence))
    if (!cacheTitle.has(c.title)) cacheTitle.set(c.title, Number(c.valence))
  }

  // Load all track_weekly
  console.log('  Loading track_weekly...')
  const tracks = await paginate('track_weekly', 'week_date, rank, title, artist, valence', {}, 'week_date')
  console.log(`  Tracks: ${tracks.length}`)

  // Group by week
  const weekMap = new Map()
  for (const t of tracks) {
    if (!weekMap.has(t.week_date)) weekMap.set(t.week_date, [])
    weekMap.get(t.week_date).push(t)
  }
  const weeks = Array.from(weekMap.keys()).sort()
  console.log(`  Weeks: ${weeks.length}\n`)

  // Calculate BSI per week
  let computed = 0, skipped = 0
  const bsiRows = []

  for (const weekDate of weeks) {
    const tracks = weekMap.get(weekDate)

    // Resolve valence: existing in DB → cache exact → cache title
    const resolved = tracks.map(t => {
      let val = t.valence != null ? Number(t.valence) : null
      if (val == null) val = cacheExact.get(`${t.title}|||${t.artist}`) ?? null
      if (val == null) val = cacheTitle.get(t.title) ?? null
      return { ...t, valence: val }
    }).filter(t => t.valence != null)

    if (resolved.length < 5) { skipped++; continue }

    let ws = 0, tw = 0
    for (const t of resolved) {
      const w = 1 / t.rank
      ws += (1 - t.valence) * w
      tw += w
    }
    const bsi = Math.round((ws / tw) * 10000) / 100
    const avgVal = Math.round(resolved.reduce((s, t) => s + t.valence, 0) / resolved.length * 10000) / 10000

    const sorted = [...resolved].sort((a, b) => a.valence - b.valence)
    const sad = sorted[0]
    const happy = sorted[sorted.length - 1]

    bsiRows.push({
      week_date: weekDate,
      bsi_score: bsi,
      avg_valence: avgVal,
      track_count: resolved.length,
      most_sad_track: { title: sad.title, artist: sad.artist, valence: sad.valence, rank: sad.rank },
      most_happy_track: { title: happy.title, artist: happy.artist, valence: happy.valence, rank: happy.rank },
    })
    computed++
  }

  console.log(`  Computed BSI for ${computed} weeks, skipped ${skipped} (< 5 tracks with valence)`)

  // Stats
  const vals = bsiRows.map(r => r.bsi_score)
  console.log(`  BSI range: ${Math.min(...vals).toFixed(1)} ~ ${Math.max(...vals).toFixed(1)} (avg: ${(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)})`)
  console.log(`  Coverage: ${bsiRows.filter(r => r.track_count >= 20).length} weeks with 20+ tracks`)

  // Upsert to bsi_weekly
  console.log('\n  Upserting to bsi_weekly...')
  for (let i = 0; i < bsiRows.length; i += 50) {
    const batch = bsiRows.slice(i, i + 50)
    const { error } = await supabase.from('bsi_weekly').upsert(batch, { onConflict: 'week_date' })
    if (error) console.error(`  Error at ${i}: ${error.message}`)
    if ((i + 50) % 500 === 0 || i + 50 >= bsiRows.length) {
      console.log(`    ${Math.min(i + 50, bsiRows.length)}/${bsiRows.length}`)
    }
  }

  console.log('\n[Fast BSI] Done!')
}

main().catch(console.error)
