// Compare Kaggle Spotify valence vs Gemini valence for same songs
const GEMINI_API_KEY = 'AIzaSyCwq_MLsJ1xjUztS5fbwZ4pfisBMSK-zL8'
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

const songs = [
  { title: "Shape of You", artist: "Ed Sheeran", kaggle: 93 },
  { title: "Rolling in the Deep", artist: "Adele", kaggle: 52 },
  { title: "Old Town Road", artist: "Lil Nas X", kaggle: 51 },
  { title: "Someone Like You", artist: "Adele", kaggle: 28 },
  { title: "bad guy", artist: "Billie Eilish", kaggle: 65 },
]

async function fetchLyrics(artist, title) {
  try {
    const url = `https://lrclib.net/api/search?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (res.ok) {
      const data = await res.json()
      if (data[0]?.plainLyrics) return data[0].plainLyrics.slice(0, 2000)
    }
  } catch (e) {}
  return null
}

async function geminiValence(title, artist, lyrics) {
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
        temperature: 0.1, maxOutputTokens: 200,
        responseMimeType: 'application/json',
        responseSchema: { type: 'object', properties: { valence: { type: 'integer' }, reason: { type: 'string' } }, required: ['valence', 'reason'] },
        thinkingConfig: { thinkingBudget: 0 }
      }
    })
  })
  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || ''
  try { return JSON.parse(text.trim()) } catch(e) { return { valence: -1, reason: 'parse error' } }
}

async function main() {
  console.log('=== Kaggle(Spotify) vs Gemini Comparison ===\n')
  console.log('Song'.padEnd(30), 'Kaggle', 'Gemini', 'Diff', '  Reason')
  console.log('-'.repeat(90))

  for (const s of songs) {
    const lyrics = await fetchLyrics(s.artist, s.title)
    const g = await geminiValence(s.title, s.artist, lyrics)
    const diff = g.valence - s.kaggle
    const sign = diff >= 0 ? '+' : ''
    console.log(
      `${s.title} (${s.artist})`.padEnd(30),
      String(s.kaggle).padStart(4),
      String(g.valence).padStart(5),
      `${sign}${diff}`.padStart(5),
      ` ${g.reason?.slice(0, 60)}`
    )
    await new Promise(r => setTimeout(r, 4200))
  }
}

main().catch(console.error)
