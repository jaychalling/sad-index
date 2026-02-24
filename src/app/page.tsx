import { bsiWeeklyData, sp500Data, currentWeekData, topTracksThisWeek, historicalEvents } from '@/data/bsi-data'
import Navbar from '@/components/Navbar'
import BsiGauge from '@/components/BsiGauge'
import BsiChart from '@/components/BsiChart'
import EconCards from '@/components/EconCards'
import WeekHighlight from '@/components/WeekHighlight'
import Newsletter from '@/components/Newsletter'
import Footer from '@/components/Footer'
import { Calendar, ArrowRight } from 'lucide-react'
import Link from 'next/link'

function getMoodEmoji(bsi: number): string {
  if (bsi < 20) return '\u{1F60E}'
  if (bsi < 40) return '\u{1F60A}'
  if (bsi < 60) return '\u{1F610}'
  if (bsi < 80) return '\u{1F614}'
  return '\u{1F622}'
}

export default function Home() {
  return (
    <>
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-12">
        {/* Hero */}
        <section className="text-center py-8">
          <h1
            className="text-4xl md:text-5xl font-extrabold text-navy mb-4 leading-tight"
            style={{ fontFamily: 'var(--font-poppins)' }}
          >
            Is America Sad Right Now?
          </h1>
          <p className="text-lg text-navy/70 max-w-2xl mx-auto leading-relaxed">
            The Billboard Sadness Index (BSI) measures the emotional tone of the Hot 100.
            When the charts get gloomy, recessions often follow. Here&apos;s what the music says today.
          </p>
        </section>

        {/* BSI Gauge */}
        <section>
          <BsiGauge value={currentWeekData.bsi} prevValue={currentWeekData.prevBsi} />
        </section>

        {/* Economic Indicators */}
        <section>
          <h2
            className="text-xl font-bold text-navy mb-4"
            style={{ fontFamily: 'var(--font-poppins)' }}
          >
            Economic Pulse
          </h2>
          <EconCards
            sp500={currentWeekData.economicIndicators.sp500}
            vix={currentWeekData.economicIndicators.vix}
            unemployment={currentWeekData.economicIndicators.unemployment}
            consumerSentiment={currentWeekData.economicIndicators.consumerSentiment}
          />
        </section>

        {/* BSI vs S&P 500 Chart */}
        <section>
          <BsiChart bsiData={bsiWeeklyData} sp500Data={sp500Data} />
        </section>

        {/* This Week's Mood */}
        <section>
          <WeekHighlight
            weekDate={currentWeekData.weekDate}
            mostSadTrack={currentWeekData.mostSadTrack}
            mostHappyTrack={currentWeekData.mostHappyTrack}
          />
        </section>

        {/* Top Tracks Preview */}
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
                            track.valence < 0.3
                              ? '#8ecae6'
                              : track.valence < 0.5
                                ? '#ffb703'
                                : '#22c55e',
                          color: track.valence < 0.5 ? '#023047' : '#fff',
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

        {/* Historical Highlights */}
        <section>
          <h2
            className="text-xl font-bold text-navy mb-4"
            style={{ fontFamily: 'var(--font-poppins)' }}
          >
            Historical Highlights
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {historicalEvents.map((event) => (
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
                    <span className="tag-brutal !text-[10px] !px-2 !py-0 bg-ocean/20">
                      BSI {event.bsi} {getMoodEmoji(event.bsi)}
                    </span>
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

        {/* Newsletter */}
        <section>
          <Newsletter />
        </section>
      </main>

      <Footer />
    </>
  )
}
