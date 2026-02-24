/**
 * Import valence data from Kaggle Spotify dataset CSV into valence_cache.
 *
 * Usage:
 *   npx tsx scripts/import-valence.ts data/tracks_features.csv
 *
 * Expected CSV columns: id, name, album, album_id, artists, artist_ids, track_number,
 *   disc_number, explicit, danceability, energy, key, loudness, mode, speechiness,
 *   acousticness, instrumentalness, liveness, valence, tempo, duration_ms, time_signature
 *
 * Also supports simpler CSVs with columns: name/track_name, artists/artist_name, valence
 */

import { createClient } from '@supabase/supabase-js'
import { createReadStream } from 'fs'
import { createInterface } from 'readline'
import { config } from 'dotenv'
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

const csvPath = process.argv[2]
if (!csvPath) {
  console.error('Usage: npx tsx scripts/import-valence.ts <path-to-csv>')
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
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
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

async function main() {
  console.log(`=== Valence Import ===`)
  console.log(`File: ${csvPath}\n`)

  const stream = createReadStream(csvPath, { encoding: 'utf-8' })
  const rl = createInterface({ input: stream, crlfDelay: Infinity })

  let headers: string[] = []
  let nameIdx = -1
  let artistIdx = -1
  let valenceIdx = -1
  let spotifyIdIdx = -1

  let batch: Array<{
    title: string
    artist: string
    valence: number
    spotify_id: string | null
    source: string
  }> = []
  let totalRows = 0
  let imported = 0
  let skipped = 0
  let lineNum = 0

  for await (const line of rl) {
    lineNum++

    // Parse header
    if (lineNum === 1) {
      headers = parseCSVLine(line).map((h) => h.toLowerCase().replace(/['"]/g, ''))
      nameIdx = headers.findIndex((h) => h === 'name' || h === 'track_name' || h === 'song')
      artistIdx = headers.findIndex((h) => h === 'artists' || h === 'artist_name' || h === 'artist')
      valenceIdx = headers.findIndex((h) => h === 'valence')
      spotifyIdIdx = headers.findIndex((h) => h === 'id' || h === 'track_id' || h === 'spotify_id')

      if (nameIdx === -1 || artistIdx === -1 || valenceIdx === -1) {
        console.error('Could not find required columns (name, artist, valence)')
        console.error('Found headers:', headers.join(', '))
        process.exit(1)
      }

      console.log(`Columns: name=${headers[nameIdx]}, artist=${headers[artistIdx]}, valence=${headers[valenceIdx]}`)
      if (spotifyIdIdx !== -1) console.log(`  spotify_id=${headers[spotifyIdIdx]}`)
      console.log('')
      continue
    }

    const cols = parseCSVLine(line)
    const title = cols[nameIdx]?.replace(/^["']|["']$/g, '')
    let artist = cols[artistIdx]?.replace(/^["']|["']$/g, '')
    const valenceStr = cols[valenceIdx]
    const spotifyId = spotifyIdIdx !== -1 ? cols[spotifyIdIdx]?.replace(/^["']|["']$/g, '') : null

    if (!title || !artist || !valenceStr) {
      skipped++
      continue
    }

    const valence = parseFloat(valenceStr)
    if (isNaN(valence) || valence < 0 || valence > 1) {
      skipped++
      continue
    }

    // Clean artist: remove brackets like ['Artist1', 'Artist2'] → Artist1, Artist2
    if (artist.startsWith('[')) {
      artist = artist
        .replace(/^\[|\]$/g, '')
        .replace(/'/g, '')
        .split(',')
        .map((a) => a.trim())
        .join(', ')
    }

    batch.push({
      title,
      artist,
      valence: Math.round(valence * 10000) / 10000,
      spotify_id: spotifyId || null,
      source: 'dataset',
    })

    totalRows++

    // Upsert in batches of 500
    if (batch.length >= 500) {
      const { error } = await supabase
        .from('valence_cache')
        .upsert(batch, {
          onConflict: 'spotify_id',
          ignoreDuplicates: true,
        })

      if (error) {
        // If spotify_id conflict fails, try without it
        const withoutId = batch.map(({ spotify_id, ...rest }) => rest)
        // Insert ignoring duplicates on title+artist
        for (const row of withoutId) {
          await supabase.from('valence_cache').insert(row).select().maybeSingle()
        }
      }

      imported += batch.length
      batch = []

      if (imported % 10000 === 0) {
        console.log(`  ${imported.toLocaleString()} rows imported...`)
      }
    }
  }

  // Final batch
  if (batch.length > 0) {
    const { error } = await supabase
      .from('valence_cache')
      .upsert(batch, {
        onConflict: 'spotify_id',
        ignoreDuplicates: true,
      })
    if (error) {
      for (const row of batch) {
        await supabase.from('valence_cache').insert(row).select().maybeSingle()
      }
    }
    imported += batch.length
  }

  console.log(`\n✓ Import complete!`)
  console.log(`  Total rows: ${totalRows.toLocaleString()}`)
  console.log(`  Imported: ${imported.toLocaleString()}`)
  console.log(`  Skipped: ${skipped.toLocaleString()}`)
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
