// ─── National Mood Score: 4-Index Composite ─────────────────────────────────
// NMS = BSI*0.35 + MarketFear*0.25 + ConsumerGloom*0.25 + JobAnxiety*0.15
// All indices normalized to 0-100 (0=bright, 100=dark)

export interface NationalMoodScore {
  nms: number
  musicSadness: number
  marketFear: number
  consumerGloom: number
  jobAnxiety: number
}

// ─── Index Normalization ────────────────────────────────────────────────────

export function vixToFear(vix: number): number {
  return Math.min(100, Math.max(0, (vix - 10) * 2.5))
}

export function umcsentToGloom(umcsent: number): number {
  return Math.min(100, Math.max(0, 100 - umcsent))
}

export function unrateToAnxiety(unrate: number): number {
  return Math.min(100, Math.max(0, (unrate - 2) * 7.7))
}

// ─── NMS Calculation ────────────────────────────────────────────────────────

const WEIGHTS = { bsi: 0.35, fear: 0.25, gloom: 0.25, anxiety: 0.15 }

export function calcNMS(bsi: number, fear: number, gloom: number, anxiety: number): number {
  return Math.round((bsi * WEIGHTS.bsi + fear * WEIGHTS.fear + gloom * WEIGHTS.gloom + anxiety * WEIGHTS.anxiety) * 10) / 10
}

// ─── Labels & Segments ──────────────────────────────────────────────────────

export function getNMSLabel(nms: number): { text: string; color: string } {
  if (nms < 25) return { text: 'Bright', color: '#22c55e' }
  if (nms < 40) return { text: 'Calm', color: '#4ade80' }
  if (nms < 55) return { text: 'Uneasy', color: '#ffb703' }
  if (nms < 70) return { text: 'Troubled', color: '#f87171' }
  return { text: 'Crisis', color: '#ef4444' }
}

export function getMoodLabel(bsi: number): { text: string; color: string } {
  if (bsi < 30) return { text: 'Happy', color: '#22c55e' }
  if (bsi < 50) return { text: 'Mixed', color: '#ffb703' }
  return { text: 'Sad', color: '#ef4444' }
}

export function getMoodEmoji(bsi: number): string {
  if (bsi < 20) return '\u{1F60E}'
  if (bsi < 40) return '\u{1F60A}'
  if (bsi < 60) return '\u{1F610}'
  if (bsi < 80) return '\u{1F614}'
  return '\u{1F622}'
}

export function getSignal(nms: number) {
  if (nms < 25) return {
    level: 'LOW' as const,
    color: '#22c55e',
    description: 'National mood is bright. But when all indices align this positively, it may mask underlying stress — the "calm before the storm."',
  }
  if (nms < 35) return {
    level: 'GUARDED' as const,
    color: '#4ade80',
    description: 'Mostly calm across indices. Some signs of strain may be emerging in one or two areas.',
  }
  if (nms < 50) return {
    level: 'ELEVATED' as const,
    color: '#ffb703',
    description: 'Mixed signals across the 4 indices. The national mood is unsettled — watch for divergence between music and markets.',
  }
  if (nms < 65) return {
    level: 'HIGH' as const,
    color: '#fb8500',
    description: 'Multiple indices showing stress. The national mood is troubled — this pattern has preceded economic downturns.',
  }
  return {
    level: 'SEVERE' as const,
    color: '#ef4444',
    description: 'All indices in distress territory. Historically rare — associated with major crises (2008 GFC, COVID-2020).',
  }
}

// ─── Gauge Segments ─────────────────────────────────────────────────────────

export const nmsSegments = [
  { min: 0, max: 20, label: 'Bright', color: '#22c55e' },
  { min: 20, max: 40, label: 'Calm', color: '#4ade80' },
  { min: 40, max: 60, label: 'Uneasy', color: '#ffb703' },
  { min: 60, max: 80, label: 'Troubled', color: '#f87171' },
  { min: 80, max: 100, label: 'Crisis', color: '#ef4444' },
]

export const bsiSegments = [
  { min: 0, max: 20, label: 'Euphoric', color: '#22c55e' },
  { min: 20, max: 40, label: 'Happy', color: '#4ade80' },
  { min: 40, max: 60, label: 'Mixed', color: '#ffb703' },
  { min: 60, max: 80, label: 'Sad', color: '#f87171' },
  { min: 80, max: 100, label: 'Very Sad', color: '#ef4444' },
]

export const fearSegments = [
  { min: 0, max: 20, label: 'Calm', color: '#22c55e' },
  { min: 20, max: 40, label: 'Normal', color: '#4ade80' },
  { min: 40, max: 60, label: 'Elevated', color: '#ffb703' },
  { min: 60, max: 80, label: 'High Fear', color: '#f87171' },
  { min: 80, max: 100, label: 'Extreme', color: '#ef4444' },
]

export const gloomSegments = [
  { min: 0, max: 20, label: 'Optimistic', color: '#22c55e' },
  { min: 20, max: 40, label: 'Content', color: '#4ade80' },
  { min: 40, max: 60, label: 'Uncertain', color: '#ffb703' },
  { min: 60, max: 80, label: 'Pessimistic', color: '#f87171' },
  { min: 80, max: 100, label: 'Despair', color: '#ef4444' },
]

export const anxietySegments = [
  { min: 0, max: 20, label: 'Strong Jobs', color: '#22c55e' },
  { min: 20, max: 40, label: 'Healthy', color: '#4ade80' },
  { min: 40, max: 60, label: 'Moderate', color: '#ffb703' },
  { min: 60, max: 80, label: 'Stressed', color: '#f87171' },
  { min: 80, max: 100, label: 'Crisis', color: '#ef4444' },
]

// ─── Chart Colors ───────────────────────────────────────────────────────────

export const indexColors = {
  bsi: '#219ebc',
  fear: '#fb8500',
  gloom: '#ffb703',
  anxiety: '#8ecae6',
  nms: '#023047',
} as const

export const indexLabels = {
  bsi: 'Music Sadness',
  fear: 'Market Fear',
  gloom: 'Consumer Gloom',
  anxiety: 'Job Anxiety',
  nms: 'National Mood',
} as const
