import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ThisWeekClient from '@/components/ThisWeekClient'
import { getLatestBsi, getThisWeekTracks } from '@/lib/queries'

export default async function ThisWeekPage() {
  const [currentWeekData, tracks] = await Promise.all([
    getLatestBsi(),
    getThisWeekTracks(),
  ])

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto px-4 py-10 w-full">
        <ThisWeekClient currentWeekData={currentWeekData} tracks={tracks} />
      </main>
      <Footer />
    </div>
  )
}
