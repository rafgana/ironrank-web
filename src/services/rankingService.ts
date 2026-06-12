import { TIERS, type Tier } from '../models/types'
import { estimatedMax, relativeStrength } from '../utils/estimators'

interface Threshold {
  tier: Tier
  minRatio: number
}

export function getThresholds(exerciseName: string, gender: string, age: number): Threshold[] {
  const defaultThresholds: Threshold[] = [
    { tier: 'Bronce', minRatio: 0 },
    { tier: 'Plata', minRatio: 0.6 },
    { tier: 'Oro', minRatio: 0.8 },
    { tier: 'Platino', minRatio: 1.0 },
    { tier: 'Esmeralda', minRatio: 1.2 },
    { tier: 'Diamante', minRatio: 1.4 },
    { tier: 'Retador', minRatio: 1.6 },
  ]
  return defaultThresholds
}

export function tierFor(rm: number, bodyweight: number, gender: string, age: number, exerciseName: string): Tier {
  const rel = relativeStrength(rm, bodyweight)
  const thresholds = getThresholds(exerciseName, gender, age)
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (rel >= thresholds[i].minRatio) return thresholds[i].tier
  }
  return 'Bronce'
}

export function nextMilestone(rm: number, bodyweight: number, gender: string, age: number, exerciseName: string): { nextTier: Tier; weightNeeded: number } | null {
  const current = tierFor(rm, bodyweight, gender, age, exerciseName)
  const idx = TIERS.indexOf(current)
  if (idx < 0 || idx >= TIERS.length - 1) return null
  const nextTier = TIERS[idx + 1]
  const thresholds = getThresholds(exerciseName, gender, age)
  const next = thresholds.find(t => t.tier === nextTier)
  if (!next) return null
  const neededRel = next.minRatio
  const needed = neededRel * Math.pow(bodyweight, 0.67)
  const diff = needed - rm
  return { nextTier, weightNeeded: Math.max(0, Math.round(diff * 10) / 10) }
}

export function rankedScore(benchRM: number, squatRM: number, deadliftRM: number, bodyweight: number): number {
  const benchRel = relativeStrength(benchRM, bodyweight)
  const squatRel = relativeStrength(squatRM, bodyweight)
  const deadRel = relativeStrength(deadliftRM, bodyweight)
  return Math.min(1, Math.max(0, (benchRel / 2.5) * 0.4 + (squatRel / 3.0) * 0.35 + (deadRel / 3.5) * 0.25))
}

export function tierFromScore(score: number): Tier {
  const map: [Tier, number][] = [
    ['Retador', 0.95], ['Diamante', 0.80], ['Esmeralda', 0.65],
    ['Platino', 0.50], ['Oro', 0.35], ['Plata', 0.20], ['Bronce', 0]
  ]
  return map.find(([_, min]) => score >= min)![0]
}
