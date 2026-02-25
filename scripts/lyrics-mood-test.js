// Test: Gemini 2.5 Flash lyrics mood analysis for valence correction

const GEMINI_API_KEY = 'AIzaSyCwq_MLsJ1xjUztS5fbwZ4pfisBMSK-zL8';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const testSongs = [
  { title: "Squabble Up", artist: "Kendrick Lamar", audioValence: 0.28, expected: "Happy" },
  { title: "luther", artist: "Kendrick Lamar", audioValence: 0.37, expected: "Happy" },
  { title: "Messy", artist: "Lola Young", audioValence: 0.48, expected: "Sad" },
  { title: "Birds of a Feather", artist: "Billie Eilish", audioValence: 0.41, expected: "Happy" },
  { title: "APT.", artist: "Rosé Bruno Mars", audioValence: 0.56, expected: "Happy" },
  { title: "Die With A Smile", artist: "Lady Gaga Bruno Mars", audioValence: 0.49, expected: "Sad" },
  { title: "Not Like Us", artist: "Kendrick Lamar", audioValence: 0.63, expected: "Happy" },
];

async function fetchLyrics(artist, title) {
  // Try multiple sources
  const cleanArtist = artist.replace(/ ft\..*| feat\..*| &.*/i, '').trim();
  const cleanTitle = title.replace(/[.]/g, '').trim();

  // 1. lyrics.ovh
  try {
    const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(cleanArtist)}/${encodeURIComponent(cleanTitle)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      const data = await res.json();
      if (data.lyrics && data.lyrics.length > 50) return data.lyrics.slice(0, 2000);
    }
  } catch (e) {}

  // 2. lrclib.net
  try {
    const url = `https://lrclib.net/api/search?artist_name=${encodeURIComponent(cleanArtist)}&track_name=${encodeURIComponent(cleanTitle)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      const data = await res.json();
      if (data[0]?.plainLyrics) return data[0].plainLyrics.slice(0, 2000);
    }
  } catch (e) {}

  // 3. Genius (search + scrape)
  try {
    const query = `${artist} ${title}`;
    const searchRes = await fetch(
      `https://genius.com/api/search/song?q=${encodeURIComponent(query)}&per_page=5`,
      { signal: AbortSignal.timeout(8000) }
    );
    const searchData = await searchRes.json();
    const hits = searchData.response?.sections?.[0]?.hits || [];

    const artistLower = artist.toLowerCase().replace(/[^a-z0-9 ]/g, '');
    const titleLower = cleanTitle.toLowerCase().replace(/[^a-z0-9 ]/g, '');

    let geniusUrl = null;
    for (const hit of hits) {
      const r = hit.result;
      const rArtist = (r.primary_artist?.name || '').toLowerCase().replace(/[^a-z0-9 ]/g, '');
      const rTitle = (r.title || '').toLowerCase().replace(/[^a-z0-9 ]/g, '');
      const artistWords = artistLower.split(/\s+/);
      const artistMatch = artistWords.some(w => w.length > 2 && rArtist.includes(w));
      const titleMatch = rTitle.includes(titleLower) || titleLower.includes(rTitle);
      if (artistMatch && titleMatch) { geniusUrl = r.url; break; }
    }

    if (geniusUrl) {
      const pageRes = await fetch(geniusUrl, {
        signal: AbortSignal.timeout(10000),
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });
      const html = await pageRes.text();
      const regex = /data-lyrics-container="true"[^>]*>([\s\S]*?)<\/div>/g;
      let lyrics = '';
      let m;
      while ((m = regex.exec(html)) !== null) {
        let chunk = m[1]
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<[^>]+>/g, '')
          .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
          .replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"');
        lyrics += chunk + '\n';
      }
      lyrics = lyrics.replace(/\n{3,}/g, '\n\n').trim();
      if (lyrics.length > 50) return lyrics.slice(0, 2000);
    }
  } catch (e) {}

  return null;
}

