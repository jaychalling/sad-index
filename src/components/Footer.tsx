import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t-[3px] border-navy bg-white mt-16">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid sm:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <h3
              className="font-bold text-lg text-navy mb-2"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              Sad Index
            </h3>
            <p className="text-sm text-navy/60 leading-relaxed">
              Tracking the emotional temperature of Billboard Hot 100 hits and what it tells us about the economy.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-bold text-sm text-navy uppercase tracking-wide mb-3">
              Explore
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/this-week" className="text-teal hover:text-navy font-medium transition-colors">
                  This Week
                </Link>
              </li>
              <li>
                <Link href="/history" className="text-teal hover:text-navy font-medium transition-colors">
                  Historical Data
                </Link>
              </li>
              <li>
                <Link href="/indicators" className="text-teal hover:text-navy font-medium transition-colors">
                  Weird Indicators
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-teal hover:text-navy font-medium transition-colors">
                  About / Methodology
                </Link>
              </li>
            </ul>
          </div>

          {/* Credits */}
          <div>
            <h4 className="font-bold text-sm text-navy uppercase tracking-wide mb-3">
              Data Sources
            </h4>
            <ul className="space-y-2 text-sm text-navy/60">
              <li>Billboard Hot 100 (chart data)</li>
              <li>Spotify API (audio valence)</li>
              <li>FRED / Yahoo Finance (economic)</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t-[2px] border-navy/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-navy/50">
          <p>&copy; 2026 Sad Index. Not financial advice.</p>
          <p>
            Built with curiosity and too many sad playlists.
          </p>
        </div>
      </div>
    </footer>
  )
}
