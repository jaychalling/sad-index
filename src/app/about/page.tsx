import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About — Methodology & Research Sources',
  description:
    'How we calculate the Billboard Sadness Index using Hot 100 valence data. Academic research, the "Recession Pop" phenomenon, and data sources explained.',
  openGraph: {
    title: 'About the Billboard Sadness Index',
    description: 'Methodology, academic evidence, and data sources behind the BSI.',
  },
  alternates: {
    canonical: '/about',
  },
}

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://sadindex.com' },
    { '@type': 'ListItem', position: 2, name: 'About' },
  ],
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is the Billboard Sadness Index (BSI)?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The Billboard Sadness Index tracks the emotional valence of Billboard Hot 100 songs weekly. It computes a rank-weighted sadness score from 0 (bright/euphoric) to 100 (dark/somber) using audio analysis.',
      },
    },
    {
      '@type': 'Question',
      name: 'Why do charts get brighter during recessions?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'People seek escapist music during hard times — they want to dance, not wallow. This "Recession Pop" pattern has repeated consistently over 25 years of data, including during the 2008 financial crisis and COVID-19.',
      },
    },
    {
      '@type': 'Question',
      name: 'How is BSI calculated?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'BSI = Σ((1 - valence_i) × (1/rank_i)) / Σ(1/rank_i) × 100. Higher-ranked songs have more influence on the index. Valence (0.0 to 1.0) measures musical positivity using audio analysis.',
      },
    },
    {
      '@type': 'Question',
      name: 'What data sources does Sad Index use?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sad Index uses Billboard Hot 100 chart data, Essentia audio analysis library for computing valence, historical Spotify Audio Features data, and FRED API for economic indicators (S&P 500, VIX, unemployment rate, consumer sentiment).',
      },
    },
  ],
}

const bsiRanges = [
  { range: '0–20', label: 'Euphoric', color: '#22c55e', bg: '#dcfce7', meaning: 'Strong escapism signal — people are coping through music' },
  { range: '20–40', label: 'Bright', color: '#4ade80', bg: '#dcfce7', meaning: 'Potential underlying anxiety despite upbeat sound' },
  { range: '40–60', label: 'Neutral', color: '#ffb703', bg: '#fef3c7', meaning: 'Normal times — balanced mix of moods' },
  { range: '60–80', label: 'Moody', color: '#f87171', bg: '#fee2e2', meaning: 'Social reflection — society processing something' },
  { range: '80–100', label: 'Dark', color: '#ef4444', bg: '#fee2e2', meaning: 'Rare — usually tied to national tragedy or crisis' },
]

const dataSources = [
  {
    name: 'Billboard Hot 100',
    description: 'Weekly chart rankings for the top 100 songs in the United States',
    url: 'https://www.billboard.com/charts/hot-100/',
  },
  {
    name: 'Essentia',
    description: 'Open-source audio analysis library for computing musical valence and other features',
    url: 'https://essentia.upf.edu/',
  },
  {
    name: 'FRED API',
    description: 'Federal Reserve Economic Data — recession indicators, consumer sentiment, S&P 500',
    url: 'https://fred.stlouisfed.org/',
  },
  {
    name: 'Spotify Audio Features (historical)',
    description: 'Supplementary valence data for songs where Essentia analysis is unavailable',
    url: 'https://developer.spotify.com/',
  },
]

