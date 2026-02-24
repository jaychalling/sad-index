/**
 * Seed script — migrates bsi-data.ts into Supabase
 *
 * Usage:
 *   npx tsx scripts/seed-db.ts
 *
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'
import {
  bsiWeeklyData,
  sp500Data,
  topTracksThisWeek,
  currentWeekData,
} from '../src/data/bsi-data'

// Load .env.local
import { config } from 'dotenv'
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function seedBsiWeekly() {
  console.log('Seeding bsi_weekly...')

  const rows = bsiWeeklyData.map((d) => ({
    week_date: d.date,
    bsi_score: d.bsi,
    avg_valence: d.avgValence,
    track_count: 100,
  }))

  // Update current week with track highlights
  const currentIdx = rows.findIndex((r) => r.week_date === currentWeekData.weekDate)
  if (currentIdx !== -1) {
    ;(rows[currentIdx] as Record<string, unknown>).most_sad_track = currentWeekData.mostSadTrack
    ;(rows[currentIdx] as Record<string, unknown>).most_happy_track = currentWeekData.mostHappyTrack
  }

  // Batch insert in chunks of 100
  for (let i = 0; i < rows.length; i += 100) {
    const chunk = rows.slice(i, i + 100)
    const { error } = await supabase.from('bsi_weekly').upsert(chunk, { onConflict: 'week_date' })
    if (error) {
      console.error(`bsi_weekly chunk ${i}: ${error.message}`)
    }
  }

  console.log(`  ✓ ${rows.length} rows`)
}

async function seedEconomicData() {
  console.log('Seeding economic_data (S&P 500)...')

  const sp500Rows = sp500Data.map((d) => ({
    date: d.date,
    indicator: 'SP500',
    value: d.value,
  }))

  for (let i = 0; i < sp500Rows.length; i += 100) {
    const chunk = sp500Rows.slice(i, i + 100)
    const { error } = await supabase
      .from('economic_data')
      .upsert(chunk, { onConflict: 'date,indicator' })
    if (error) {
      console.error(`economic_data SP500 chunk ${i}: ${error.message}`)
    }
  }

  console.log(`  ✓ ${sp500Rows.length} SP500 rows`)

  // Current week indicators
  const { economicIndicators } = currentWeekData
  const currentDate = currentWeekData.weekDate
  const currentRows = [
    { date: currentDate, indicator: 'VIX', value: economicIndicators.vix.value },
    { date: currentDate, indicator: 'UNRATE', value: economicIndicators.unemployment.value },
    { date: currentDate, indicator: 'UMCSENT', value: economicIndicators.consumerSentiment.value },
  ]

  const { error } = await supabase
    .from('economic_data')
    .upsert(currentRows, { onConflict: 'date,indicator' })
  if (error) {
    console.error(`economic_data current: ${error.message}`)
  }

  console.log(`  ✓ ${currentRows.length} current indicator rows`)
}

async function seedTrackWeekly() {
  console.log('Seeding track_weekly (current week)...')

  const rows = topTracksThisWeek.map((t) => ({
    week_date: currentWeekData.weekDate,
    rank: t.rank,
    title: t.title,
    artist: t.artist,
    valence: t.valence,
  }))

  const { error } = await supabase
    .from('track_weekly')
    .upsert(rows, { onConflict: 'week_date,rank' })
  if (error) {
    console.error(`track_weekly: ${error.message}`)
  }

  console.log(`  ✓ ${rows.length} tracks`)
}

async function main() {
  console.log('=== SAD-INDEX Seed Script ===')
  console.log(`Target: ${supabaseUrl}\n`)

  await seedBsiWeekly()
  await seedEconomicData()
  await seedTrackWeekly()

  console.log('\n✓ Seed complete!')
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
