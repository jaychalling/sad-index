// Test improved Gemini prompt with forced distribution
const GEMINI_API_KEY = 'AIzaSyCwq_MLsJ1xjUztS5fbwZ4pfisBMSK-zL8'
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

const songs = [
  { title: "DTMF", artist: "Bad Bunny" },           // party reggaeton → should be high
  { title: "Choosin' Texas", artist: "Ella Langley" }, // sad country → should be low
  { title: "Golden", artist: "HUNTR/X" },             // upbeat → should be high
  { title: "I Just Might", artist: "Bruno Mars" },     // fun/flirty → should be high
  { title: "The Great Divide", artist: "Noah Kahan" }, // melancholic → should be low
  { title: "Folded", artist: "Kehlani" },              // sad R&B → should be low
  { title: "Back To Friends", artist: "sombr" },       // sad → should be low
  { title: "Man I Need", artist: "Olivia Dean" },      // feel-good → should be medium-high
  { title: "Messy", artist: "Lola Young" },            // bitter/angry → should be low
  { title: "EOO", artist: "Bad Bunny" },               // party → should be high
]

async function analyze(title, artist) {
  const prompt = `Song: "${title}" by ${artist}

Rate this song's EMOTIONAL VALENCE (how happy/sad it makes listeners feel) on a 0-100 scale.

IMPORTANT CALIBRATION:
- 0-15: Devastating grief, funeral music (e.g., "Hurt" Johnny Cash, "Mad World")
- 15-30: Clearly sad, heartbreak, melancholy (e.g., "Someone Like You" Adele, "Skinny Love")
- 30-45: Bittersweet, wistful, nostalgic-sad (e.g., "Yellow" Coldplay, "Heather" Conan Gray)
- 45-55: Truly neutral/ambiguous mood
- 55-70: Pleasant, warm, feel-good (e.g., "Golden Hour" JVKE, "Sunflower" Post Malone)
- 70-85: Clearly happy, fun, energetic (e.g., "Shake It Off" Taylor Swift, "Uptown Funk")
- 85-100: Pure euphoria, peak party energy (e.g., "Happy" Pharrell, "Can't Stop the Feeling")

DO NOT cluster everything at 70-80. Use the FULL range. Most songs should NOT score above 70.
A typical pop song is around 50-60, not 75.`

  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 300,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            valence_score: { type: 'integer' },
            category: { type: 'string' },
            reason: { type: 'string' }
          },
          required: ['valence_score', 'category', 'reason']
        },
        thinkingConfig: { thinkingBudget: 0 }
      }
    })
  })
  const data = await res.json()
  if (data.error) return { valence_score: -1, reason: data.error.message }
  const text = data.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || ''
  try { return JSON.parse(text.trim()) } catch(e) { return { valence_score: -1, reason: text.slice(0,100) } }
}

async function main() {
  console.log('=== Improved Prompt Test ===\n')
  for (const s of songs) {
    const r = await analyze(s.title, s.artist)
    console.log(`${s.title.padEnd(25)} ${String(r.valence_score).padStart(3)} | ${(r.category||'').padEnd(10)} | ${r.reason}`)
    await new Promise(r => setTimeout(r, 4200))
  }
}

main().catch(console.error)