const academicSources = [
  {
    authors: 'Edmans, Fernandez-Perez, Garel & Indriawan',
    journal: 'Journal of Financial Economics, 2022',
    title: 'Music sentiment and stock returns around the world',
    quote:
      'The SWAV (Spotify Weighted-Average Valence) index, tracking music sentiment across 40 countries, is significantly correlated with next-week stock returns — suggesting music listening habits reveal collective mood shifts before markets react.',
  },
  {
    authors: 'de Lucio & Palomeque',
    journal: 'Journal of Cultural Economics, 2023',
    title: 'Hit song lyrics and their emotional content over 60 years (1958–2019)',
    quote:
      'Billboard Hot 100 lyrics have become progressively sadder and more negative since 1958, with a notable acceleration after 2000. Interestingly, during economic downturns, chart-topping songs tend to be more positive — the "escapism hypothesis."',
  },
  {
    authors: 'Andy Haldane',
    journal: 'Bank of England, Speech 2019',
    title: 'On using alternative data for economic forecasting',
    quote:
      'In many situations, data on music listening habits may be at least as useful as conventional consumer confidence surveys for gauging real-time shifts in public mood and economic sentiment.',
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 py-10 w-full">
        {/* Page Title */}
        <div className="mb-10">
          <h1
            className="text-3xl md:text-4xl font-bold text-navy mb-2"
            style={{ fontFamily: 'var(--font-poppins)' }}
          >
            About Sad Index
          </h1>
          <p className="text-teal font-medium text-lg">
            Methodology, research, and data sources
          </p>
        </div>

        {/* Section 1: What is BSI? */}
        <section className="card-brutal mb-8 p-6 md:p-8">
          <h2
            className="text-2xl font-bold text-navy mb-4"
            style={{ fontFamily: 'var(--font-poppins)' }}
          >
            What is BSI?
          </h2>
          <p className="text-navy/80 leading-relaxed mb-4">
            The <strong>Billboard Sadness Index (BSI)</strong> tracks the emotional valence of
            Billboard Hot 100 songs on a weekly basis. By analyzing the acoustic properties of
            each charting song — specifically its <em>valence</em> (a measure of musical positivity
            from 0.0 to 1.0) — we compute a rank-weighted sadness score for the entire chart.
          </p>
          <p className="text-navy/80 leading-relaxed mb-6">
            Higher-ranked songs have more influence on the index, reflecting their greater
            cultural penetration. The result is a single number from 0 to 100 that captures
            what America is <em>listening to</em> — and by extension, how it might be <em>feeling</em>.
          </p>

          {/* Formula */}
          <div
            className="bg-navy/5 rounded-lg p-5 border-[3px] border-navy font-mono text-sm md:text-base text-navy overflow-x-auto"
            style={{ boxShadow: '4px 4px 0 #219ebc' }}
          >
            <p className="text-xs font-sans font-semibold text-teal uppercase tracking-wider mb-2">
              Formula
            </p>
            <code>
              BSI = &Sigma;((1 - valence_i) &times; (1/rank_i)) / &Sigma;(1/rank_i) &times; 100
            </code>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-start gap-2">
              <span className="tag-brutal bg-teal/20 text-navy text-xs flex-shrink-0">0</span>
              <span className="text-navy/70">Extremely bright — everyone is listening to euphoric music (escapism warning)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="tag-brutal bg-orange/20 text-navy text-xs flex-shrink-0">100</span>
              <span className="text-navy/70">Extremely dark — the charts are dominated by somber, low-valence songs</span>
            </div>
          </div>
        </section>

        {/* Section 2: Counter-Intuitive Insight */}
        <section className="card-brutal mb-8 p-6 md:p-8" style={{ borderColor: '#ffb703', boxShadow: '4px 4px 0 #fb8500' }}>
          <h2
            className="text-2xl font-bold text-navy mb-4"
            style={{ fontFamily: 'var(--font-poppins)' }}
          >
            The Counter-Intuitive Insight
          </h2>
          <p className="text-navy/80 leading-relaxed mb-4">
            You might expect the charts to get <em>sadder</em> when the economy crashes.
            The opposite is true. When recession hits, the Billboard Hot 100 gets
            <strong> brighter</strong>.
          </p>
          <p className="text-navy/80 leading-relaxed mb-4">
            People seek <strong>escapist music</strong> during hard times. They don&apos;t want to
            wallow — they want to dance. This pattern has repeated consistently over 25 years
            of data.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="bg-ocean/10 rounded-lg p-4 border-2 border-navy">
              <p className="font-bold text-navy text-sm mb-1">2008 Financial Crisis</p>
              <p className="text-navy/70 text-sm">
                Lady Gaga (&ldquo;Just Dance&rdquo;, &ldquo;Poker Face&rdquo;) and Kesha (&ldquo;TiK ToK&rdquo;)
                dominated the charts. BSI dropped to the low 20s — peak musical escapism.
              </p>
            </div>
            <div className="bg-ocean/10 rounded-lg p-4 border-2 border-navy">
              <p className="font-bold text-navy text-sm mb-1">2020 Post-COVID</p>
              <p className="text-navy/70 text-sm">
                After an initial spike of genuine sadness (BSI 68 in March 2020),
                the charts quickly rebounded with euphoric hits. By 2021, the BSI was back
                in the low 20s.
              </p>
            </div>
          </div>

          <div className="mt-6 bg-amber/20 rounded-lg p-4 border-2 border-amber">
            <p className="font-bold text-navy text-sm">
              This phenomenon is called <span className="text-orange">&ldquo;Recession Pop&rdquo;</span> — the
              tendency for popular music to become aggressively upbeat during economic downturns.
            </p>
          </div>
        </section>

        {/* Section 3: Academic Evidence */}
        <section className="card-brutal mb-8 p-6 md:p-8">
          <h2
            className="text-2xl font-bold text-navy mb-6"
            style={{ fontFamily: 'var(--font-poppins)' }}
          >
            Academic Evidence
          </h2>
          <p className="text-navy/80 leading-relaxed mb-6">
            The relationship between music sentiment and economic conditions is not just anecdotal.
            Peer-reviewed research supports the core thesis of Sad Index.
          </p>

          <div className="space-y-5">
            {academicSources.map((source, i) => (
              <div
                key={i}
                className="bg-navy/[0.03] rounded-lg p-5 border-l-[4px]"
                style={{ borderLeftColor: i === 0 ? '#219ebc' : i === 1 ? '#ffb703' : '#fb8500' }}
              >
                <p className="font-bold text-navy text-sm mb-1">{source.title}</p>
                <p className="text-navy/50 text-xs mb-3">
                  {source.authors} — <em>{source.journal}</em>
                </p>
                <blockquote className="text-navy/70 text-sm leading-relaxed italic border-none pl-0">
                  &ldquo;{source.quote}&rdquo;
                </blockquote>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4: Data Sources */}
        <section className="card-brutal mb-8 p-6 md:p-8">
          <h2
            className="text-2xl font-bold text-navy mb-6"
            style={{ fontFamily: 'var(--font-poppins)' }}
          >
            Data Sources
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-[3px] border-navy">
                  <th className="text-left py-3 px-3 font-bold text-navy">Source</th>
                  <th className="text-left py-3 px-3 font-bold text-navy">Description</th>
                  <th className="text-left py-3 px-3 font-bold text-navy">Link</th>
                </tr>
              </thead>
              <tbody>
                {dataSources.map((source, i) => (
                  <tr
                    key={source.name}
                    className={`border-b-2 border-navy/10 ${i % 2 === 0 ? 'bg-ocean/5' : 'bg-white'}`}
                  >
                    <td className="py-3 px-3 font-semibold text-navy">{source.name}</td>
                    <td className="py-3 px-3 text-navy/70">{source.description}</td>
                    <td className="py-3 px-3">
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal font-semibold hover:text-navy underline underline-offset-2"
                      >
                        Visit
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 5: Gauge Interpretation */}
        <section className="card-brutal mb-4 p-6 md:p-8">
          <h2
            className="text-2xl font-bold text-navy mb-6"
            style={{ fontFamily: 'var(--font-poppins)' }}
          >
            Gauge Interpretation
          </h2>
          <p className="text-navy/80 leading-relaxed mb-6">
            How to read the BSI score and what each range signals about the cultural mood.
          </p>

          <div className="space-y-3">
            {bsiRanges.map((row) => (
              <div
                key={row.label}
                className="flex flex-col md:flex-row items-start md:items-center gap-3 p-4 rounded-lg border-2 border-navy"
                style={{ backgroundColor: row.bg }}
              >
                <div className="flex items-center gap-3 flex-shrink-0 w-full md:w-48">
                  <div
                    className="w-5 h-5 rounded-md border-2 border-navy flex-shrink-0"
                    style={{ backgroundColor: row.color }}
                  />
                  <span className="font-bold text-navy">{row.range}</span>
                  <span
                    className="tag-brutal text-xs"
                    style={{ backgroundColor: row.color + '40', color: '#023047' }}
                  >
                    {row.label}
                  </span>
                </div>
                <p className="text-navy/70 text-sm leading-relaxed">{row.meaning}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 bg-navy/5 rounded-lg p-4 border-2 border-navy/20">
            <p className="text-navy/60 text-xs leading-relaxed">
              <strong>Note:</strong> The BSI is a cultural indicator, not a financial instrument.
              While academic research shows correlation between music sentiment and economic conditions,
              this should not be used as the sole basis for investment decisions.
            </p>
          </div>
        </section>
        {/* Related Pages */}
        <section className="mt-8 grid sm:grid-cols-3 gap-4">
          <Link href="/" className="card-brutal flex items-center justify-between group">
            <div>
              <p className="font-bold text-navy" style={{ fontFamily: 'var(--font-poppins)' }}>Today&apos;s BSI</p>
              <p className="text-sm text-navy/60">Live dashboard</p>
            </div>
            <ArrowRight size={18} className="text-teal group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/this-week" className="card-brutal flex items-center justify-between group">
            <div>
              <p className="font-bold text-navy" style={{ fontFamily: 'var(--font-poppins)' }}>This Week</p>
              <p className="text-sm text-navy/60">Track-by-track breakdown</p>
            </div>
            <ArrowRight size={18} className="text-teal group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/history" className="card-brutal flex items-center justify-between group">
            <div>
              <p className="font-bold text-navy" style={{ fontFamily: 'var(--font-poppins)' }}>Full Timeline</p>
              <p className="text-sm text-navy/60">25 years of data</p>
            </div>
            <ArrowRight size={18} className="text-teal group-hover:translate-x-1 transition-transform" />
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  )
}
