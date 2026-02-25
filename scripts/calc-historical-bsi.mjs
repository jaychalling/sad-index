// Step 3: Calculate weekly BSI for all weeks in track_weekly
// Reads valence from valence_cache → joins with track_weekly → calculates BSI → upserts to bsi_weekly

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// ─── Config ──────────────────────────────────────────────────────────
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

async function main() {
  console.log('[BSI Calculator] Starting...\n')

  // 1. Load all valence cache into memory
  console.log('  Loading valence cache...')
  let allCache = []
  let page = 0
  while (true) {
    const { data, error } = await supabase
      .from('valence_cache')
      .select('title, artist, valence')
      .range(page * 1000, (page + 1) * 1000 - 1)
    if (error) { console.error(error.message); return }
    if (!data || data.length === 0) break
    allCache = allCache.concat(data)
    page++
  }

  const cacheMap = new Map()
  for (const c of allCache) {
    cacheMap.set(`${c.title}|||${c.artist}`, Number(c.valence))
    // Also index by title only (fallback)
    if (!cacheMap.has(`title:${c.title}`)) {
      cacheMap.set(`title:${c.title}`, Number(c.valence))
    }
  }
  console.log(`  Cache loaded: ${allCache.length} entries`)

  // 2. Get all weeks
  console.log('  Loading track_weekly...')
  let allTracks = []
  page = 0
  while (true) {
    const { data, error } = await supabase
      .from('track_weekly')
      .select('week_date, rank, title, artist, valence')
      .order('week_date', { ascending: true })
      .order('rank', { ascending: true })
      .range(page * 1000, (page + 1) * 1000 - 1)
    if (error) { console.error(error.message); return }
    if (!data || data.length === 0) break
    allTracks = allTracks.concat(data)
    page++
  }
  console.log(`  Tracks loaded: ${allTracks.length}`)

  // Group by week
  const weekMap = new Map()
  for (const t of allTracks) {
    if (!weekMap.has(t.week_date)) weekMap.set(t.week_date, [])
    weekMap.get(t.week_date).push(t)
  }
  const weeks = [...weekMap.keys()].sort()
  console.log(`  Weeks: ${weeks.length}\n`)

  // 3. First pass: fill valence from cache where missing
  let filled = 0
  const updateBatch = []
  for (const [weekDate, tracks] of weekMap) {
    for (const t of tracks) {
      if (t.valence !== null) continue
      const cached = cacheMap.get(`${t.title}|||${t.artist}`)
        ?? cacheMap.get(`title:${t.title}`)
      if (cached !== undefined) {
        t.valence = cached
        filled++
        updateBatch.push({ week_date: weekDate, rank: t.rank, valence: cached })
      }
    }
  }
  console.log(`  Filled ${filled} missing valences from cache`)

  // Batch update track_weekly
  if (updateBatch.length > 0) {
    console.log(`  Updating track_weekly...`)
    for (let i = 0; i < updateBatch.length; i += 100) {
      const batch = updateBatch.slice(i, i + 100)
      // Supabase doesn't support batch update easily, use upsert
      const rows = batch.map(b => ({
        week_date: b.week_date,
        rank: b.rank,
        valence: b.valence,
      }))
      // We need title/artist for upsert — skip for now, just update individually
      for (const b of batch) {
        await supabase
          .from('track_weekly')
          .update({ valence: b.valence })
          .eq('week_date', b.week_date)
          .eq('rank', b.rank)
      }
      if ((i + 100) % 1000 === 0) {
        console.log(`    Updated ${Math.min(i + 100, updateBatch.length)}/${updateBatch.length}`)
      }
    }
    console.log(`  ✓ track_weekly updated`)
  }

  // 4. Calculate BSI for each week
  console.log('\n  Calculating BSI for all weeks...')
  const bsiRows = []

  for (const weekDate of weeks) {
    const tracks = weekMap.get(weekDate)
    const withVal = tracks.filter(t => t.valence !== null)

    if (withVal.length === 0) continue

    let ws = 0, tw = 0
    for (const t of withVal) {
      const w = 1 / t.rank
      ws += (1 - t.valence) * w
      tw += w
    }
    const bsi = Math.round((ws / tw) * 10000) / 100
    const avgValence = Math.round(withVal.reduce((s, t) => s + t.valence, 0) / withVal.length * 10000) / 10000

    const mostSad = withVal.reduce((a, b) => a.valence < b.valence ? a : b)
    const mostHappy = withVal.reduce((a, b) => a.valence > b.valence ? a : b)

    bsiRows.push({
      week_date: weekDate,
      bsi_score: bsi,
      avg_valence: avgValence,
      track_count: withVal.length,
      most_sad_track: { title: mostSad.title, artist: mostSad.artist, valence: mostSad.valence, rank: mostSad.rank },
      most_happy_track: { title: mostHappy.title, artist: mostHappy.artist, valence: mostHappy.valence, rank: mostHappy.rank },
    })
  }

  console.log(`  BSI calculated for ${bsiRows.length} weeks`)

  // 5. Upsert to bsi_weekly in batches
  console.log('  Upserting to bsi_weekly...')
  for (let i = 0; i < bsiRows.length; i += 50) {
    const batch = bsiRows.slice(i, i + 50)
    const { error } = await supabase
      .from('bsi_weekly')
      .upsert(batch, { onConflict: 'week_date' })
    if (error) {
      console.error(`  Error at batch ${i}: ${error.message}`)
    }
    if ((i + 50) % 200 === 0 || i + 50 >= bsiRows.length) {
      console.log(`    Upserted ${Math.min(i + 50, bsiRows.length)}/${bsiRows.length}`)
    }
  }

  // Summary
  const bsiValues = bsiRows.map(r => r.bsi_score)
  const avgBSI = (bsiValues.reduce((a, b) => a + b, 0) / bsiValues.length).toFixed(1)
  const minBSI = Math.min(...bsiValues).toFixed(1)
  const maxBSI = Math.max(...bsiValues).toFixed(1)

  console.log(`\n[BSI Calculator] Done`)
  console.log(`  Weeks with BSI: ${bsiRows.length}`)
  console.log(`  BSI range: ${minBSI} ~ ${maxBSI} (avg: ${avgBSI})`)
  console.log(`  Missing valence weeks: ${weeks.length - bsiRows.length}`)
}

main().catch(console.error)
