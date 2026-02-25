// Step 1: Parse historical Billboard CSV → load Top 30 tracks into track_weekly
// Source: HipsterVizNinja Hot 100 CSV (1990-2025)
// Only loads 2000-01-01+ and chart_position ≤ 30

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

// ─── CSV Parser (handles quoted fields) ─────────────────────────────
function parseCSVLine(line) {
  const fields = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++ // skip escaped quote
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  fields.push(current)
  return fields
}

// ─── Main ────────────────────────────────────────────────────────────
async function main() {
  const csvPath = new URL('./billboard-historical.csv', import.meta.url)
  const raw = readFileSync(csvPath, 'utf-8')
  const lines = raw.split('\n')
  console.log(`[Historical Billboard] Total CSV rows: ${lines.length - 1}`)

  // Parse: chart_position(0), chart_date(1), song(2), performer(3)
  const weekMap = new Map() // date → [{rank, title, artist}]

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue
    const cols = parseCSVLine(lines[i])
    const pos = parseInt(cols[0])
    const date = cols[1]
    const song = cols[2]
    const artist = cols[3]

    if (!date || date < '2000-01-01' || pos > 30 || !song) continue

    if (!weekMap.has(date)) weekMap.set(date, [])
    weekMap.get(date).push({ rank: pos, title: song, artist })
  }

  const weeks = [...weekMap.keys()].sort()
  console.log(`  Weeks to load: ${weeks.length} (${weeks[0]} to ${weeks[weeks.length - 1]})`)

  // Count unique songs
  const uniqueSongs = new Set()
  for (const tracks of weekMap.values()) {
    for (const t of tracks) uniqueSongs.add(`${t.title}|||${t.artist}`)
  }
  console.log(`  Unique songs (Top 30): ${uniqueSongs.size}`)

  // Check existing weeks in DB
  const { data: existingWeeks } = await supabase
    .from('track_weekly')
    .select('week_date')
    .gte('week_date', '2000-01-01')
  const existingSet = new Set((existingWeeks || []).map(w => w.week_date))
  const newWeeks = weeks.filter(w => !existingSet.has(w))
  console.log(`  Already in DB: ${existingSet.size} weeks, New: ${newWeeks.length} weeks`)

  if (newWeeks.length === 0) {
    console.log('  Nothing to load. All weeks already exist.')
    return
  }

  // Load in batches of 10 weeks
  let loaded = 0
  for (let w = 0; w < newWeeks.length; w += 10) {
    const batch = newWeeks.slice(w, w + 10)
    const rows = []
    for (const weekDate of batch) {
      const tracks = weekMap.get(weekDate) || []
      for (const t of tracks) {
        rows.push({
          week_date: weekDate,
          rank: t.rank,
          title: t.title,
          artist: t.artist,
          valence: null, // Will be filled by Gemini later
        })
      }
    }

    const { error } = await supabase
      .from('track_weekly')
      .upsert(rows, { onConflict: 'week_date,rank' })

    if (error) {
      console.error(`  Error at week ${batch[0]}: ${error.message}`)
    } else {
      loaded += batch.length
      if (loaded % 100 === 0 || w + 10 >= newWeeks.length) {
        console.log(`  Loaded ${loaded}/${newWeeks.length} weeks...`)
      }
    }
  }

  console.log(`\n[Historical Billboard] Done. Loaded ${loaded} weeks (Top 30 only).`)
}

main().catch(console.error)
