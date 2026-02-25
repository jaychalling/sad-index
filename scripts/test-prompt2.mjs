// Test: Gemini with lyrics vs without - focusing on problem songs
import { readFileSync } from 'fs'

const GEMINI_API_KEY = 'AIzaSyCwq_MLsJ1xjUztS5fbwZ4pfisBMSK-zL8'
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

async function fetchLyrics(artist, title) {
  const cleanArtist = artist.replace(/ ft\..*| feat\..*| &.*/i, '').trim()
  const cleanTitle = title.replace(/[.]/g, '').trim()
  try {
    const url = `https://lrclib.net/api/search?artist_name=${encodeURIComponent(cleanArtist)}&track_name=${encodeURIComponent(cleanTitle)}`
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (res.ok) {
      const data = await res.json()
      if (data[0]?.plainLyrics) return data[0].plainLyrics.slice(0, 2000)
    }
  } catch (e) {}
  return null
}

async function analyze(title, artist, lyrics) {
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
  if (data.error) return { valence: -1, reason: data.error.message }
  const text = data.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || ''
  try { return JSON.parse(text.trim()) } catch(e) { return { valence: -1, reason: text.slice(0,100) } }
}

const songs = [
  { title: "DTMF", artist: "Bad Bunny", expect: "65-75" },
  { title: "Choosin' Texas", artist: "Ella Langley", expect: "30-45" },
  { title: "Golden", artist: "HUNTR/X", expect: "60-70" },
  { title: "I Just Might", artist: "Bruno Mars", expect: "65-75" },
  { title: "The Great Divide", artist: "Noah Kahan", expect: "25-40" },
  { title: "Folded", artist: "Kehlani", expect: "25-40" },
  { title: "Messy", artist: "Lola Young", expect: "20-35" },
  { title: "EOO", artist: "Bad Bunny", expect: "70-85" },
  { title: "Man I Need", artist: "Olivia Dean", expect: "55-65" },
  { title: "Back To Friends", artist: "sombr", expect: "25-40" },
]

async function main() {
  console.log('=== Prompt v2: With lyrics + better calibration ===\n')
  for (const s of songs) {
    const lyrics = await fetchLyrics(s.artist, s.title)
    const r = await analyze(s.title, s.artist, lyrics)
    const lyrTag = lyrics ? '📝' : '🔇'
    console.log(`${lyrTag} ${s.title.padEnd(22)} ${String(r.valence).padStart(3)} (expect ${s.expect}) | ${r.reason?.slice(0,80)}`)
    await new Promise(r => setTimeout(r, 4200))
  }
}

main().catch(console.error)
