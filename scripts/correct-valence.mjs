// Correct valence scores using Gemini 2.5 Flash lyrics mood analysis
// Formula: corrected = audioValence * 0.3 + geminiMoodScore * 0.7
// Sources: lyrics.ovh → lrclib.net → Genius scrape

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

const GEMINI_API_KEY = 'AIzaSyCwq_MLsJ1xjUztS5fbwZ4pfisBMSK-zL8'
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

// ─── Lyrics Fetcher (3 sources) ──────────────────────────────────────
async function fetchLyrics(artist, title) {
  const cleanArtist = artist.replace(/ ft\..*| feat\..*| &.*/i, '').trim()
  const cleanTitle = title.replace(/[.]/g, '').trim()

  // 1. lyrics.ovh
  try {
    const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(cleanArtist)}/${encodeURIComponent(cleanTitle)}`
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (res.ok) {
      const data = await res.json()
      if (data.lyrics && data.lyrics.length > 50) return { lyrics: data.lyrics.slice(0, 2000), source: 'lyrics.ovh' }
    }
  } catch (e) {}

  // 2. lrclib.net
  try {
    const url = `https://lrclib.net/api/search?artist_name=${encodeURIComponent(cleanArtist)}&track_name=${encodeURIComponent(cleanTitle)}`
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (res.ok) {
      const data = await res.json()
      if (data[0]?.plainLyrics) return { lyrics: data[0].plainLyrics.slice(0, 2000), source: 'lrclib' }
    }
  } catch (e) {}

  // 3. Genius (search + scrape)
  try {
    const query = `${artist} ${title}`
    const searchRes = await fetch(
      `https://genius.com/api/search/song?q=${encodeURIComponent(query)}&per_page=5`,
      { signal: AbortSignal.timeout(8000) }
    )
    const searchData = await searchRes.json()
    const hits = searchData.response?.sections?.[0]?.hits || []

    const artistLower = artist.toLowerCase().replace(/[^a-z0-9 ]/g, '')
    const titleLower = cleanTitle.toLowerCase().replace(/[^a-z0-9 ]/g, '')

    let geniusUrl = null
    for (const hit of hits) {
      const r = hit.result
      const rArtist = (r.primary_artist?.name || '').toLowerCase().replace(/[^a-z0-9 ]/g, '')
      const rTitle = (r.title || '').toLowerCase().replace(/[^a-z0-9 ]/g, '')
      const artistWords = artistLower.split(/\s+/)
      const artistMatch = artistWords.some(w => w.length > 2 && rArtist.includes(w))
      const titleMatch = rTitle.includes(titleLower) || titleLower.includes(rTitle)
      if (artistMatch && titleMatch) { geniusUrl = r.url; break }
    }

    if (geniusUrl) {
      const pageRes = await fetch(geniusUrl, {
        signal: AbortSignal.timeout(10000),
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      })
      const html = await pageRes.text()
      const regex = /data-lyrics-container="true"[^>]*>([\s\S]*?)<\/div>/g
      let lyrics = ''
      let m
      while ((m = regex.exec(html)) !== null) {
        let chunk = m[1]
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<[^>]+>/g, '')
          .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
          .replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"')
        lyrics += chunk + '\n'
      }
      lyrics = lyrics.replace(/\n{3,}/g, '\n\n').trim()
      if (lyrics.length > 50) return { lyrics: lyrics.slice(0, 2000), source: 'genius' }
    }
  } catch (e) {}

  return { lyrics: null, source: 'none' }
}

// ─── Gemini Mood Analysis ────────────────────────────────────────────
async function analyzeMood(title, artist, lyrics) {
  const lyricsBlock = lyrics ? `\nLYRICS:\n${lyrics}\n` : ''

  const prompt = `Song: "${title}" by ${artist}
${lyricsBlock}
Rate this song's EMOTIONAL VALENCE on a 0-100 scale. This measures how HAPPY vs SAD the song makes listeners FEEL.

CALIBRATION (use these as anchors):
- 10: "Hurt" Johnny Cash — devastating grief
- 25: "Someone Like You" Adele — heartbreak, tears
- 35: "Heather" Conan Gray — longing, bittersweet sadness
- 50: "Yellow" Coldplay — warm but wistful, mixed emotions
- 60: "Sunflower" Post Malone — light, pleasant
- 75: "Shake It Off" Taylor Swift — clearly fun/happy
- 90: "Happy" Pharrell — pure euphoria

Rules:
- A typical pop song is 50-60
- Only high-energy party bangers get 70+
- If the lyrics express pain/loss/heartbreak, score below 45 regardless of tempo
- Reggaeton/latin party songs: 65-80 depending on energy
- Angry/confrontational energy ≠ happy (score 40-55)`

  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 200,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            valence: { type: 'integer' },
            reason: { type: 'string' }
          },
          required: ['valence', 'reason']
        },
        thinkingConfig: { thinkingBudget: 0 }
      }
    })
  })

  const data = await res.json()
  if (data.error) return null

  const parts = data.candidates?.[0]?.content?.parts || []
  let allText = ''
  for (const part of parts) {
    if (part.text) allText += part.text + '\n'
  }

  try { return JSON.parse(allText.trim()) } catch(e) {}
  const scoreMatch = allText.match(/"valence"\s*:\s*(\d+)/)
  if (scoreMatch) {
    const reasonMatch = allText.match(/"reason"\s*:\s*"([^"]+)"/)
    return { valence: parseInt(scoreMatch[1]), reason: reasonMatch?.[1] || '' }
  }
  return null
}

