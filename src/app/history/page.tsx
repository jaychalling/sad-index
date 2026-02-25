import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import HistoryClient from '@/components/HistoryClient'
import { getBsiHistory, getHistoricalEventsWithBsi } from '@/lib/queries'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mood History — 25 Years of National Mood Data (2000–2026)',
  description:
    'Explore 25 years of national mood data: Music Sadness, Market Fear, Consumer Gloom, and Job Anxiety. See how mood indices predicted the 2008 crash, COVID, and more.',
  openGraph: {
    title: 'Mood History: 25 Years of National Mood Data',
    description:
      'Interactive timeline of 4 mood indices from 2000 to present — music, markets, consumers, and jobs.',
  },
  alternates: {
    canonical: '/history',
  },
}

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://sadindex.com' },
    { '@type': 'ListItem', position: 2, name: 'History' },
  ],
}

export default async function HistoryPage() {
  const [{ bsiData, econData }, enrichedEvents] = await Promise.all([getBsiHistory(), getHistoricalEventsWithBsi()])

  return (
    <div className="min-h-screen flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto px-4 py-10 w-full">
        <div className="mb-10">
          <h1
            className="text-3xl md:text-4xl font-bold text-navy mb-2"
            style={{ fontFamily: 'var(--font-poppins)' }}
          >
            Mood History
          </h1>
          <p className="text-teal font-medium text-lg">
            2000 to Present — 25 years of national mood data across 4 indices
          </p>
        </div>
        <HistoryClient bsiData={bsiData} historicalEvents={enrichedEvents.filter(e => e.date >= '2000-01-01')} econData={econData} />

        {/* Related Pages */}
        <section className="mt-12 grid sm:grid-cols-2 gap-4">
          <Link href="/this-week" className="card-brutal flex items-center justify-between group">
            <div>
              <p className="font-bold text-navy" style={{ fontFamily: 'var(--font-poppins)' }}>This Week&apos;s Data</p>
              <p className="text-sm text-navy/60">Current BSI score & track breakdown</p>
            </div>
            <ArrowRight size={18} className="text-teal group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/about" className="card-brutal flex items-center justify-between group">
            <div>
              <p className="font-bold text-navy" style={{ fontFamily: 'var(--font-poppins)' }}>Our Methodology</p>
              <p className="text-sm text-navy/60">How BSI is calculated & research</p>
            </div>
            <ArrowRight size={18} className="text-teal group-hover:translate-x-1 transition-transform" />
          </Link>
        </section>
      </main>
      <Footer />
    </div>
  )
}
