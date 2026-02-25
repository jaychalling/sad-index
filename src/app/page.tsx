import type { Metadata } from 'next'
import { getLatestBsi, getBsiHistory, getThisWeekTracks, getHistoricalEventsWithBsi } from '@/lib/queries'
import Navbar from '@/components/Navbar'
import BsiGauge from '@/components/BsiGauge'
import MiniGauge from '@/components/MiniGauge'
import EconDashboard from '@/components/EconDashboard'
import WeekHighlight from '@/components/WeekHighlight'
import Newsletter from '@/components/Newsletter'
import Footer from '@/components/Footer'
import { Calendar, ArrowRight, TrendingUp, Activity, Users, Heart, Music } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
  },
}

const datasetSchema = {
  '@context': 'https://schema.org',
  '@type': 'Dataset',
  name: 'Billboard Sadness Index (BSI) Weekly Data',
  description: 'Weekly emotional valence index of Billboard Hot 100 songs from 2000 to present, tracking musical mood against economic indicators',
  url: 'https://sadindex.com',
  temporalCoverage: '2000/2026',
  variableMeasured: 'Billboard Sadness Index (BSI)',
  creator: { '@type': 'Organization', name: 'Sad Index' },
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getMoodLabel(bsi: number): { text: string; color: string } {
  if (bsi < 30) return { text: 'Happy', color: '#22c55e' }
  if (bsi < 50) return { text: 'Mixed', color: '#ffb703' }
  return { text: 'Sad', color: '#ef4444' }
}

function getMoodEmoji(bsi: number): string {
  if (bsi < 20) return '\u{1F60E}'
  if (bsi < 40) return '\u{1F60A}'
  if (bsi < 60) return '\u{1F610}'
  if (bsi < 80) return '\u{1F614}'
  return '\u{1F622}'
}

function getSignal(bsi: number) {
  if (bsi < 30) return {
    level: 'ESCAPISM',
    color: '#fb8500',
    description: 'Charts are unusually bright. In past recessions (2008, 2020), BSI dropped to the 20s as people sought escapist music.',
  }
  if (bsi < 45) return {
    level: 'ELEVATED',
    color: '#ffb703',
    description: 'Upbeat mood on the charts. Continued brightening could signal underlying economic stress.',
  }
  if (bsi < 55) return {
    level: 'NEUTRAL',
    color: '#219ebc',
    description: 'The charts reflect a normal emotional range. No unusual escapism or darkness detected.',
  }
  if (bsi < 70) return {
    level: 'REFLECTIVE',
    color: '#8ecae6',
    description: 'Sadder songs gaining traction — society is processing something. Often coincides with cultural reflection.',
  }
  return {
    level: 'SOMBER',
    color: '#ef4444',
    description: 'Rare state. Charts dominated by dark music. Usually tied to national tragedy or deep social crisis.',
  }
}

// ─── Derived Index Scores ────────────────────────────────────────────────

function vixToFear(vix: number): number {
  return Math.min(100, Math.max(0, (vix - 10) * 2.5))
}

function umcsentToGloom(umcsent: number): number {
  return Math.min(100, Math.max(0, 100 - umcsent))
}

function unrateToAnxiety(unrate: number): number {
  return Math.min(100, Math.max(0, (unrate - 2) * 7.7))
}

const fearSegments = [
  { min: 0, max: 20, label: 'Calm', color: '#22c55e' },
  { min: 20, max: 40, label: 'Normal', color: '#4ade80' },
  { min: 40, max: 60, label: 'Elevated', color: '#ffb703' },
  { min: 60, max: 80, label: 'High Fear', color: '#f87171' },
  { min: 80, max: 100, label: 'Extreme', color: '#ef4444' },
]

const gloomSegments = [
  { min: 0, max: 20, label: 'Optimistic', color: '#22c55e' },
  { min: 20, max: 40, label: 'Content', color: '#4ade80' },
  { min: 40, max: 60, label: 'Uncertain', color: '#ffb703' },
  { min: 60, max: 80, label: 'Pessimistic', color: '#f87171' },
  { min: 80, max: 100, label: 'Despair', color: '#ef4444' },
]

const anxietySegments = [
  { min: 0, max: 20, label: 'Strong Jobs', color: '#22c55e' },
  { min: 20, max: 40, label: 'Healthy', color: '#4ade80' },
  { min: 40, max: 60, label: 'Moderate', color: '#ffb703' },
  { min: 60, max: 80, label: 'Stressed', color: '#f87171' },
  { min: 80, max: 100, label: 'Crisis', color: '#ef4444' },
]

function formatWeekDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default async function Home() {
  const [currentWeekData, { bsiData: bsiWeeklyData, econData }, topTracksThisWeek, enrichedEvents] =
    await Promise.all([getLatestBsi(), getBsiHistory(), getThisWeekTracks(), getHistoricalEventsWithBsi()])

  const bsi = currentWeekData.bsi
  const mood = getMoodLabel(bsi)
  const signal = getSignal(bsi)
  const change = currentWeekData.weeklyChange
  const ind = currentWeekData.economicIndicators

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetSchema) }}
      />
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-10">

        {/* ═══ SECTION 1: Dashboard Hero ═══ */}
        <section className="grid md:grid-cols-5 gap-4">
          {/* BSI Main Display */}
          <div className="md:col-span-3 card-brutal !bg-navy text-white relative overflow-hidden">
            <div
              className="absolute top-2 right-4 text-[100px] font-extrabold opacity-[0.04] leading-none select-none pointer-events-none"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              BSI
            </div>
            <div className="relative">
              <p className="flex items-center gap-2 mb-4">
                <Music size={16} className="text-ocean" />
                <span className="text-xs font-bold uppercase tracking-widest text-ocean">
                  Billboard Sadness Index
                </span>
              </p>
              <div className="flex items-end gap-4 mb-3">
                <span
                  className="text-6xl md:text-7xl font-extrabold leading-none"
                  style={{ fontFamily: 'var(--font-poppins)' }}
                >
                  {bsi}
                </span>
                <div className="pb-2 flex items-center gap-2">
                  <span className="text-3xl">{getMoodEmoji(bsi)}</span>
                  <span
                    className="tag-brutal !border-white/30 text-sm"
                    style={{ backgroundColor: mood.color, color: mood.color === '#ffb703' ? '#023047' : '#fff' }}
                  >
                    {mood.text}
                  </span>
                </div>
              </div>
              <h1 className="text-lg font-bold text-white/90 mt-1 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                Is America Sad Right Now?
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className={change > 0 ? 'text-orange' : change < 0 ? 'text-happy' : 'text-white/60'}>
                  {change > 0 ? '\u25B2' : change < 0 ? '\u25BC' : '\u25CF'}{' '}
                  {change > 0 ? '+' : ''}{change.toFixed(1)} from last week
                </span>
                <span className="text-white/30">|</span>
                <span className="text-white/60">Week of {formatWeekDate(currentWeekData.weekDate)}</span>
              </div>
            </div>
          </div>

          {/* Recession Pop Signal */}
          <div className="md:col-span-2 card-brutal border-l-[6px] flex flex-col justify-between" style={{ borderLeftColor: signal.color }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Activity size={16} className="text-navy/60" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-navy/60">
                  Recession Pop Signal
                </span>
              </div>
              <span
                className="inline-block tag-brutal !text-xs font-extrabold mb-3"
                style={{ backgroundColor: signal.color, color: '#fff', borderColor: signal.color }}
              >
                {signal.level}
              </span>
              <p className="text-sm text-navy/70 leading-relaxed">
                {signal.description}
              </p>
            </div>
            <p className="text-[10px] text-navy/40 mt-4">
              Based on BSI correlation with VIX (r&nbsp;=&nbsp;&minus;0.47, 3-month lead)
            </p>
          </div>
        </section>

        {/* ═══ SECTION 2: Index Ticker Strip ═══ */}
        <section>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* BSI */}
            <div className="card-brutal !p-3 border-t-[4px] border-t-teal !shadow-[3px_3px_0_#023047]">
              <div className="flex items-center gap-1.5 mb-1">
                <Music size={14} className="text-teal" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-navy/60">BSI</span>
              </div>
              <div className="text-xl font-bold text-navy" style={{ fontFamily: 'var(--font-poppins)' }}>
                {bsi}
              </div>
              <div className={`text-xs font-semibold ${change > 0 ? 'text-orange' : change < 0 ? 'text-teal' : 'text-navy/50'}`}>
                {change > 0 ? '\u25B2' : change < 0 ? '\u25BC' : '\u25CF'} {Math.abs(change).toFixed(1)}
              </div>
            </div>

            {/* S&P 500 */}
            <div className="card-brutal !p-3 border-t-[4px] border-t-teal !shadow-[3px_3px_0_#023047]">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp size={14} className="text-teal" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-navy/60">S&P 500</span>
              </div>
              <div className="text-xl font-bold text-navy" style={{ fontFamily: 'var(--font-poppins)' }}>
                {ind.sp500.value.toLocaleString()}
              </div>
              <div className={`text-xs font-semibold ${ind.sp500.change >= 0 ? 'text-teal' : 'text-orange'}`}>
                {ind.sp500.change >= 0 ? '\u25B2' : '\u25BC'} {Math.abs(ind.sp500.change).toFixed(2)}%
              </div>
            </div>

            {/* VIX */}
            <div className="card-brutal !p-3 border-t-[4px] border-t-orange !shadow-[3px_3px_0_#023047]">
              <div className="flex items-center gap-1.5 mb-1">
                <Activity size={14} className="text-orange" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-navy/60">VIX</span>
                <span className="text-[8px] font-bold text-white bg-orange px-1 rounded">TOP r</span>
              </div>
              <div className="text-xl font-bold text-navy" style={{ fontFamily: 'var(--font-poppins)' }}>
                {ind.vix.value.toFixed(2)}
              </div>
              <div className={`text-xs font-semibold ${ind.vix.change <= 0 ? 'text-teal' : 'text-orange'}`}>
                {ind.vix.change >= 0 ? '\u25B2' : '\u25BC'} {Math.abs(ind.vix.change).toFixed(2)}
              </div>
            </div>

            {/* Unemployment */}
            <div className="card-brutal !p-3 border-t-[4px] border-t-amber !shadow-[3px_3px_0_#023047]">
              <div className="flex items-center gap-1.5 mb-1">
                <Users size={14} className="text-amber" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-navy/60">Unemployment</span>
              </div>
              <div className="text-xl font-bold text-navy" style={{ fontFamily: 'var(--font-poppins)' }}>
                {ind.unemployment.value.toFixed(1)}%
              </div>
              <div className={`text-xs font-semibold ${ind.unemployment.change <= 0 ? 'text-teal' : 'text-orange'}`}>
                {ind.unemployment.change >= 0 ? '\u25B2' : '\u25BC'} {Math.abs(ind.unemployment.change).toFixed(2)}%
              </div>
            </div>

            {/* Consumer Sentiment */}
            <div className="card-brutal !p-3 border-t-[4px] border-t-ocean !shadow-[3px_3px_0_#023047]">
              <div className="flex items-center gap-1.5 mb-1">
                <Heart size={14} className="text-ocean" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-navy/60">Sentiment</span>
              </div>
              <div className="text-xl font-bold text-navy" style={{ fontFamily: 'var(--font-poppins)' }}>
                {ind.consumerSentiment.value.toFixed(1)}
              </div>
              <div className={`text-xs font-semibold ${ind.consumerSentiment.change >= 0 ? 'text-teal' : 'text-orange'}`}>
                {ind.consumerSentiment.change >= 0 ? '\u25B2' : '\u25BC'} {Math.abs(ind.consumerSentiment.change).toFixed(2)}
              </div>
            </div>
          </div>
        </section>

        {/* ═══ SECTION 3: Vibe Dashboard — 4 Gauges ═══ */}
        <section>
          <h2
            className="text-xl font-bold text-navy mb-4"
            style={{ fontFamily: 'var(--font-poppins)' }}
          >
            The National Mood
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="md:col-span-2 lg:col-span-1">
              <MiniGauge
                value={bsi}
                prevValue={currentWeekData.prevBsi}
                title="Music Sadness"
                source="Billboard Hot 100 Valence"
                segments={[
                  { min: 0, max: 20, label: 'Euphoric', color: '#22c55e' },
                  { min: 20, max: 40, label: 'Happy', color: '#4ade80' },
                  { min: 40, max: 60, label: 'Mixed', color: '#ffb703' },
                  { min: 60, max: 80, label: 'Sad', color: '#f87171' },
                  { min: 80, max: 100, label: 'Very Sad', color: '#ef4444' },
                ]}
              />
            </div>
            <MiniGauge
              value={vixToFear(ind.vix.value)}
              prevValue={vixToFear(ind.vix.value - ind.vix.change)}
              title="Market Fear"
              source={`VIX: ${ind.vix.value.toFixed(1)}`}
              segments={fearSegments}
            />
            <MiniGauge
              value={umcsentToGloom(ind.consumerSentiment.value)}
              prevValue={umcsentToGloom(ind.consumerSentiment.value - ind.consumerSentiment.change)}
              title="Consumer Gloom"
              source={`UMCSENT: ${ind.consumerSentiment.value.toFixed(1)}`}
              segments={gloomSegments}
            />
            <MiniGauge
              value={unrateToAnxiety(ind.unemployment.value)}
              prevValue={unrateToAnxiety(ind.unemployment.value - ind.unemployment.change)}
              title="Job Anxiety"
              source={`Unemployment: ${ind.unemployment.value.toFixed(1)}%`}
              segments={anxietySegments}
            />
          </div>
        </section>

        {/* ═══ SECTION 4: BSI vs Economy (Interactive Chart) ═══ */}
        <EconDashboard
          indicators={ind}
          bsiData={bsiWeeklyData}
          econData={econData}
        />

        {/* ═══ SECTION 5: This Week's Mood ═══ */}
        <section>
          <WeekHighlight
            weekDate={currentWeekData.weekDate}
            mostSadTrack={currentWeekData.mostSadTrack}
            mostHappyTrack={currentWeekData.mostHappyTrack}
          />
        </section>

        {/* ═══ SECTION 6: Hot 100 Valence Snapshot ═══ */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-xl font-bold text-navy"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              Hot 100 Valence Snapshot
            </h2>
            <Link
              href="/this-week"
              className="btn-brutal bg-white text-navy text-sm flex items-center gap-1.5"
            >
              See All <ArrowRight size={14} />
            </Link>
          </div>
          <div className="card-brutal overflow-hidden !p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-ocean/20 border-b-[2px] border-navy">
                  <th className="text-left py-3 px-4 font-bold text-navy">#</th>
                  <th className="text-left py-3 px-4 font-bold text-navy">Track</th>
                  <th className="text-left py-3 px-4 font-bold text-navy hidden sm:table-cell">Artist</th>
                  <th className="text-right py-3 px-4 font-bold text-navy">Valence</th>
                </tr>
              </thead>
              <tbody>
                {topTracksThisWeek.slice(0, 10).map((track, idx) => (
                  <tr
                    key={track.rank}
                    className={`border-b border-navy/10 ${idx % 2 === 0 ? 'bg-white' : 'bg-ocean/5'}`}
                  >
                    <td className="py-2.5 px-4 font-bold text-navy/60">{track.rank}</td>
                    <td className="py-2.5 px-4">
                      <span className="font-semibold text-navy">{track.title}</span>
                      <span className="sm:hidden block text-xs text-navy/50">{track.artist}</span>
                    </td>
                    <td className="py-2.5 px-4 text-navy/60 hidden sm:table-cell">{track.artist}</td>
                    <td className="py-2.5 px-4 text-right">
                      <span
                        className="inline-block w-10 text-center font-bold rounded-md py-0.5 text-xs"
                        style={{
                          backgroundColor:
                            track.valence > 0.55
                              ? '#22c55e'
                              : track.valence >= 0.35
                                ? '#ffb703'
                                : '#ef4444',
                          color: track.valence > 0.55 || track.valence < 0.35 ? '#fff' : '#023047',
                          border: '2px solid #023047',
                        }}
                      >
                        {(track.valence * 100).toFixed(0)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ═══ SECTION 7: Historical Highlights ═══ */}
        <section>
          <h2
            className="text-xl font-bold text-navy mb-4"
            style={{ fontFamily: 'var(--font-poppins)' }}
          >
            Historical Highlights
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrichedEvents.filter(e => e.date >= '2000-01-01').map((event) => (
              <div
                key={event.date}
                className="card-brutal !p-4 flex items-start gap-3"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber/20 border-[2px] border-navy flex items-center justify-center">
                  <Calendar size={18} className="text-navy" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-navy/50">{event.date}</span>
                    {(() => {
                      const evtBsi = event.bsi ?? 0
                      const evtMood = getMoodLabel(evtBsi)
                      return (
                        <span className="tag-brutal !text-[10px] !px-2 !py-0 font-bold" style={{ backgroundColor: evtMood.color + '25', color: evtMood.color }}>
                          {evtMood.text} &middot; BSI {evtBsi}
                        </span>
                      )
                    })()}
                  </div>
                  <p className="text-sm font-semibold text-navy leading-snug">{event.label}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-4">
            <Link
              href="/history"
              className="btn-brutal bg-teal text-white inline-flex items-center gap-2"
            >
              Explore Full Timeline <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        {/* ═══ SECTION 8: Why Track Music Mood? (SEO) ═══ */}
        <section>
          <h2
            className="text-xl font-bold text-navy mb-4"
            style={{ fontFamily: 'var(--font-poppins)' }}
          >
            Why Track Music Mood?
          </h2>
          <div className="card-brutal">
            <p className="text-navy/80 leading-relaxed mb-4">
              The Billboard Sadness Index (BSI) measures the emotional tone of America&apos;s most popular music
              every week. By analyzing the acoustic valence of all 100 songs on the Billboard Hot 100 chart —
              weighted by rank — we produce a single number from 0 (euphoric) to 100 (somber) that captures
              the nation&apos;s musical mood.
            </p>
            <p className="text-navy/80 leading-relaxed mb-4">
              Here&apos;s the counter-intuitive insight: when the economy crashes, the charts don&apos;t get
              sadder — they get <strong className="text-teal">brighter</strong>. People reach for escapist
              music during hard times. Lady Gaga and Kesha dominated during the 2008 financial crisis. Dance
              hits surged after COVID lockdowns. Economists call this phenomenon{' '}
              <strong className="text-orange">&ldquo;Recession Pop.&rdquo;</strong>
            </p>
            <p className="text-navy/80 leading-relaxed">
              Peer-reviewed research from the Journal of Financial Economics (Edmans et al., 2022) confirms
              that music sentiment predicts stock returns across 40 countries. The BSI shows the strongest
              correlation with the VIX fear index (r&nbsp;=&nbsp;&minus;0.47), with musical mood shifts leading
              economic indicators by approximately 3 months. When BSI drops below 30, it may signal underlying
              economic anxiety masked by musical escapism.
            </p>
          </div>
        </section>

        {/* ═══ SECTION 9: Newsletter ═══ */}
        <section>
          <Newsletter />
        </section>
      </main>

      <Footer />
    </>
  )
}
