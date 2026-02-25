import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf-8')
for (const line of env.split('\n')) {
  const [key,...vals] = line.split('=')
  if (key && !key.startsWith('#') && key.trim()) process.env[key.trim()] = vals.join('=').trim()
}
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const { count: cacheCount } = await sb.from('valence_cache').select('*', { count: 'exact', head: true })
console.log('valence_cache entries:', cacheCount)

let allTracks = [], page = 0
while (true) {
  const { data } = await sb.from('track_weekly').select('title, artist').range(page*1000, (page+1)*1000-1)
  if (!data || data.length === 0) break
  allTracks = allTracks.concat(data)
  page++
}
const unique = new Set(allTracks.map(t => `${t.title}|||${t.artist}`))
console.log('track_weekly unique songs:', unique.size)

let allCache = []
page = 0
while (true) {
  const { data } = await sb.from('valence_cache').select('title, artist').range(page*1000, (page+1)*1000-1)
  if (!data || data.length === 0) break
  allCache = allCache.concat(data)
  page++
}
const cachedSet = new Set(allCache.map(c => `${c.title}|||${c.artist}`))
let matched = 0
for (const key of unique) { if (cachedSet.has(key)) matched++ }
console.log('Already cached:', matched)
console.log('Need Gemini:', unique.size - matched)
console.log('ETA:', Math.round((unique.size - matched) * 4.5 / 60), 'minutes')
