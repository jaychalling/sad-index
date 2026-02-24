import { TrendingUp, Activity, Users, Heart } from 'lucide-react'

interface EconIndicator {
  value: number
  change: number
}

interface EconCardsProps {
  sp500: EconIndicator
  vix: EconIndicator
  unemployment: EconIndicator
  consumerSentiment: EconIndicator
}

const cards = [
  {
    key: 'sp500' as const,
    label: 'S&P 500',
    icon: TrendingUp,
    borderColor: 'border-t-teal',
    format: (v: number) => v.toLocaleString(),
    changeFormat: (c: number) => `${c >= 0 ? '+' : ''}${c.toFixed(1)}%`,
  },
  {
    key: 'vix' as const,
    label: 'VIX (Fear Index)',
    icon: Activity,
    borderColor: 'border-t-orange',
    format: (v: number) => v.toFixed(1),
    changeFormat: (c: number) => `${c >= 0 ? '+' : ''}${c.toFixed(1)}`,
    invertColor: true, // VIX going up = bad
  },
  {
    key: 'unemployment' as const,
    label: 'Unemployment',
    icon: Users,
    borderColor: 'border-t-amber',
    format: (v: number) => `${v.toFixed(1)}%`,
    changeFormat: (c: number) => `${c >= 0 ? '+' : ''}${c.toFixed(1)}%`,
    invertColor: true, // unemployment going up = bad
  },
  {
    key: 'consumerSentiment' as const,
    label: 'Consumer Sentiment',
    icon: Heart,
    borderColor: 'border-t-ocean',
    format: (v: number) => v.toFixed(1),
    changeFormat: (c: number) => `${c >= 0 ? '+' : ''}${c.toFixed(1)}`,
  },
]

export default function EconCards({ sp500, vix, unemployment, consumerSentiment }: EconCardsProps) {
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

        return (
          <div
            key={card.key}
            className={`card-brutal border-t-[5px] ${card.borderColor} !p-4`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon size={18} className="text-navy/60" />
              <span className="text-xs font-semibold text-navy/60 uppercase tracking-wide">
                {card.label}
              </span>
            </div>
            <div className="text-2xl font-bold text-navy" style={{ fontFamily: 'var(--font-poppins)' }}>
              {card.format(indicator.value)}
            </div>
            <div className={`text-sm font-semibold mt-1 ${colorClass}`}>
              {isPositive ? '\u25B2' : '\u25BC'} {card.changeFormat(indicator.change)}
            </div>
          </div>
        )
      })}
    </div>
  )
}
