'use client'

import { TrendingUp, Activity, Users, Heart } from 'lucide-react'
import type { IndicatorKey } from './EconDashboard'

interface EconIndicator {
  value: number
  change: number
}

interface EconCardsProps {
  sp500: EconIndicator
  vix: EconIndicator
  unemployment: EconIndicator
  consumerSentiment: EconIndicator
  activeKey: IndicatorKey
  onSelect: (key: IndicatorKey) => void
}

const cards = [
  {
    key: 'sp500' as const,
    label: 'S&P 500',
    icon: TrendingUp,
    borderColor: 'border-t-teal',
    accentColor: '#219ebc',
    format: (v: number) => v.toLocaleString(),
    changeFormat: (c: number) => `${c >= 0 ? '+' : ''}${c.toFixed(2)}%`,
  },
  {
    key: 'vix' as const,
    label: 'VIX (Fear Index)',
    icon: Activity,
    borderColor: 'border-t-orange',
    accentColor: '#fb8500',
    format: (v: number) => v.toFixed(2),
    changeFormat: (c: number) => `${c >= 0 ? '+' : ''}${c.toFixed(2)}`,
    invertColor: true,
  },
  {
    key: 'unemployment' as const,
    label: 'Unemployment',
    icon: Users,
    borderColor: 'border-t-amber',
    accentColor: '#ffb703',
    format: (v: number) => `${v.toFixed(2)}%`,
    changeFormat: (c: number) => `${c >= 0 ? '+' : ''}${c.toFixed(2)}%`,
    invertColor: true,
  },
  {
    key: 'consumerSentiment' as const,
    label: 'Consumer Sentiment',
    icon: Heart,
    borderColor: 'border-t-ocean',
    accentColor: '#8ecae6',
    format: (v: number) => v.toFixed(2),
    changeFormat: (c: number) => `${c >= 0 ? '+' : ''}${c.toFixed(2)}`,
  },
]

export default function EconCards({ sp500, vix, unemployment, consumerSentiment, activeKey, onSelect }: EconCardsProps) {
  const data = { sp500, vix, unemployment, consumerSentiment }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const indicator = data[card.key]
        const Icon = card.icon
        const isPositive = indicator.change >= 0
        const colorClass = card.invertColor
          ? isPositive ? 'text-orange' : 'text-teal'
          : isPositive ? 'text-teal' : 'text-orange'
        const isActive = activeKey === card.key

        return (
          <button
            key={card.key}
            onClick={() => onSelect(card.key)}
            className={`card-brutal border-t-[5px] ${card.borderColor} !p-4 text-left transition-all ${
              isActive
                ? 'ring-[3px] ring-navy scale-[1.02] shadow-[6px_6px_0_#023047]'
                : 'hover:scale-[1.01] hover:shadow-[5px_5px_0_#023047] opacity-75 hover:opacity-100'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon size={18} className={isActive ? 'text-navy' : 'text-navy/60'} />
              <span className={`text-xs font-semibold uppercase tracking-wide ${isActive ? 'text-navy' : 'text-navy/60'}`}>
                {card.label}
              </span>
            </div>
            <div className="text-2xl font-bold text-navy" style={{ fontFamily: 'var(--font-poppins)' }}>
              {card.format(indicator.value)}
            </div>
            <div className={`text-sm font-semibold mt-1 ${colorClass}`}>
              {isPositive ? '\u25B2' : '\u25BC'} {card.changeFormat(indicator.change)}
            </div>
          </button>
        )
      })}
    </div>
  )
}
