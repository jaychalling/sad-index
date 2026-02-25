import type { Metadata } from 'next'
import { getLatestBsi, getBsiHistory, getThisWeekTracks, getHistoricalEventsWithBsi } from '@/lib/queries'
import {
  vixToFear, umcsentToGloom, unrateToAnxiety, calcNMS,
  getNMSLabel, getMoodEmoji, getMoodLabel, getSignal,
  bsiSegments, fearSegments, gloomSegments, anxietySegments,
  indexColors,
} from '@/lib/mood-indices'
import Navbar from '@/components/Navbar'
import MiniGauge from '@/components/MiniGauge'
import MoodChart from '@/components/MoodChart'
import WeekHighlight from '@/components/WeekHighlight'
import Newsletter from '@/components/Newsletter'
import Footer from '@/components/Footer'
import { Calendar, ArrowRight, TrendingUp, Activity, Users, Heart } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  alternates: { canonical: '/' },
}

const datasetSchema = {
  '@context': 'https://schema.org',
  '@type': 'Dataset',
  name: 'National Mood Score — 4-Index Composite',
  description: 'Weekly composite mood index combining Billboard Sadness Index, VIX (Market Fear), Consumer Sentiment (Gloom), and Unemployment (Job Anxiety). Normalized 0-100.',
  url: 'https://sadindex.com',
  temporalCoverage: '2000/2026',
  variableMeasured: 'National Mood Score (NMS)',
  creator: { '@type': 'Organization', name: 'Sad Index' },
}

function formatWeekDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default async function Home() {
  const [currentWeekData, { bsiData: bsiWeeklyData, econData }, topTracksThisWeek, enrichedEvents] =
    await Promise.all([getLatestBsi(), getBsiHistory(), getThisWeekTracks(), getHistoricalEventsWithBsi()])

  const bsi = currentWeekData.bsi
  const ind = currentWeekData.economicIndicators

  // Normalized indices
  const fear = vixToFear(ind.vix.value)
  const gloom = umcsentToGloom(ind.consumerSentiment.value)
  const anxiety = unrateToAnxiety(ind.unemployment.value)
  const nms = calcNMS(bsi, fear, gloom, anxiety)

  // Previous values for change calculation
  const prevFear = vixToFear(ind.vix.value - ind.vix.change)
  const prevGloom = umcsentToGloom(ind.consumerSentiment.value - ind.consumerSentiment.change)
  const prevAnxiety = unrateToAnxiety(ind.unemployment.value - ind.unemployment.change)
  const prevNms = calcNMS(currentWeekData.prevBsi, prevFear, prevGloom, prevAnxiety)

  const nmsLabel = getNMSLabel(nms)
  const nmsChange = nms - prevNms
  const signal = getSignal(nms)

  // NMS breakdown contributions
  const bsiContrib = bsi * 0.35
  const fearContrib = fear * 0.25
  const gloomContrib = gloom * 0.25
  const anxietyContrib = anxiety * 0.15

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetSchema) }}
      />
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-10">

        {/* ═══ SECTION 1: NMS Hero + Signal ═══ */}
        <section className="grid md:grid-cols-5 gap-4">
          <div className="md:col-span-3 card-brutal !bg-navy text-white relative overflow-hidden">
            <div
              className="absolute top-2 right-4 text-[80px] font-extrabold opacity-[0.04] leading-none select-none pointer-events-none"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              NMS
            </div>
            <div className="relative">
              <p className="text-[10px] font-bold uppercase tracking-widest text-ocean mb-4">
                National Mood Score
              </p>
              <div className="flex items-end gap-4 mb-2">
                <span
                  className="text-6xl md:text-7xl font-extrabold leading-none"
                  style={{ fontFamily: 'var(--font-poppins)' }}
                >
                  {Math.round(nms)}
                </span>
                <div className="pb-2 flex items-center gap-2">
                  <span className="text-3xl">{getMoodEmoji(nms)}</span>
                  <span
                    className="tag-brutal !border-white/30 text-sm"
                    style={{ backgroundColor: nmsLabel.color, color: nmsLabel.color === '#ffb703' || nmsLabel.color === '#4ade80' ? '#023047' : '#fff' }}
                  >
                    {nmsLabel.text}
                  </span>
                </div>
              </div>
              <h1 className="text-lg font-bold text-white/90 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                How Is America Feeling Right Now?
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className={nmsChange > 0 ? 'text-orange' : nmsChange < 0 ? 'text-happy' : 'text-white/60'}>
                  {nmsChange > 0 ? '\u25B2' : nmsChange < 0 ? '\u25BC' : '\u25CF'}{' '}
                  {nmsChange > 0 ? '+' : ''}{nmsChange.toFixed(1)} from last week
                </span>
                <span className="text-white/30">|</span>
                <span className="text-white/60">Week of {formatWeekDate(currentWeekData.weekDate)}</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 card-brutal border-l-[6px] flex flex-col justify-between" style={{ borderLeftColor: signal.color }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Activity size={16} className="text-navy/60" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-navy/60">
                  Mood Alert Level
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
              NMS = Music(35%) + Fear(25%) + Gloom(25%) + Jobs(15%)
            </p>
          </div>
        </section>

        {/* ═══ SECTION 2: 4 Index Gauges ═══ */}
        <section>
          <h2
            className="text-xl font-bold text-navy mb-4"
            style={{ fontFamily: 'var(--font-poppins)' }}
          >
            The 4 Indices
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MiniGauge
              value={bsi}
              prevValue={currentWeekData.prevBsi}
              title="Music Sadness"
              source="Billboard Hot 100 Valence"
              segments={bsiSegments}
            />
            <MiniGauge
              value={fear}
              prevValue={prevFear}
              title="Market Fear"
              source={`VIX: ${ind.vix.value.toFixed(1)}`}
              segments={fearSegments}
            />
            <MiniGauge
              value={gloom}
              prevValue={prevGloom}
              title="Consumer Gloom"
              source={`UMCSENT: ${ind.consumerSentiment.value.toFixed(1)}`}
              segments={gloomSegments}
            />
            <MiniGauge
              value={anxiety}
              prevValue={prevAnxiety}
              title="Job Anxiety"
              source={`Unemployment: ${ind.unemployment.value.toFixed(1)}%`}
              segments={anxietySegments}
            />
          </div>
        </section>

        {/* ═══ SECTION 3: NMS Breakdown Bar ═══ */}
        <section className="card-brutal !p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-widest text-navy/60">NMS Breakdown</p>
            <p className="text-sm font-bold text-navy" style={{ fontFamily: 'var(--font-poppins)' }}>
              {Math.round(nms)} / 100
            </p>
          </div>
          <div className="flex h-8 rounded-lg overflow-hidden border-[2px] border-navy">
            <div
              className="flex items-center justify-center text-[10px] font-bold text-white transition-all"
              style={{ width: `${(bsiContrib / nms) * 100}%`, backgroundColor: indexColors.bsi }}
              title={`Music Sadness: ${bsiContrib.toFixed(1)}`}
            >
              {bsiContrib >= 3 && `${bsiContrib.toFixed(0)}`}
            </div>
            <div
              className="flex items-center justify-center text-[10px] font-bold text-white transition-all"
              style={{ width: `${(fearContrib / nms) * 100}%`, backgroundColor: indexColors.fear }}
              title={`Market Fear: ${fearContrib.toFixed(1)}`}
            >
              {fearContrib >= 3 && `${fearContrib.toFixed(0)}`}
            </div>
            <div
              className="flex items-center justify-center text-[10px] font-bold text-navy transition-all"
              style={{ width: `${(gloomContrib / nms) * 100}%`, backgroundColor: indexColors.gloom }}
              title={`Consumer Gloom: ${gloomContrib.toFixed(1)}`}
            >
              {gloomContrib >= 3 && `${gloomContrib.toFixed(0)}`}
            </div>
            <div
              className="flex items-center justify-center text-[10px] font-bold text-navy transition-all"
              style={{ width: `${(anxietyContrib / nms) * 100}%`, backgroundColor: indexColors.anxiety }}
              title={`Job Anxiety: ${anxietyContrib.toFixed(1)}`}
            >
              {anxietyContrib >= 3 && `${anxietyContrib.toFixed(0)}`}
            </div>
          </div>
          <div className="flex flex-wrap gap-4 mt-2 text-[10px] text-navy/60">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ backgroundColor: indexColors.bsi }} /> Music 35%</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ backgroundColor: indexColors.fear }} /> Fear 25%</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ backgroundColor: indexColors.gloom }} /> Gloom 25%</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ backgroundColor: indexColors.anxiety }} /> Jobs 15%</span>
          </div>
        </section>

        {/* ═══ SECTION 4: Mood Trends Chart ═══ */}
        <section>
          <MoodChart bsiData={bsiWeeklyData} econData={econData} />
        </section>

        {/* ═══ SECTION 5: Raw Data Ticker ═══ */}
        <section>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="card-brutal !p-3 !shadow-[3px_3px_0_#023047]">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp size={14} className="text-teal" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-navy/60">S&P 500</span>
              </div>
              <div className="text-xl font-bold text-navy" style={{ fontFamily: 'var(--font-poppins)' }}>{ind.sp500.value.toLocaleString()}</div>
              <div className={`text-xs font-semibold ${ind.sp500.change >= 0 ? 'text-teal' : 'text-orange'}`}>
                {ind.sp500.change >= 0 ? '\u25B2' : '\u25BC'} {Math.abs(ind.sp500.change).toFixed(2)}%
              </div>
            </div>
            <div className="card-brutal !p-3 !shadow-[3px_3px_0_#023047]">
              <div className="flex items-center gap-1.5 mb-1">
                <Activity size={14} className="text-orange" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-navy/60">VIX</span>
              </div>
              <div className="text-xl font-bold text-navy" style={{ fontFamily: 'var(--font-poppins)' }}>{ind.vix.value.toFixed(2)}</div>
              <div className={`text-xs font-semibold ${ind.vix.change <= 0 ? 'text-teal' : 'text-orange'}`}>
                {ind.vix.change >= 0 ? '\u25B2' : '\u25BC'} {Math.abs(ind.vix.change).toFixed(2)}
              </div>
            </div>
            <div className="card-brutal !p-3 !shadow-[3px_3px_0_#023047]">
              <div className="flex items-center gap-1.5 mb-1">
                <Users size={14} className="text-amber" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-navy/60">Unemployment</span>
              </div>
              <div className="text-xl font-bold text-navy" style={{ fontFamily: 'var(--font-poppins)' }}>{ind.unemployment.value.toFixed(1)}%</div>
              <div className={`text-xs font-semibold ${ind.unemployment.change <= 0 ? 'text-teal' : 'text-orange'}`}>
                {ind.unemployment.change >= 0 ? '\u25B2' : '\u25BC'} {Math.abs(ind.unemployment.change).toFixed(2)}%
              </div>
            </div>
            <div className="card-brutal !p-3 !shadow-[3px_3px_0_#023047]">
              <div className="flex items-center gap-1.5 mb-1">
                <Heart size={14} className="text-ocean" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-navy/60">Sentiment</span>
              </div>
              <div className="text-xl font-bold text-navy" style={{ fontFamily: 'var(--font-poppins)' }}>{ind.consumerSentiment.value.toFixed(1)}</div>
              <div className={`text-xs font-semibold ${ind.consumerSentiment.change >= 0 ? 'text-teal' : 'text-orange'}`}>
                {ind.consumerSentiment.change >= 0 ? '\u25B2' : '\u25BC'} {Math.abs(ind.consumerSentiment.change).toFixed(2)}
              </div>
            </div>
          </div>
        </section>

        {/* ═══ SECTION 6: This Week's Mood ═══ */}
        <section>
          <WeekHighlight
            weekDate={currentWeekData.weekDate}
            mostSadTrack={currentWeekData.mostSadTrack}
            mostHappyTrack={currentWeekData.mostHappyTrack}
          />
        </section>

        {/* ═══ SECTION 7: Hot 100 Valence Snapshot ═══ */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-navy" style={{ fontFamily: 'var(--font-poppins)' }}>
              Hot 100 Valence Snapshot
            </h2>
            <Link href="/this-week" className="btn-brutal bg-white text-navy text-sm flex items-center gap-1.5">
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
                  <tr key={track.rank} className={`border-b border-navy/10 ${idx % 2 === 0 ? 'bg-white' : 'bg-ocean/5'}`}>
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
                          backgroundColor: track.valence > 0.55 ? '#22c55e' : track.valence >= 0.35 ? '#ffb703' : '#ef4444',
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

        {/* ═══ SECTION 8: Historical Highlights ═══ */}
        <section>
          <h2 className="text-xl font-bold text-navy mb-4" style={{ fontFamily: 'var(--font-poppins)' }}>
            Historical Highlights
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrichedEvents.filter(e => e.date >= '2000-01-01').map((event) => (
              <div key={event.date} className="card-brutal !p-4 flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber/20 border-[2px] border-navy flex items-center justify-center">
                  <Calendar size={18} className="text-navy" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-navy/50">{event.date}</span>
                    {(() => {
                      const evtMood = getMoodLabel(event.bsi ?? 0)
                      return (
                        <span className="tag-brutal !text-[10px] !px-2 !py-0 font-bold" style={{ backgroundColor: evtMood.color + '25', color: evtMood.color }}>
                          {evtMood.text} &middot; BSI {event.bsi ?? 0}
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
            <Link href="/history" className="btn-brutal bg-teal text-white inline-flex items-center gap-2">
              Explore Full Timeline <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        {/* ═══ SECTION 9: Why Track National Mood? (SEO) ═══ */}
        <section>
          <h2 className="text-xl font-bold text-navy mb-4" style={{ fontFamily: 'var(--font-poppins)' }}>
            Why Track National Mood?
          </h2>
          <div className="card-brutal">
            <p className="text-navy/80 leading-relaxed mb-4">
              The National Mood Score (NMS) combines four dimensions of American sentiment into a single 0–100 reading.
              <strong className="text-teal"> Music Sadness</strong> tracks Billboard Hot 100 valence,{' '}
              <strong className="text-orange">Market Fear</strong> normalizes the VIX volatility index,{' '}
              <strong className="text-amber">Consumer Gloom</strong> inverts the University of Michigan sentiment survey, and{' '}
              <strong className="text-ocean">Job Anxiety</strong> scales the unemployment rate.
            </p>
            <p className="text-navy/80 leading-relaxed mb-4">
              The counter-intuitive insight: when the economy crashes, the Billboard charts don&apos;t get
              sadder — they get <strong className="text-teal">brighter</strong>. People reach for escapist
              music during hard times. Lady Gaga dominated during the 2008 crisis. Dance hits surged after
              COVID. Economists call this <strong className="text-orange">&ldquo;Recession Pop.&rdquo;</strong>
            </p>
            <p className="text-navy/80 leading-relaxed">
              By combining music mood with economic data, the NMS captures what no single indicator can: the
              gap between how people <em>feel</em> and how the economy <em>performs</em>. When all four indices
              diverge, it often precedes economic turning points. The strongest signal comes from
              VIX (r&nbsp;=&nbsp;&minus;0.47 with BSI, 3-month lead).
            </p>
          </div>
        </section>

        {/* ═══ SECTION 10: Newsletter ═══ */}
        <section>
          <Newsletter />
        </section>
      </main>

      <Footer />
    </>
  )
}
