/**
 * Fetch economic data from FRED API and upsert into Supabase.
 *
 * Usage:
 *   npx tsx scripts/fetch-fred.ts                  # Last 30 days
 *   npx tsx scripts/fetch-fred.ts --since 2000-01  # From specific date
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const fredApiKey = process.env.FRED_API_KEY!

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}
if (!fredApiKey) {
  console.error('Missing FRED_API_KEY in .env.local')
  console.error('Get one free at: https://fredaccount.stlouisfed.org')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

const SERIES = [
  { id: 'SP500', indicator: 'SP500', frequency: 'd' },
  { id: 'VIXCLS', indicator: 'VIX', frequency: 'd' },
  { id: 'UNRATE', indicator: 'UNRATE', frequency: 'm' },
  { id: 'UMCSENT', indicator: 'UMCSENT', frequency: 'm' },
] as const

interface FredObservation {
  date: string
  value: string
}

interface FredResponse {
  observations: FredObservation[]
}

async function fetchSeries(
  seriesId: string,
  indicator: string,
  frequency: string,
  since: string,
): Promise<number> {
  const url = new URL('https://api.stlouisfed.org/fred/series/observations')
  url.searchParams.set('series_id', seriesId)
  url.searchParams.set('api_key', fredApiKey)
  url.searchParams.set('file_type', 'json')
  url.searchParams.set('observation_start', since)
  url.searchParams.set('frequency', frequency)

  const res = await fetch(url.toString())
  if (!res.ok) {
    console.error(`  FRED ${seriesId}: HTTP ${res.status}`)
    return 0
  }

  const json = (await res.json()) as FredResponse
  const observations = json.observations.filter((o) => o.value !== '.')

  if (observations.length === 0) {
    console.log(`  ${indicator}: no new observations`)
    return 0
  }

  const rows = observations.map((o) => ({
    date: o.date,
    indicator,
    value: parseFloat(o.value),
  }))

  // Batch upsert in chunks of 200
  for (let i = 0; i < rows.length; i += 200) {
    const chunk = rows.slice(i, i + 200)
    const { error } = await supabase
      .from('economic_data')
      .upsert(chunk, { onConflict: 'date,indicator' })
    if (error) {
      console.error(`  ${indicator} chunk ${i}: ${error.message}`)
    }
  }

  return rows.length
}

async function main() {
  // Parse --since flag
  const sinceIdx = process.argv.indexOf('--since')
  const since =
    sinceIdx !== -1 && process.argv[sinceIdx + 1]
      ? process.argv[sinceIdx + 1]
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  console.log(`=== FRED Data Fetch ===`)
  console.log(`Since: ${since}\n`)

  for (const series of SERIES) {
    const count = await fetchSeries(series.id, series.indicator, series.frequency, since)
    console.log(`  ${series.indicator}: ${count} rows upserted`)
  }

  console.log('\n✓ FRED fetch complete!')
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