// ─── Main ────────────────────────────────────────────────────────────
async function main() {
  const weekDate = process.argv[2] // optional: specific week date

  // Get target tracks
  let query = supabase.from('track_weekly').select('*')
  if (weekDate) {
    query = query.eq('week_date', weekDate)
  } else {
    // Get latest week
    const { data: latest } = await supabase
      .from('track_weekly')
      .select('week_date')
      .order('week_date', { ascending: false })
      .limit(1)
    if (!latest?.length) { console.log('No tracks found'); return }
    query = query.eq('week_date', latest[0].week_date)
    console.log(`[Valence Correction] Week: ${latest[0].week_date}`)
  }

  const { data: tracks } = await query.order('rank')
  if (!tracks?.length) { console.log('No tracks found'); return }
  console.log(`  Tracks to process: ${tracks.length}`)

  let processed = 0, lyricsFound = 0, corrected = 0, errors = 0
  const results = []

  for (const track of tracks) {
    processed++
    const audioValence = track.valence

    // Fetch lyrics
    const { lyrics, source } = await fetchLyrics(track.artist, track.title)
    if (lyrics) lyricsFound++

    // Analyze mood with Gemini
    const mood = await analyzeMood(track.title, track.artist, lyrics)
    if (!mood) {
      errors++
      process.stdout.write(`  #${track.rank} ${track.title} — Gemini error, skipping\n`)
      continue
    }

    // Use Gemini valence directly (0-100 → 0-1)
    const newValence = mood.valence / 100

    // Update track_weekly
    const { error } = await supabase
      .from('track_weekly')
      .update({ valence: newValence })
      .eq('id', track.id)

    if (error) {
      errors++
      console.log(`  #${track.rank} DB error: ${error.message}`)
    } else {
      corrected++
      if (processed <= 20 || processed % 20 === 0) {
        console.log(`  #${track.rank} ${track.title} | ${mood.valence} (${source})`)
      }
    }

    results.push({ rank: track.rank, title: track.title, valence: mood.valence })

    // Rate limit: Gemini free tier ~ 15 RPM, so 4 seconds between calls
    await new Promise(r => setTimeout(r, 4200))
  }

  console.log(`\n  Processed: ${processed} | Lyrics found: ${lyricsFound} | Corrected: ${corrected} | Errors: ${errors}`)

  // Recalculate BSI with corrected valences
  const weekDateFinal = tracks[0].week_date
  const { data: updatedTracks } = await supabase
    .from('track_weekly')
    .select('rank, title, artist, valence')
    .eq('week_date', weekDateFinal)
    .order('rank')

  const withVal = updatedTracks.filter(t => t.valence !== null)
  if (withVal.length > 0) {
    let ws = 0, tw = 0
    for (const t of withVal) { const w = 1/t.rank; ws += (1 - t.valence) * w; tw += w }
    const bsi = Math.round((ws / tw) * 10000) / 100
    const avgValence = Math.round(withVal.reduce((s, t) => s + t.valence, 0) / withVal.length * 10000) / 10000

    const mostSad = withVal.reduce((a, b) => a.valence < b.valence ? a : b)
    const mostHappy = withVal.reduce((a, b) => a.valence > b.valence ? a : b)

    const { error } = await supabase.from('bsi_weekly').upsert({
      week_date: weekDateFinal,
      bsi_score: bsi,
      avg_valence: avgValence,
      track_count: withVal.length,
      most_sad_track: { title: mostSad.title, artist: mostSad.artist, valence: mostSad.valence, rank: mostSad.rank },
      most_happy_track: { title: mostHappy.title, artist: mostHappy.artist, valence: mostHappy.valence, rank: mostHappy.rank },
    }, { onConflict: 'week_date' })

    if (error) console.error(`  BSI update error: ${error.message}`)
    else console.log(`\n  BSI recalculated: ${bsi} | Avg Valence: ${avgValence}`)
  }

  console.log('\n[Valence Correction] Done')
}

main().catch(console.error)
