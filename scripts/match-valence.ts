/**
 * Match Billboard tracks in DB with valence from Kaggle CSV.
 * Only imports valence for songs already in track_weekly.
 *
 * Usage:
 *   npx tsx scripts/match-valence.ts "C:/path/to/tracks_features.csv"
 */

import { createClient } from '@supabase/supabase-js'
import { createReadStream } from 'fs'
import { createInterface } from 'readline'
import { config } from 'dotenv'
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const csvPath = process.argv[2]

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}
if (!csvPath) {
  console.error('Usage: npx tsx scripts/match-valence.ts <csv-path>')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/\(feat\..*?\)/gi, '')
    .replace(/\(ft\..*?\)/gi, '')
    .replace(/\[.*?\]/g, '')
    .replace(/['']/g, "'")
    .replace(/[^\w\s']/g, '')
    .trim()
}

async function main() {
  console.log('=== Valence Matcher ===\n')

  // 1. Get all unique tracks from track_weekly that have no valence
  console.log('Fetching Billboard tracks from DB...')
  const { data: dbTracks } = await supabase
    .from('track_weekly')
    .select('title, artist')

  if (!dbTracks?.length) {
    console.log('No tracks in track_weekly. Run fetch-billboard first.')
    process.exit(0)
  }

  // Deduplicate
  const needValence = new Map<string, { title: string; artist: string }>()
  for (const t of dbTracks) {
    const key = normalize(t.title) + '|||' + normalize(t.artist)
    if (!needValence.has(key)) {
      needValence.set(key, { title: t.title, artist: t.artist })
    }
  }
  console.log(`  ${needValence.size} unique tracks to match\n`)

  // 2. Build lookup index from CSV
  console.log('Scanning Kaggle CSV...')
  const stream = createReadStream(csvPath, { encoding: 'utf-8' })
  const rl = createInterface({ input: stream, crlfDelay: Infinity })

  // CSV index: normalized "title|||artist" → { valence, spotify_id }
  const csvIndex = new Map<string, { valence: number; spotifyId: string }>()
  // Also index by title only for fuzzy matching
  const titleIndex = new Map<string, Array<{ artist: string; valence: number; spotifyId: string }>>()

  let lineNum = 0
  let headers: string[] = []
  let nameIdx = -1, artistIdx = -1, valenceIdx = -1, idIdx = -1

  for await (const line of rl) {
    lineNum++
    if (lineNum === 1) {
      headers = parseCSVLine(line).map(h => h.toLowerCase())
      nameIdx = headers.indexOf('name')
      artistIdx = headers.indexOf('artists')
      valenceIdx = headers.indexOf('valence')
      idIdx = headers.indexOf('id')
      continue
    }

    const cols = parseCSVLine(line)
    const name = cols[nameIdx]
    let artist = cols[artistIdx] || ''
    const valStr = cols[valenceIdx]
    const spotifyId = cols[idIdx] || ''

    if (!name || !valStr) continue
    const valence = parseFloat(valStr)
    if (isNaN(valence)) continue

    // Clean artist from ['Artist'] format
    if (artist.startsWith('[')) {
      artist = artist.replace(/^\[|\]$/g, '').replace(/'/g, '').split(',')[0].trim()
    }

    const normTitle = normalize(name)
    const normArtist = normalize(artist)
    const key = normTitle + '|||' + normArtist

    csvIndex.set(key, { valence, spotifyId })

    // Title-only index
    if (!titleIndex.has(normTitle)) titleIndex.set(normTitle, [])
    titleIndex.get(normTitle)!.push({ artist, valence, spotifyId })

    if (lineNum % 200000 === 0) {
      console.log(`  ${lineNum.toLocaleString()} rows scanned...`)
    }
  }
  console.log(`  ${csvIndex.size.toLocaleString()} songs indexed\n`)

  // 3. Match
  console.log('Matching...')
  let exactMatch = 0
  let titleMatch = 0
  let noMatch = 0
  const cacheRows: Array<{
    title: string
    artist: string
    valence: number
    spotify_id: string | null
    source: string
  }> = []

  for (const [key, track] of needValence) {
    // Exact match
    const exact = csvIndex.get(key)
    if (exact) {
      cacheRows.push({
        title: track.title,
        artist: track.artist,
        valence: Math.round(exact.valence * 10000) / 10000,
        spotify_id: exact.spotifyId || null,
        source: 'dataset',
      })
      exactMatch++
      continue
    }

    // Title-only fuzzy match
    const normTitle = key.split('|||')[0]
    const candidates = titleIndex.get(normTitle)
    if (candidates?.length) {
      // Pick first match (most popular version usually comes first in dataset)
      const best = candidates[0]
      cacheRows.push({
        title: track.title,
        artist: track.artist,
        valence: Math.round(best.valence * 10000) / 10000,
        spotify_id: best.spotifyId || null,
        source: 'dataset',
      })
      titleMatch++
      continue
    }

    noMatch++
  }

  console.log(`  Exact: ${exactMatch}, Title-only: ${titleMatch}, No match: ${noMatch}`)

  // 4. Upsert to valence_cache
  if (cacheRows.length > 0) {
    console.log(`\nUpserting ${cacheRows.length} rows to valence_cache...`)
    for (let i = 0; i < cacheRows.length; i += 100) {
      const chunk = cacheRows.slice(i, i + 100)
      const { error } = await supabase
        .from('valence_cache')
        .upsert(chunk, { onConflict: 'spotify_id', ignoreDuplicates: true })
      if (error) {
        // Fallback: insert one by one
        for (const row of chunk) {
          await supabase.from('valence_cache').insert(row).maybeSingle()
        }
      }
    }
    console.log('  ✓ valence_cache updated')
  }

  // 5. Update track_weekly with matched valence
  console.log('\nUpdating track_weekly valence...')
  let updated = 0
  for (const row of cacheRows) {
    const { error } = await supabase
      .from('track_weekly')
      .update({ valence: row.valence })
      .eq('title', row.title)
      .eq('artist', row.artist)
      .is('valence', null)

    if (!error) updated++
  }
  console.log(`  ✓ ${updated} tracks updated`)

  // 6. Recalculate BSI for weeks with updated valence
  console.log('\nRecalculating BSI...')
  const { data: weeks } = await supabase
    .from('track_weekly')
    .select('week_date')
    .not('valence', 'is', null)

  const uniqueWeeks = [...new Set(weeks?.map(w => w.week_date) ?? [])]

  for (const weekDate of uniqueWeeks) {
    const { data: tracks } = await supabase
      .from('track_weekly')
      .select('rank, valence')
      .eq('week_date', weekDate)
      .not('valence', 'is', null)

    if (!tracks?.length) continue

    let weightedSadness = 0
    let totalWeight = 0
    for (const t of tracks) {
      const w = 1 / t.rank
      weightedSadness += (1 - Number(t.valence)) * w
      totalWeight += w
    }

    const bsi = Math.round((weightedSadness / totalWeight) * 10000) / 100
    const avgValence = tracks.reduce((s, t) => s + Number(t.valence), 0) / tracks.length

    await supabase
      .from('bsi_weekly')
      .update({
        bsi_score: bsi,
        avg_valence: Math.round(avgValence * 10000) / 10000,
        track_count: tracks.length,
      })
      .eq('week_date', weekDate)
  }
  console.log(`  ✓ ${uniqueWeeks.length} weeks recalculated`)

  console.log('\n✓ Valence matching complete!')
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
