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

/**
 * Para cada ejercicio con al menos 1 set completado, devuelve su nombre y mejor set.
 * Usado por el score global (rankedScore) para promediar entre TODOS los ejercicios
 * del usuario, no solo "big three".
 */
export async function bestSetPerExercise(): Promise<Array<{
  exerciseId: number;
  exerciseName: string;
  set: import('../models/types').SetEntry;
}>> {
  const allWe = await db.workoutExercises.toArray();
  if (allWe.length === 0) return [];
  const exerciseIds = Array.from(new Set(allWe.map((w) => w.exerciseId)));
  const exercises = await db.exercises.bulkGet(exerciseIds);
  const exMap = new Map<number, { name: string }>();
  exercises.forEach((e, i) => {
    if (e) exMap.set(exerciseIds[i], { name: e.name });
  });
  // Agrupa WEs por exerciseId
  const byEx = new Map<number, number[]>();
  for (const we of allWe) {
    if (!byEx.has(we.exerciseId)) byEx.set(we.exerciseId, []);
    byEx.get(we.exerciseId)!.push(we.id!);
  }
  // Para cada ejercicio, recoge todos los sets completados y quédate con el mejor
  const result: Array<{
    exerciseId: number;
    exerciseName: string;
    set: import('../models/types').SetEntry;
  }> = [];
  for (const [exId, weIds] of byEx.entries()) {
    const sets: import('../models/types').SetEntry[] = [];
    for (const weId of weIds) {
      const ss = await db.sets
        .where("workoutExerciseId")
        .equals(weId)
        .filter((s) => s.completed)
        .toArray();
      sets.push(...ss);
    }
    if (sets.length === 0) continue;
    const best = sets.reduce((b, s) =>
      estimatedMax(s.weight, s.reps, s.rir) > estimatedMax(b.weight, b.reps, b.rir) ? s : b,
    );
    const exInfo = exMap.get(exId);
    if (!exInfo) continue;
    result.push({
      exerciseId: exId,
      exerciseName: exInfo.name,
      set: best,
    });
  }
  return result;
}
