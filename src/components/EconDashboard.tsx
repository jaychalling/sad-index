'use client'

import { useState } from 'react'
import EconCards from './EconCards'
import BsiChart from './BsiChart'
import type { EconomicIndicators } from '@/data/bsi-data'
import type { EconTimeSeries } from '@/lib/queries'

interface EconDashboardProps {
  indicators: EconomicIndicators
  bsiData: { date: string; bsi: number; avgValence: number }[]
  econData: Record<string, EconTimeSeries[]>
}

export type IndicatorKey = 'sp500' | 'vix' | 'unemployment' | 'consumerSentiment'

// Map card keys to DB indicator keys
export const indicatorDbKey: Record<IndicatorKey, string> = {
  sp500: 'SP500',
  vix: 'VIX',
  unemployment: 'UNRATE',
  consumerSentiment: 'UMCSENT',
}

export default function EconDashboard({ indicators, bsiData, econData }: EconDashboardProps) {
  const [active, setActive] = useState<IndicatorKey>('vix')

  return (
    <>
      <section>
        <h2
          className="text-xl font-bold text-navy mb-4"
          style={{ fontFamily: 'var(--font-poppins)' }}
        >
          Economic Pulse
        </h2>
        <EconCards
          sp500={indicators.sp500}
          vix={indicators.vix}
          unemployment={indicators.unemployment}
          consumerSentiment={indicators.consumerSentiment}
          activeKey={active}
          onSelect={setActive}
        />
      </section>

      <section>
        <BsiChart
          bsiData={bsiData}
          econData={econData}
          activeIndicator={active}
        />
      </section>
    </>
  )
}
