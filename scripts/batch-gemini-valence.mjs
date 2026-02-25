// Step 2: Batch Gemini valence analysis for unique songs → valence_cache
// First tries to match from existing valence_cache (Kaggle data)
// Then runs Gemini for unmatched songs
// Resume-safe: checks cache before each song

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

// ─── Lyrics Fetcher (3 sources) ─────────────────────────────────────
async function fetchLyrics(artist, title) {
  const cleanArtist = artist.replace(/ ft\..*| feat\..*| &.*/i, '').trim()
  const cleanTitle = title.replace(/[.]/g, '').trim()

  try {
    const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(cleanArtist)}/${encodeURIComponent(cleanTitle)}`
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (res.ok) {
      const data = await res.json()
      if (data.lyrics && data.lyrics.length > 50) return data.lyrics.slice(0, 2000)
    }
  } catch (e) {}

  try {
    const url = `https://lrclib.net/api/search?artist_name=${encodeURIComponent(cleanArtist)}&track_name=${encodeURIComponent(cleanTitle)}`
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (res.ok) {
      const data = await res.json()
      if (data[0]?.plainLyrics) return data[0].plainLyrics.slice(0, 2000)
    }
  } catch (e) {}

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
      let lyrics = '', m
      while ((m = regex.exec(html)) !== null) {
        let chunk = m[1].replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')
          .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
          .replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"')
        lyrics += chunk + '\n'
      }
      lyrics = lyrics.replace(/\n{3,}/g, '\n\n').trim()
      if (lyrics.length > 50) return lyrics.slice(0, 2000)
    }
  } catch (e) {}

  return null
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
    signal: AbortSignal.timeout(30000),
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1, maxOutputTokens: 200,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: { valence: { type: 'integer' }, reason: { type: 'string' } },
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
  for (const part of parts) { if (part.text) allText += part.text + '\n' }
  try { return JSON.parse(allText.trim()) } catch(e) {}
  const scoreMatch = allText.match(/"valence"\s*:\s*(\d+)/)
  if (scoreMatch) {
    const reasonMatch = allText.match(/"reason"\s*:\s*"([^"]+)"/)
    return { valence: parseInt(scoreMatch[1]), reason: reasonMatch?.[1] || '' }
  }
  return null
}

// ─── Check cache for a single song ──────────────────────────────────
async function checkCache(title, artist) {
  const { data } = await supabase
    .from('valence_cache')
    .select('valence')
    .eq('title', title)
    .eq('artist', artist)
    .limit(1)
  if (data?.[0]?.valence != null) return Number(data[0].valence)

  // Fallback: title-only
  const { data: d2 } = await supabase
    .from('valence_cache')
    .select('valence')
    .eq('title', title)
    .limit(1)
  return d2?.[0]?.valence != null ? Number(d2[0].valence) : null
}

// ─── Main ────────────────────────────────────────────────────────────
async function main() {
  const startIdx = parseInt(process.argv[2]) || 0
  const limit = parseInt(process.argv[3]) || 0

  // Get all unique songs from track_weekly (paginated)
  console.log('[Batch Gemini] Fetching unique songs from track_weekly...')
  let allTracks = [], page = 0
  while (true) {
    const { data, error } = await supabase
      .from('track_weekly')
      .select('title, artist')
      .range(page * 1000, (page + 1) * 1000 - 1)
    if (error) { console.error(error.message); return }
    if (!data || data.length === 0) break
    allTracks = allTracks.concat(data)
    page++
  }

  // Deduplicate
  const songMap = new Map()
  for (const t of allTracks) {
    const key = `${t.title}|||${t.artist}`
    if (!songMap.has(key)) songMap.set(key, { title: t.title, artist: t.artist })
  }
  let songs = [...songMap.values()]
  console.log(`  Total unique songs: ${songs.length}`)

  // Apply offset/limit
  if (startIdx > 0) songs = songs.slice(startIdx)
  if (limit > 0) songs = songs.slice(0, limit)
  console.log(`  Processing: ${songs.length} songs (from index ${startIdx})`)

  let done = 0, cached = 0, geminiDone = 0, errors = 0
  const startTime = Date.now()

  for (const song of songs) {
    done++
    try {
      // Check cache first (fast DB lookup)
      const existing = await checkCache(song.title, song.artist)
      if (existing !== null) {
        cached++
        if (cached <= 5) console.log(`  [cache] ${song.title} → ${(existing * 100).toFixed(0)}`)
        continue
      }

      // Need Gemini analysis
      const lyrics = await fetchLyrics(song.artist, song.title)
      const mood = await analyzeMood(song.title, song.artist, lyrics)

      if (!mood || mood.valence < 0 || mood.valence > 100) {
        errors++
        if (errors <= 10) console.log(`  ✗ ${song.title} — ${song.artist} (Gemini error)`)
      } else {
        // Save to valence_cache
        const valNorm = mood.valence / 100
        const { error: dbErr } = await supabase
          .from('valence_cache')
          .upsert({
            title: song.title,
            artist: song.artist,
            valence: valNorm,
            source: 'gemini',
          }, { onConflict: 'title,artist' })

        if (dbErr) {
          await supabase.from('valence_cache').insert({
            title: song.title,
            artist: song.artist,
            valence: valNorm,
            source: 'gemini',
          })
        }
        geminiDone++

        if (geminiDone <= 20 || geminiDone % 50 === 0) {
          const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1)
          const remaining = ((songs.length - done) * 4.5 / 60).toFixed(0)
          console.log(`  [${done}/${songs.length}] ${song.title} → ${mood.valence} (${elapsed}m, ~${remaining}m left)`)
        }
      }

      // Rate limit
      await new Promise(r => setTimeout(r, 4200))
    } catch (err) {
      errors++
      if (errors <= 20) console.log(`  ✗ [${done}] ${song.title} — catch: ${err.message?.slice(0, 60)}`)
      await new Promise(r => setTimeout(r, 2000))
    }
  }

  const totalMin = ((Date.now() - startTime) / 1000 / 60).toFixed(1)
  console.log(`\n[Batch Gemini] Done in ${totalMin}m`)
  console.log(`  Total: ${done} | Cached: ${cached} | Gemini: ${geminiDone} | Errors: ${errors}`)
}

main().catch(console.error)
