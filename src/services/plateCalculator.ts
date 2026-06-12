export function platesFor(totalWeight: number, barWeight: number, availablePlates: number[]): number[] {
  if (totalWeight <= barWeight) return []
  const perSide = (totalWeight - barWeight) / 2
  let remaining = perSide
  const result: number[] = []
  const sorted = [...availablePlates].sort((a, b) => b - a)
  for (const plate of sorted) {
    while (remaining >= plate - 0.01) {
      result.push(plate)
      remaining -= plate
    }
  }
  return result
}

export function platesDescription(weight: number, barWeight: number, availablePlates: number[]): string {
  const plates = platesFor(weight, barWeight, availablePlates)
  if (!plates.length) return 'Solo barra'
  const counts = new Map<number, number>()
  plates.forEach(p => counts.set(p, (counts.get(p) || 0) + 1))
  return Array.from(counts.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([plate, count]) => `${count}x${plate}`)
    .join(' + ') + ' c/lado'
}

export function suggestWeight(target: number, barWeight: number, availablePlates: number[]): number {
  if (target <= barWeight) return barWeight
  const perSide = (target - barWeight) / 2
  const sorted = [...availablePlates].sort((a, b) => b - a)
  let remaining = perSide
  let loaded = 0
  for (const plate of sorted) {
    while (remaining >= plate - 0.01) { loaded += plate; remaining -= plate }
  }
  return barWeight + loaded * 2
}

export function warmupSets(workingWeight: number, barWeight: number): { weight: number; reps: number; label: string }[] {
  const sets: { weight: number; reps: number; label: string }[] = []
  sets.push({ weight: barWeight, reps: 10, label: 'Barra x 10' })
  if (workingWeight >= barWeight + 30) {
    const w1 = barWeight + (workingWeight - barWeight) * 0.3
    sets.push({ weight: Math.round(w1 / 5) * 5, reps: 8, label: `${Math.round(w1 / 5) * 5} x 8` })
  }
  if (workingWeight >= barWeight + 50) {
    const w2 = barWeight + (workingWeight - barWeight) * 0.5
    sets.push({ weight: Math.round(w2 / 5) * 5, reps: 5, label: `${Math.round(w2 / 5) * 5} x 5` })
  }
  if (workingWeight >= barWeight + 70) {
    const w3 = barWeight + (workingWeight - barWeight) * 0.7
    sets.push({ weight: Math.round(w3 / 5) * 5, reps: 3, label: `${Math.round(w3 / 5) * 5} x 3` })
  }
  return sets
}
