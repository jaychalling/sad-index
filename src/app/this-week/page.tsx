import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ThisWeekClient from '@/components/ThisWeekClient'
import { getLatestBsi, getThisWeekTracks } from '@/lib/queries'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "This Week's Billboard Mood — Hot 100 Valence Report",
  description:
    "See this week's Billboard Sadness Index score, all 100 tracks ranked by emotional valence, and whether the charts are getting sadder or brighter. Updated weekly.",
  openGraph: {
    title: "This Week's Billboard Sadness Index",
    description:
      "Weekly mood report: BSI score and valence breakdown of all Hot 100 tracks.",
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