async function analyzeMood(title, artist, lyrics) {
  const lyricsSection = lyrics
    ? `Here are the lyrics:\n\n${lyrics}\n\n`
    : '';

  const prompt = `Song: "${title}" by ${artist}

${lyricsSection}You are a music mood analyst. Rate the EMOTIONAL MOOD of this song on a 0-100 scale.
Focus on: how the song ACTUALLY FEELS to listeners, not just the lyrics' literal meaning.
A hype rap brag track with aggressive energy = Happy/Euphoric, NOT sad.
A slow melancholic ballad about heartbreak = Sad, even if the melody is pretty.

Scale:
0-20 = Very sad/dark/depressive/grief
20-40 = Sad/melancholic/lonely/anxious/angry-hurt
40-60 = Neutral/mixed/ambiguous
60-80 = Happy/upbeat/confident/fun/empowering
80-100 = Euphoric/celebratory/pure joy/party

Return ONLY valid JSON:
{"mood_score": 75, "mood_label": "Happy", "reason": "one sentence"}`;

  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 300,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            mood_score: { type: "integer" },
            mood_label: { type: "string" },
            reason: { type: "string" }
          },
          required: ["mood_score", "mood_label", "reason"]
        },
        thinkingConfig: { thinkingBudget: 0 }
      }
    })
  });

  const data = await res.json();
  if (data.error) {
    console.log('  [Gemini error]', data.error.message);
    return { mood_score: 50, mood_label: "Neutral", reason: "API error" };
  }

  // Handle thinking models - collect all text parts
  const parts = data.candidates?.[0]?.content?.parts || [];
  let allText = '';
  for (const part of parts) {
    if (part.text) allText += part.text + '\n';
  }

  // Try direct parse
  try { return JSON.parse(allText.trim()); } catch(e) {}

  // Extract JSON from anywhere in text
  const jsonMatch = allText.match(/\{\s*"mood_score"\s*:\s*(\d+)\s*,\s*"mood_label"\s*:\s*"([^"]+)"\s*,\s*"reason"\s*:\s*"([^"]+)"\s*\}/);
  if (jsonMatch) {
    return { mood_score: parseInt(jsonMatch[1]), mood_label: jsonMatch[2], reason: jsonMatch[3] };
  }

  // Fallback: just find mood_score number
  const scoreMatch = allText.match(/"mood_score"\s*:\s*(\d+)/);
  if (scoreMatch) {
    const score = parseInt(scoreMatch[1]);
    const labelMatch = allText.match(/"mood_label"\s*:\s*"([^"]+)"/);
    const reasonMatch = allText.match(/"reason"\s*:\s*"([^"]+)"/);
    return { mood_score: score, mood_label: labelMatch?.[1] || "Unknown", reason: reasonMatch?.[1] || "extracted" };
  }

  console.log('  [Parse debug]', allText.slice(0, 300));
  return { mood_score: 50, mood_label: "Neutral", reason: "Parse failed" };
}

function correctValence(audioValence, moodScore) {
  // Audio 30% + Lyrics Mood 70%
  return Math.round((audioValence * 100) * 0.3 + moodScore * 0.7);
}

function classify(score) {
  if (score >= 50) return "Happy";
  if (score >= 40) return "Neutral";
  return "Sad";
}

async function main() {
  console.log("=== Gemini 2.5 Flash Lyrics Mood Test ===\n");

  let correct = 0;
  for (const song of testSongs) {
    process.stdout.write(`${song.title} — ${song.artist}... `);

    const lyrics = await fetchLyrics(song.artist, song.title);
    console.log(lyrics ? `(lyrics: ${lyrics.length} chars)` : '(no lyrics, knowledge only)');

    const mood = await analyzeMood(song.title, song.artist, lyrics);
    const corrected = correctValence(song.audioValence, mood.mood_score);
    const audioClass = classify(Math.round(song.audioValence * 100));
    const correctedClass = classify(corrected);
    const match = correctedClass === song.expected;
    if (match) correct++;

    console.log(`  Audio:     ${Math.round(song.audioValence * 100)} → ${audioClass}`);
    console.log(`  Gemini:    ${mood.mood_score} (${mood.mood_label}) — "${mood.reason}"`);
    console.log(`  Corrected: ${corrected} → ${correctedClass}`);
    console.log(`  Expected:  ${song.expected} ${match ? '✅' : '❌'}`);
    console.log();

    // Rate limit
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`=== Result: ${correct}/${testSongs.length} correct ===`);
}

main().catch(console.error);
