/**
 * Fetch Billboard Hot 100 chart data, look up valence from cache,
 * calculate BSI, and upsert into Supabase.
 *
 * Usage:
 *   npx tsx scripts/fetch-billboard.ts
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

const BILLBOARD_URL =
  'https://raw.githubusercontent.com/mhollingshead/billboard-hot-100/main/recent.json'

interface BillboardEntry {
  song: string
  artist: string
  this_week: number
  last_week: number
  peak_position: number
  weeks_on_chart: number
}

interface BillboardChart {
  date: string
  data: BillboardEntry[]
}

async function lookupValence(
  title: string,
  artist: string,
): Promise<number | null> {
  const { data } = await supabase
    .from('valence_cache')
    .select('valence')
    .eq('title', title)
    .eq('artist', artist)
    .limit(1)

  return data?.[0]?.valence ? Number(data[0].valence) : null
}

function calculateBsi(
  tracks: Array<{ rank: number; valence: number | null }>,
): { bsi: number; avgValence: number; analyzedCount: number } {
  // Filter tracks with valence data
  const withValence = tracks.filter((t) => t.valence !== null) as Array<{
    rank: number
    valence: number
  }>

  if (withValence.length === 0) {
    return { bsi: 50, avgValence: 0.5, analyzedCount: 0 }
  }

  let weightedSadness = 0
  let totalWeight = 0

  for (const t of withValence) {
    const weight = 1 / t.rank
    weightedSadness += (1 - t.valence) * weight
    totalWeight += weight
  }

  const bsi = (weightedSadness / totalWeight) * 100
  const avgValence =
    withValence.reduce((sum, t) => sum + t.valence, 0) / withValence.length

  return {
    bsi: Math.round(bsi * 100) / 100,
    avgValence: Math.round(avgValence * 10000) / 10000,
    analyzedCount: withValence.length,
  }
}

async function main() {
  console.log('=== Billboard Chart Fetch ===\n')

  // 1. Fetch chart
  console.log('Fetching Billboard Hot 100...')
  const res = await fetch(BILLBOARD_URL)
  if (!res.ok) {
    console.error(`Billboard fetch failed: HTTP ${res.status}`)
    process.exit(1)
  }

  const chart = (await res.json()) as BillboardChart
  console.log(`  Chart date: ${chart.date}`)
  console.log(`  Tracks: ${chart.data.length}`)

  // 2. Look up valence for each track
  console.log('\nLooking up valence...')
  const tracksWithValence: Array<{
    rank: number
    title: string
    artist: string
    valence: number | null
  }> = []

  let cacheHits = 0
  for (const entry of chart.data) {
    const valence = await lookupValence(entry.song, entry.artist)
    if (valence !== null) cacheHits++
    tracksWithValence.push({
      rank: entry.this_week,
      title: entry.song,
      artist: entry.artist,
      valence,
    })
  }
  console.log(
    `  Cache hits: ${cacheHits}/${chart.data.length} (${Math.round((cacheHits / chart.data.length) * 100)}%)`,
  )

  // 3. Calculate BSI
  const { bsi, avgValence, analyzedCount } = calculateBsi(tracksWithValence)
  console.log(`\n  BSI: ${bsi}`)
  console.log(`  Avg Valence: ${avgValence}`)
  console.log(`  Analyzed: ${analyzedCount}/${chart.data.length} tracks`)

  // 4. Upsert track_weekly
  console.log('\nUpserting track_weekly...')
  const trackRows = tracksWithValence.map((t) => ({
    week_date: chart.date,
    rank: t.rank,
    title: t.title,
    artist: t.artist,
    valence: t.valence,
  }))

  for (let i = 0; i < trackRows.length; i += 50) {
    const chunk = trackRows.slice(i, i + 50)
    const { error } = await supabase
      .from('track_weekly')
      .upsert(chunk, { onConflict: 'week_date,rank' })
    if (error) console.error(`  track_weekly chunk ${i}: ${error.message}`)
  }
  console.log(`  ✓ ${trackRows.length} tracks`)

  // 5. Find most sad / most happy (among those with valence)
  const withVal = tracksWithValence.filter((t) => t.valence !== null) as Array<{
    rank: number
    title: string
    artist: string
    valence: number
  }>
  const mostSad = withVal.length
    ? withVal.reduce((a, b) => (a.valence < b.valence ? a : b))
    : null
  const mostHappy = withVal.length
    ? withVal.reduce((a, b) => (a.valence > b.valence ? a : b))
    : null

  // 6. Upsert bsi_weekly
  console.log('Upserting bsi_weekly...')
  const { error } = await supabase.from('bsi_weekly').upsert(
    {
      week_date: chart.date,
      bsi_score: bsi,
      avg_valence: avgValence,
      track_count: analyzedCount,
      most_sad_track: mostSad
        ? { title: mostSad.title, artist: mostSad.artist, valence: mostSad.valence, rank: mostSad.rank }
        : null,
      most_happy_track: mostHappy
        ? { title: mostHappy.title, artist: mostHappy.artist, valence: mostHappy.valence, rank: mostHappy.rank }
        : null,
    },
    { onConflict: 'week_date' },
  )
  if (error) console.error(`  bsi_weekly: ${error.message}`)
  else console.log(`  ✓ BSI ${bsi} for ${chart.date}`)

  console.log('\n✓ Billboard fetch complete!')
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
