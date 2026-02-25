// BSI vs Economic Indicators Correlation Analysis
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf-8')
for (const line of env.split('\n')) {
  const [key, ...vals] = line.split('=')
  if (key && !key.startsWith('#') && key.trim()) process.env[key.trim()] = vals.join('=').trim()
}
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function paginate(table, select, filters = {}, orderBy) {
  const all = []
  let from = 0
  while (true) {
    let q = sb.from(table).select(select).order(orderBy, { ascending: true }).range(from, from + 999)
    for (const [k, v] of Object.entries(filters)) q = q.eq(k, v)
    const { data } = await q
    if (!data || data.length === 0) break
    all.push(...data)
    from += 1000
  }
  return all
}

// Pearson correlation
function pearson(x, y) {
  const n = x.length
  if (n < 10) return { r: 0, n }
  const mx = x.reduce((a, b) => a + b, 0) / n
  const my = y.reduce((a, b) => a + b, 0) / n
  let num = 0, dx2 = 0, dy2 = 0
  for (let i = 0; i < n; i++) {
    const dx = x[i] - mx, dy = y[i] - my
    num += dx * dy
    dx2 += dx * dx
    dy2 += dy * dy
  }
  const den = Math.sqrt(dx2 * dy2)
  return { r: den === 0 ? 0 : num / den, n }
}

async function main() {
  console.log('=== BSI vs Economic Indicators: Correlation Analysis ===\n')

  // Load BSI (monthly sampling for alignment)
  const bsiAll = await paginate('bsi_weekly', 'week_date, bsi_score', {}, 'week_date')
  const bsiMonthly = new Map()
  for (const b of bsiAll) {
    const ym = b.week_date.slice(0, 7)
    if (!bsiMonthly.has(ym)) bsiMonthly.set(ym, Number(b.bsi_score))
  }
  console.log(`BSI: ${bsiMonthly.size} months (${bsiAll[0]?.week_date} ~ ${bsiAll[bsiAll.length-1]?.week_date})`)

  // Load all economic indicators
  const indicators = ['SP500', 'VIX', 'UNRATE', 'UMCSENT']
  const econData = {}
  for (const ind of indicators) {
    const rows = await paginate('economic_data', 'date, value', { indicator: ind }, 'date')
    const monthly = new Map()
    for (const r of rows) {
      const ym = r.date.slice(0, 7)
      monthly.set(ym, Number(r.value)) // last value per month
    }
    econData[ind] = monthly
    console.log(`${ind}: ${monthly.size} months`)
  }

  console.log('\n--- Direct Correlation (same month) ---\n')

  for (const ind of indicators) {
    const econ = econData[ind]
    const bsiVals = [], econVals = []
    for (const [ym, bsi] of bsiMonthly) {
      const ev = econ.get(ym)
      if (ev != null) { bsiVals.push(bsi); econVals.push(ev) }
    }
    const { r, n } = pearson(bsiVals, econVals)
    console.log(`BSI vs ${ind.padEnd(8)} | r = ${r.toFixed(4).padStart(8)} | n = ${n} | ${Math.abs(r) > 0.3 ? '★' : ' '} ${r > 0 ? 'positive' : 'negative'}`)
  }

  // Lagged correlations (BSI leads or lags economic indicators by 1-6 months)
  console.log('\n--- Lagged Correlations (BSI leads/lags by N months) ---\n')
  console.log('Positive lag = BSI leads (predictive), Negative lag = BSI lags (reactive)\n')

  function getMonthOffset(ym, offset) {
    const [y, m] = ym.split('-').map(Number)
    const d = new Date(y, m - 1 + offset, 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }

  for (const ind of indicators) {
    const econ = econData[ind]
    let bestR = 0, bestLag = 0, bestN = 0
    const results = []

    for (let lag = -6; lag <= 6; lag++) {
      const bsiVals = [], econVals = []
      for (const [ym, bsi] of bsiMonthly) {
        const targetYM = getMonthOffset(ym, lag)
        const ev = econ.get(targetYM)
        if (ev != null) { bsiVals.push(bsi); econVals.push(ev) }
      }
      const { r, n } = pearson(bsiVals, econVals)
      results.push({ lag, r, n })
      if (Math.abs(r) > Math.abs(bestR)) { bestR = r; bestLag = lag; bestN = n }
    }

    console.log(`${ind}:`)
    const lagStr = results.map(l => `  lag ${l.lag >= 0 ? '+' : ''}${l.lag}: r=${l.r.toFixed(4).padStart(8)} (n=${l.n})`).join('\n')
    console.log(lagStr)
    console.log(`  → Best: lag ${bestLag >= 0 ? '+' : ''}${bestLag}, r = ${bestR.toFixed(4)} ${Math.abs(bestR) > 0.3 ? '★★★' : Math.abs(bestR) > 0.2 ? '★★' : '★'}\n`)
  }

  // Year-over-year change correlation
  console.log('\n--- YoY Change Correlation ---\n')
  console.log('Does BSI CHANGE predict economic indicator CHANGE?\n')

  for (const ind of indicators) {
    const econ = econData[ind]

    for (let lag = 0; lag <= 3; lag++) {
      const bsiChanges = [], econChanges = []
      const months = Array.from(bsiMonthly.keys()).sort()

      for (let i = 12; i < months.length; i++) {
        const ym = months[i]
        const ymPrev = months[i - 12]
        const bsiNow = bsiMonthly.get(ym)
        const bsiPrev = bsiMonthly.get(ymPrev)
        if (bsiNow == null || bsiPrev == null) continue

        const targetYM = getMonthOffset(ym, lag)
        const targetPrevYM = getMonthOffset(ymPrev, lag)
        const econNow = econ.get(targetYM)
        const econPrev = econ.get(targetPrevYM)
        if (econNow == null || econPrev == null) continue

        bsiChanges.push(bsiNow - bsiPrev)
        econChanges.push(econNow - econPrev)
      }
      const { r, n } = pearson(bsiChanges, econChanges)
      if (lag === 0 || Math.abs(r) > 0.15) {
        console.log(`  ΔBSI vs Δ${ind.padEnd(8)} (lag +${lag}m) | r = ${r.toFixed(4).padStart(8)} | n = ${n}`)
      }
    }
  }

  // Inverted BSI (100-BSI = "brightness") correlations
  console.log('\n--- Inverted BSI (Brightness = 100-BSI) vs Indicators ---\n')

  for (const ind of indicators) {
    const econ = econData[ind]
    let bestR = 0, bestLag = 0

    for (let lag = -3; lag <= 6; lag++) {
      const bVals = [], eVals = []
      for (const [ym, bsi] of bsiMonthly) {
        const targetYM = getMonthOffset(ym, lag)
        const ev = econ.get(targetYM)
        if (ev != null) { bVals.push(100 - bsi); eVals.push(ev) }
      }
      const { r } = pearson(bVals, eVals)
      if (Math.abs(r) > Math.abs(bestR)) { bestR = r; bestLag = lag }
    }
    console.log(`Brightness vs ${ind.padEnd(8)} | best r = ${bestR.toFixed(4).padStart(8)} at lag ${bestLag >= 0 ? '+' : ''}${bestLag}m | ${Math.abs(bestR) > 0.3 ? '★★★' : Math.abs(bestR) > 0.2 ? '★★' : '★'}`)
  }

  console.log('\n=== Done ===')
}

main().catch(console.error)
