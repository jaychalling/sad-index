import { supabase } from './supabase'
import type { Database } from '@/types/database'
import type {
  BsiDataPoint,
  Sp500DataPoint,
  Track,
  CurrentWeek,
  EconomicIndicators,
} from '@/data/bsi-data'

type BsiRow = Database['public']['Tables']['bsi_weekly']['Row']
type EconRow = Database['public']['Tables']['economic_data']['Row']
type TrackRow = Database['public']['Tables']['track_weekly']['Row']

// ─── Latest BSI + Economic Indicators (Home page) ─────────────────────────

export async function getLatestBsi(): Promise<CurrentWeek> {
  const { data: bsiRows } = await supabase
    .from('bsi_weekly')
    .select('*')
    .order('week_date', { ascending: false })
    .limit(2)

  const bsi = bsiRows as BsiRow[] | null
  const latest = bsi?.[0]
  const prev = bsi?.[1]

  const latestDate = latest?.week_date ?? ''
  const prevDate = prev?.week_date ?? ''

  const { data: econRows } = await supabase
    .from('economic_data')
    .select('*')
    .eq('date', latestDate)

  const econ = econRows as EconRow[] | null
  const econMap = new Map(econ?.map((e) => [e.indicator, Number(e.value ?? 0)]) ?? [])

  const { data: prevEconRows } = await supabase
    .from('economic_data')
    .select('*')
    .eq('date', prevDate)

  const prevEcon = prevEconRows as EconRow[] | null
  const prevEconMap = new Map(prevEcon?.map((e) => [e.indicator, Number(e.value ?? 0)]) ?? [])

  function calcChange(indicator: string): number {
    const curr = econMap.get(indicator) ?? 0
    const prevVal = prevEconMap.get(indicator)
    if (prevVal == null || prevVal === 0) return 0
    if (indicator === 'SP500') return Number(((curr - prevVal) / prevVal * 100).toFixed(1))
    return Number((curr - prevVal).toFixed(1))
  }

  const economicIndicators: EconomicIndicators = {
    sp500: { value: econMap.get('SP500') ?? 0, change: calcChange('SP500') },
    vix: { value: econMap.get('VIX') ?? 0, change: calcChange('VIX') },
    unemployment: { value: econMap.get('UNRATE') ?? 0, change: calcChange('UNRATE') },
    consumerSentiment: { value: econMap.get('UMCSENT') ?? 0, change: calcChange('UMCSENT') },
  }

  const bsiScore = Number(latest?.bsi_score ?? 0)
  const prevBsi = Number(prev?.bsi_score ?? 0)
  const sadTrack = latest?.most_sad_track as { title: string; artist: string; valence: number; rank: number } | null
  const happyTrack = latest?.most_happy_track as { title: string; artist: string; valence: number; rank: number } | null

  return {
    weekDate: latestDate,
    bsi: bsiScore,
    prevBsi: prevBsi,
    weeklyChange: Number((bsiScore - prevBsi).toFixed(1)),
    avgValence: Number(latest?.avg_valence ?? 0),
    trackCount: latest?.track_count ?? 100,
    mostSadTrack: sadTrack ?? { title: 'N/A', artist: 'N/A', valence: 0, rank: 0 },
    mostHappyTrack: happyTrack ?? { title: 'N/A', artist: 'N/A', valence: 1, rank: 0 },
    economicIndicators,
  }
}

// ─── BSI History + S&P 500 (Home page chart, History page) ────────────────

export async function getBsiHistory(): Promise<{
  bsiData: BsiDataPoint[]
  sp500Data: Sp500DataPoint[]
}> {
  const { data: bsiRows } = await supabase
    .from('bsi_weekly')
    .select('week_date, bsi_score, avg_valence')
    .order('week_date', { ascending: true })

  const { data: sp500Rows } = await supabase
    .from('economic_data')
    .select('date, value')
    .eq('indicator', 'SP500')
    .order('date', { ascending: true })

  const bsi = bsiRows as Pick<BsiRow, 'week_date' | 'bsi_score' | 'avg_valence'>[] | null
  const sp500 = sp500Rows as Pick<EconRow, 'date' | 'value'>[] | null

  return {
    bsiData: (bsi ?? []).map((d) => ({
      date: d.week_date,
      bsi: Number(d.bsi_score),
      avgValence: Number(d.avg_valence ?? 0),
    })),
    sp500Data: (sp500 ?? []).map((d) => ({
      date: d.date,
      value: Number(d.value ?? 0),
    })),
  }
}

// ─── This Week Tracks ─────────────────────────────────────────────────────

export async function getThisWeekTracks(): Promise<Track[]> {
  const { data: latestRows } = await supabase
    .from('bsi_weekly')
    .select('week_date')
    .order('week_date', { ascending: false })
    .limit(1)

  const latest = latestRows as Pick<BsiRow, 'week_date'>[] | null
  const weekDate = latest?.[0]?.week_date
  if (!weekDate) return []

  const { data: trackRows } = await supabase
    .from('track_weekly')
    .select('rank, title, artist, valence')
    .eq('week_date', weekDate)
    .order('rank', { ascending: true })

  const tracks = trackRows as Pick<TrackRow, 'rank' | 'title' | 'artist' | 'valence'>[] | null

  return (tracks ?? []).map((t) => ({
    rank: t.rank,
    title: t.title,
    artist: t.artist,
    valence: Number(t.valence ?? 0),
  }))
}
