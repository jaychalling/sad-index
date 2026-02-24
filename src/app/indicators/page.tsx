import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { ArrowRight, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Unconventional Economic Indicators — Sad Index',
  description:
    'From pizza orders predicting wars to skirt lengths forecasting stocks — a curated museum of the weirdest (and surprisingly accurate) economic indicators ever created.',
  openGraph: {
    title: 'The Museum of Weird Economic Indicators',
    description: 'Pizza orders predict wars. Lipstick sales predict recessions. Music predicts everything.',
  },
}

interface Indicator {
  emoji: string
  name: string
  tagline: string
  proxyData: string
  predicts: string
  origin: string
  funFact: string
  accuracy: 'Proven' | 'Debated' | 'Legendary'
  accuracyColor: string
  cardAccent: string
  isOurs?: boolean
  link?: string
}

const indicators: Indicator[] = [
  {
    emoji: '🧇',
    name: 'Waffle House Index',
    tagline: 'If Waffle House closes, it\'s bad.',
    proxyData: 'Waffle House restaurant operations',
    predicts: 'Hurricane & disaster severity',
    origin: 'FEMA Administrator Craig Fugate coined it in 2011. Waffle House famously never closes — when they do, FEMA knows it\'s catastrophic.',
    funFact: 'Waffle House has a secret "storm playbook" with a limited menu designed to operate during hurricanes. They deploy a portable Waffle House to disaster zones.',
    accuracy: 'Proven',
    accuracyColor: '#22c55e',
    cardAccent: '#fb8500',
  },
  {
    emoji: '🍔',
    name: 'Big Mac Index',
    tagline: 'Burgernomics is real economics.',
    proxyData: 'Big Mac prices across 70+ countries',
    predicts: 'Currency purchasing power parity',
    origin: 'Created by The Economist in 1986 as a "lighthearted guide" to exchange rates. Still published twice a year.',
    funFact: 'Switzerland consistently has the world\'s most expensive Big Mac (~$7.73). The cheapest? Taiwan at ~$2.39.',
    accuracy: 'Proven',
    accuracyColor: '#22c55e',
    cardAccent: '#ffb703',
    link: 'https://www.economist.com/big-mac-index',
  },
  {
    emoji: '💄',
    name: 'Lipstick Index',
    tagline: 'Recession-proof vanity.',
    proxyData: 'Lipstick & cosmetics sales volume',
    predicts: 'Economic recession',
    origin: 'Proposed by Estée Lauder chairman Leonard Lauder in 2001. During the post-9/11 recession, lipstick sales rose 11%.',
    funFact: 'During the 2008 financial crisis, lipstick sales surged while luxury goods tanked — people traded down from expensive pleasures to affordable ones.',
    accuracy: 'Debated',
    accuracyColor: '#ffb703',
    cardAccent: '#ef4444',
  },
  {
    emoji: '👗',
    name: 'Hemline Index',
    tagline: 'Bull markets wear mini skirts.',
    proxyData: 'Average skirt length in fashion',
    predicts: 'Stock market direction',
    origin: 'Economist George Taylor proposed it in 1926: hemlines rise with stock prices. The Roaring Twenties had the shortest skirts and highest stocks.',
    funFact: 'The theory actually held through the 1929 crash (long skirts returned) and the 1960s boom (mini skirts). It broke down in the 2000s.',
    accuracy: 'Legendary',
    accuracyColor: '#8ecae6',
    cardAccent: '#7c3aed',
  },
  {
    emoji: '📦',
    name: 'Cardboard Box Index',
    tagline: 'The economy ships in boxes.',
    proxyData: 'Corrugated cardboard production volume',
    predicts: 'Consumer spending & manufacturing output',
    origin: 'Former Fed Chair Alan Greenspan was known to track cardboard box shipments as a real-time economic indicator.',
    funFact: 'Cardboard production fell 8.3% in the 2008 recession — one of the earliest signals, months before GDP data confirmed it.',
    accuracy: 'Proven',
    accuracyColor: '#22c55e',
    cardAccent: '#92400e',
  },
  {
    emoji: '🍕',
    name: 'Pentagon Pizza Index',
    tagline: 'Late-night pizza = incoming crisis.',
    proxyData: 'Pizza delivery orders near the Pentagon',
    predicts: 'Military operations & geopolitical crises',
    origin: 'Cold War legend says Soviet spies monitored food deliveries to US government buildings. PizzINT.watch turned it into a live dashboard in 2024.',
    funFact: 'PizzINT detected "busier than usual" activity at Papa Johns before the 2024 Iran strikes. The dashboard went viral, spawning a Solana token ($PPW).',
    accuracy: 'Legendary',
    accuracyColor: '#8ecae6',
    cardAccent: '#219ebc',
    link: 'https://pizzint.watch',
  },
  {
    emoji: '🎵',
    name: 'Billboard Sadness Index',
    tagline: 'When charts get bright, recessions follow.',
    proxyData: 'Billboard Hot 100 song valence (emotional tone)',
    predicts: 'Economic recession & recovery cycles',
    origin: 'Based on 5 peer-reviewed papers including Edmans et al. (Journal of Financial Economics, 2022) showing music sentiment predicts stock returns across 40 countries.',
    funFact: 'During the 2008 crisis, Lady Gaga\'s "Just Dance" and Kesha\'s "TiK ToK" dominated charts. BSI hit 20 — peak escapism. The pattern repeats every recession.',
    accuracy: 'Proven',
    accuracyColor: '#22c55e',
    cardAccent: '#219ebc',
    isOurs: true,
    link: '/',
  },
]

