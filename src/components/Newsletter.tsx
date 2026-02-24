'use client'

import { useState } from 'react'
import { Mail, CheckCircle } from 'lucide-react'

export default function Newsletter() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    // In a real app, this would call an API
    setSubmitted(true)
  }

  return (
    <div
      className="card-brutal !bg-gradient-to-br from-amber/30 via-ocean/20 to-ocean/30 text-center"
    >
      <Mail size={36} className="mx-auto text-navy mb-3" />
      <h2
        className="text-2xl font-bold text-navy mb-2"
        style={{ fontFamily: 'var(--font-poppins)' }}
      >
        Get Weekly BSI Updates
      </h2>
      <p className="text-navy/70 text-sm mb-5 max-w-md mx-auto">
        Every Monday, get the latest Billboard Sadness Index, mood analysis, and what it might mean for the economy. No spam, unsubscribe anytime.
      </p>

      {submitted ? (
        <div className="flex items-center justify-center gap-2 text-teal font-semibold">
          <CheckCircle size={20} />
          <span>You&apos;re in! Check your inbox.</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="flex-1 px-4 py-3 rounded-lg border-[3px] border-navy bg-white text-navy placeholder:text-navy/40 font-medium focus:outline-none focus:ring-2 focus:ring-teal focus:ring-offset-2"
            style={{ boxShadow: '2px 2px 0 #023047' }}
          />
          <button
            type="submit"
            className="btn-brutal bg-orange text-white font-bold px-6 py-3 hover:bg-orange/90"
          >
            Subscribe
          </button>
        </form>
      )}
    </div>
  )
}
