export function estimatedMax(weight: number, reps: number, rir: number | null = null): number {
  const effectiveReps = reps + (rir ?? 1)
  if (effectiveReps <= 10) return weight * (1 + effectiveReps / 30)
  return weight * (36 / (37 - effectiveReps))
}

export function relativeStrength(weight: number, bodyweight: number): number {
  if (bodyweight <= 0) return 0
  return weight / Math.pow(bodyweight, 0.67)
}

export function rpeFromRIR(rir: number): number {
  return Math.min(10, Math.max(1, 10 - rir))
}
