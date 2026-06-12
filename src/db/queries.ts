import { db } from './database'
import { estimatedMax } from '../utils/estimators'

export async function getLastSetsForExercise(exerciseId: number, limit = 5): Promise<import('../models/types').SetEntry[]> {
  const wes = await db.workoutExercises.where('exerciseId').equals(exerciseId).toArray()
  const weIds = wes.map(we => we.id!).filter(Boolean)
  if (!weIds.length) return []

  const workoutIds = [...new Set(wes.map(we => we.workoutId))]
  const workouts = await db.workouts.where('id').anyOf(workoutIds).toArray()
  const sortedWorkouts = workouts.sort((a, b) => +b.date - +a.date).slice(0, limit)

  const result: import('../models/types').SetEntry[] = []
  for (const w of sortedWorkouts) {
    const we = wes.find(we => we.workoutId === w.id)
    if (!we) continue
    const sets = await db.sets.where('workoutExerciseId').equals(we.id!).filter(s => s.completed).sortBy('order')
    result.push(...sets)
  }
  return result
}

export async function bestSetForExercise(exerciseId: number): Promise<import('../models/types').SetEntry | null> {
  const wes = await db.workoutExercises.where('exerciseId').equals(exerciseId).toArray()
  const allSets: import('../models/types').SetEntry[] = []
  for (const we of wes) {
    const sets = await db.sets.where('workoutExerciseId').equals(we.id!).filter(s => s.completed).toArray()
    allSets.push(...sets)
  }
  if (!allSets.length) return null
  return allSets.reduce((best, s) => {
    return estimatedMax(s.weight, s.reps, s.rir) > estimatedMax(best.weight, best.reps, best.rir) ? s : best
  })
}
