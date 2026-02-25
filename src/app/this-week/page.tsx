import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ThisWeekClient from '@/components/ThisWeekClient'
import { getLatestBsi, getThisWeekTracks } from '@/lib/queries'
import { vixToFear, umcsentToGloom, unrateToAnxiety, calcNMS, getNMSLabel, indexColors } from '@/lib/mood-indices'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "This Week's Mood Report — Hot 100 & National Mood",
  description:
    "This week's National Mood Score, Billboard Sadness Index, Market Fear, Consumer Gloom, and Job Anxiety. All 100 Hot 100 tracks ranked by emotional valence.",
  openGraph: {
    title: "This Week's National Mood Report",
    description:
      "Weekly mood report: NMS composite score, BSI, and valence breakdown of all Hot 100 tracks.",
  },
  alternates: {
    canonical: '/this-week',
  },
}

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://sadindex.com' },
    { '@type': 'ListItem', position: 2, name: 'This Week' },
  ],
}

export default async function ThisWeekPage() {
  const [currentWeekData, tracks] = await Promise.all([
    getLatestBsi(),
    getThisWeekTracks(),
  ])

  return (
    <div className="min-h-screen flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto px-4 py-10 w-full">
        {/* NMS Snapshot */}
        {(() => {
          const ind = currentWeekData.economicIndicators
          const fear = vixToFear(ind.vix.value)
          const gloom = umcsentToGloom(ind.consumerSentiment.value)
          const anxiety = unrateToAnxiety(ind.unemployment.value)
          const nms = calcNMS(currentWeekData.bsi, fear, gloom, anxiety)
          const label = getNMSLabel(nms)
          return (
            <div className="card-brutal !p-4 mb-8 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-navy/60">National Mood</span>
                <span className="text-2xl font-extrabold text-navy" style={{ fontFamily: 'var(--font-poppins)' }}>{Math.round(nms)}</span>
                <span className="tag-brutal !text-[10px] !px-2 !py-0 font-bold" style={{ backgroundColor: label.color, color: label.color === '#ffb703' || label.color === '#4ade80' ? '#023047' : '#fff' }}>
                  {label.text}
                </span>
              </div>
              <div className="flex flex-wrap gap-3 text-xs font-semibold text-navy/60">
                <span>Music <span className="font-bold" style={{ color: indexColors.bsi }}>{Math.round(currentWeekData.bsi)}</span></span>
                <span>Fear <span className="font-bold" style={{ color: indexColors.fear }}>{Math.round(fear)}</span></span>
                <span>Gloom <span className="font-bold" style={{ color: indexColors.gloom }}>{Math.round(gloom)}</span></span>
                <span>Jobs <span className="font-bold" style={{ color: indexColors.anxiety }}>{Math.round(anxiety)}</span></span>
              </div>
            </div>
          )
        })()}

        <ThisWeekClient currentWeekData={currentWeekData} tracks={tracks} />

        {/* Related Pages */}
        <section className="mt-12 grid sm:grid-cols-2 gap-4">
          <Link href="/history" className="card-brutal flex items-center justify-between group">
            <div>
              <p className="font-bold text-navy" style={{ fontFamily: 'var(--font-poppins)' }}>Explore Full Timeline</p>
              <p className="text-sm text-navy/60">25 years of Billboard mood data</p>
            </div>
            <ArrowRight size={18} className="text-teal group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/about" className="card-brutal flex items-center justify-between group">
            <div>
              <p className="font-bold text-navy" style={{ fontFamily: 'var(--font-poppins)' }}>How We Calculate BSI</p>
              <p className="text-sm text-navy/60">Methodology & research sources</p>
            </div>
            <ArrowRight size={18} className="text-teal group-hover:translate-x-1 transition-transform" />
          </Link>
        </section>
      </main>
      <Footer />
    </div>
  )
}