function AccuracyBadge({ accuracy, color }: { accuracy: string; color: string }) {
  return (
    <span
      className="tag-brutal !text-[11px] !px-2.5 !py-0.5 font-bold"
      style={{ backgroundColor: color + '25', color }}
    >
      {accuracy === 'Proven' ? '✓ ' : accuracy === 'Legendary' ? '★ ' : '? '}
      {accuracy}
    </span>
  )
}

export default function IndicatorsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 py-10 w-full">
        {/* Hero */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span
              className="tag-brutal bg-amber/30 text-navy text-sm"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              SEO Magnet
            </span>
            <span className="tag-brutal bg-ocean/30 text-navy text-sm">
              7 Indicators
            </span>
          </div>
          <h1
            className="text-3xl md:text-5xl font-extrabold text-navy leading-tight mb-4"
            style={{ fontFamily: 'var(--font-poppins)' }}
          >
            The Museum of Weird
            <br />
            Economic Indicators
          </h1>
          <p className="text-lg text-navy/70 max-w-2xl leading-relaxed">
            Economists use GDP, CPI, and unemployment rates. But the most fascinating
            predictors of economic reality are the ones nobody expected — from waffle
            restaurants to skirt lengths to{' '}
            <strong className="text-teal">the songs we listen to</strong>.
          </p>
        </div>

        {/* Indicator Cards */}
        <div className="space-y-6">
          {indicators.map((ind, i) => (
            <div
              key={ind.name}
              className={`relative bg-white rounded-lg border-[3px] border-navy overflow-hidden ${
                ind.isOurs ? 'ring-4 ring-teal/30' : ''
              }`}
              style={{
                boxShadow: i % 2 === 0 ? '5px 5px 0 #023047' : '5px 5px 0 #219ebc',
              }}
            >
              {/* Accent bar */}
              <div
                className="h-[5px]"
                style={{ background: ind.cardAccent }}
              />

              <div className="p-6 md:p-8">
                {/* Header row */}
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{ind.emoji}</span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2
                          className="text-xl md:text-2xl font-bold text-navy"
                          style={{ fontFamily: 'var(--font-poppins)' }}
                        >
                          {ind.name}
                        </h2>
                        {ind.isOurs && (
                          <span className="tag-brutal !text-[10px] !px-2 !py-0 bg-teal text-white font-bold">
                            OURS
                          </span>
                        )}
                      </div>
                      <p className="text-navy/50 text-sm font-medium italic">
                        {ind.tagline}
                      </p>
                    </div>
                  </div>
                  <AccuracyBadge accuracy={ind.accuracy} color={ind.accuracyColor} />
                </div>

                {/* Data grid */}
                <div className="grid md:grid-cols-2 gap-4 mb-5">
                  <div className="bg-navy/[0.03] rounded-lg p-4 border-2 border-navy/10">
                    <p className="text-[11px] font-bold text-navy/40 uppercase tracking-wider mb-1">
                      Proxy Data
                    </p>
                    <p className="text-sm font-semibold text-navy">{ind.proxyData}</p>
                  </div>
                  <div className="bg-navy/[0.03] rounded-lg p-4 border-2 border-navy/10">
                    <p className="text-[11px] font-bold text-navy/40 uppercase tracking-wider mb-1">
                      Predicts
                    </p>
                    <p className="text-sm font-semibold text-navy">{ind.predicts}</p>
                  </div>
                </div>

                {/* Origin */}
                <p className="text-sm text-navy/70 leading-relaxed mb-4">
                  <strong className="text-navy">Origin:</strong> {ind.origin}
                </p>

                {/* Fun Fact */}
                <div
                  className="bg-amber/10 rounded-lg p-4 border-l-[4px] text-sm text-navy/80 leading-relaxed"
                  style={{ borderLeftColor: ind.cardAccent }}
                >
                  <span className="font-bold text-navy">Fun fact: </span>
                  {ind.funFact}
                </div>

                {/* Link */}
                {ind.link && (
                  <div className="mt-4">
                    {ind.isOurs ? (
                      <Link
                        href={ind.link}
                        className="btn-brutal bg-teal text-white text-sm inline-flex items-center gap-1.5"
                      >
                        See Live Dashboard <ArrowRight size={14} />
                      </Link>
                    ) : (
                      <a
                        href={ind.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-brutal bg-white text-navy text-sm inline-flex items-center gap-1.5"
                      >
                        Learn More <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div
          className="mt-12 card-brutal !bg-gradient-to-br from-navy via-navy to-teal text-white text-center !p-8"
          style={{ boxShadow: '6px 6px 0 #ffb703' }}
        >
          <h2
            className="text-2xl md:text-3xl font-bold mb-3"
            style={{ fontFamily: 'var(--font-poppins)' }}
          >
            Sad Index is Live
          </h2>
          <p className="text-white/70 max-w-lg mx-auto mb-6 leading-relaxed">
            Unlike most indicators on this list, the Billboard Sadness Index updates
            every week with real data. See what America is listening to — and what it
            might mean for the economy.
          </p>
          <Link
            href="/"
            className="btn-brutal bg-amber text-navy font-bold inline-flex items-center gap-2 !border-white/30 hover:bg-orange"
          >
            Check This Week&apos;s BSI <ArrowRight size={16} />
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}
