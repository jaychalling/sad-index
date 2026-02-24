import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import HistoryClient from '@/components/HistoryClient'
import { historicalEvents } from '@/data/bsi-data'
import { getBsiHistory } from '@/lib/queries'

export default async function HistoryPage() {
  const { bsiData } = await getBsiHistory()

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto px-4 py-10 w-full">
        <div className="mb-10">
          <h1
            className="text-3xl md:text-4xl font-bold text-navy mb-2"
            style={{ fontFamily: 'var(--font-poppins)' }}
          >
            BSI History
          </h1>
          <p className="text-teal font-medium text-lg">
            2000 to Present — 25 years of musical mood data
          </p>
        </div>
        <HistoryClient bsiData={bsiData} historicalEvents={historicalEvents} />
      </main>
      <Footer />
    </div>
  )
}
