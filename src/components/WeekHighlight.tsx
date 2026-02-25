'use client'

import { Share2, Copy, Check } from 'lucide-react'
import { useState } from 'react'

interface TrackInfo {
  title: string
  artist: string
  valence: number
  rank: number
}

interface WeekHighlightProps {
  weekDate: string
  mostSadTrack: TrackInfo
  mostHappyTrack: TrackInfo
}

function ValenceBar({ valence }: { valence: number; color: string }) {
  const pct = Math.abs(valence - 0.5) / 0.5 * 50
  const isHappy = valence >= 0.5
  return (
    <div className="w-full relative h-4 bg-navy/5 rounded-full border-[2px] border-navy overflow-hidden">
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-navy/25 z-10" />
      {isHappy ? (
        <div
          className="absolute top-0 bottom-0 rounded-r-full transition-all duration-700"
          style={{ left: '50%', width: `${pct}%`, backgroundColor: '#22c55e' }}
        />
      ) : (
        <div
          className="absolute top-0 bottom-0 rounded-l-full transition-all duration-700"
          style={{ right: '50%', width: `${pct}%`, backgroundColor: '#ef4444' }}
        />
      )}
    </div>
  )
}

function TrackCard({
  track,
  type,
}: {
  track: TrackInfo
  type: 'sad' | 'happy'
}) {
  const isSad = type === 'sad'
  return (
    <div
      className={`card-brutal !p-5 ${
        isSad ? 'bg-ocean/10' : 'bg-amber/10'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-3xl">{isSad ? '\u{1F622}' : '\u{1F60E}'}</span>
        <span className="tag-brutal bg-white text-xs">
          #{track.rank} on Hot 100
        </span>
      </div>
      <h4
        className="font-bold text-navy text-lg leading-tight"
        style={{ fontFamily: 'var(--font-poppins)' }}
      >
        {track.title}
      </h4>
      <p className="text-navy/60 text-sm mt-0.5">{track.artist}</p>
      <div className="mt-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold" style={{ color: '#ef4444' }}>Sad</span>
          <div className="flex-1">
            <ValenceBar valence={track.valence} color="" />
          </div>
          <span className="text-[11px] font-bold" style={{ color: '#22c55e' }}>Happy</span>
        </div>
        <p className="text-[10px] text-navy/50 text-center mt-1">Valence: {(track.valence * 100).toFixed(0)}/100</p>
      </div>
    </div>
  )
}

export default function WeekHighlight({
  weekDate,
  mostSadTrack,
  mostHappyTrack,
}: WeekHighlightProps) {
  const [copied, setCopied] = useState(false)

  const shareText = `This week's Sad Index: Most sad track is "${mostSadTrack.title}" by ${mostSadTrack.artist}. Most happy: "${mostHappyTrack.title}" by ${mostHappyTrack.artist}. Check it out at`
  const shareUrl = typeof window !== 'undefined' ? window.location.href : 'https://sadindex.com'

  function handleCopy() {
    navigator.clipboard.writeText(`${shareText} ${shareUrl}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleTweet() {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h2
            className="text-2xl font-bold text-navy"
            style={{ fontFamily: 'var(--font-poppins)' }}
          >
            This Week&apos;s Mood
          </h2>
          <p className="text-sm text-navy/50">Week of {weekDate}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleTweet}
            className="btn-brutal bg-navy text-white text-sm flex items-center gap-1.5"
          >
            <Share2 size={14} /> Post on X
          </button>
          <button
            onClick={handleCopy}
            className="btn-brutal bg-white text-navy text-sm flex items-center gap-1.5"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <TrackCard track={mostSadTrack} type="sad" />
        <TrackCard track={mostHappyTrack} type="happy" />
      </div>
    </div>
  )
}
