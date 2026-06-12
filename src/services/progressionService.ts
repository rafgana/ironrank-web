import { estimatedMax } from '../utils/estimators'
import type { SetEntry, ProgressionSuggestion, PRType } from '../models/types'

export function suggestNext(lastSets: SetEntry[]): ProgressionSuggestion | null {
  const completed = lastSets.filter(s => s.completed)
  if (!completed.length) return null
  const last = completed[completed.length - 1]
  const rirs = completed.map(s => s.rir).filter(Boolean) as number[]
  const avgRIR = rirs.length ? rirs.reduce((a, b) => a + b, 0) / rirs.length : 1

  if (avgRIR >= 3) return { weight: last.weight + 5, reps: last.reps, reason: 'Muy facil: sube peso' }
  if (avgRIR >= 2) return { weight: last.weight + 2.5, reps: last.reps, reason: 'Sube a ' + (last.weight + 2.5).toFixed(1) }
  if (avgRIR >= 1) return { weight: last.weight, reps: last.reps + 1, reason: `Mismo peso, ${last.reps + 1} reps` }
  return { weight: last.weight - 2.5, reps: last.reps, reason: 'Al fallo: baja o iguala' }
}

export function detectPR(exerciseId: number, newSet: SetEntry, history: SetEntry[]): PRType | null {
  const completed = history.filter(s => s.id !== newSet.id && s.completed)
  if (!completed.length) return null

  const allMax = completed.map(s => estimatedMax(s.weight, s.reps, s.rir))
  const bestMax = Math.max(...allMax)
  const newMax = estimatedMax(newSet.weight, newSet.reps, newSet.rir)
  if (newMax > bestMax && bestMax > 0) return { kind: '1rm', old: bestMax, new: newMax }

  const sameWeight = completed.filter(s => Math.abs(s.weight - newSet.weight) < 1)
  const bestReps = sameWeight.map(s => s.reps)
  const maxReps = Math.max(...bestReps, 0)
  if (newSet.reps > maxReps && maxReps > 0) return { kind: 'reps', weight: newSet.weight, old: maxReps, new: newSet.reps }

  const bestVol = Math.max(...completed.map(s => s.weight * s.reps))
  const newVol = newSet.weight * newSet.reps
  if (newVol > bestVol && bestVol > 0) return { kind: 'volume', old: bestVol, new: newVol }

  return null
}
