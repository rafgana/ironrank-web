import { create } from 'zustand'
import type { Routine, RoutineExercise, WeekDay } from '../models/types'
import { db } from '../db/database'
import { logAction } from '../services/actionLog'
import { markDirty } from '../services/sync/syncEngine'
import { validateRoutineName, validateNotes } from '../services/validation'

interface RoutineState {
  routines: Routine[]
  load: () => Promise<void>
  create: (name: string, days?: WeekDay[], notes?: string) => Promise<number | undefined>
  update: (id: number, partial: Partial<Routine>) => Promise<void>
  remove: (id: number) => Promise<void>
  addExercise: (
    routineId: number,
    exerciseId: number,
    order: number,
    extras?: { targetSets?: number; targetReps?: string; targetWeight?: number; targetRest?: number }
  ) => Promise<void>
  updateExercise: (id: number, partial: Partial<RoutineExercise>) => Promise<void>
  removeExercise: (id: number) => Promise<void>
  getExercises: (routineId: number) => Promise<RoutineExercise[]>
}

export const useRoutineStore = create<RoutineState>((set, get) => ({
  routines: [],

  load: async () => {
    const r = await db.routines.orderBy('createdAt').toArray()
    set({ routines: r })
  },

  create: async (name, days = [], notes = '') => {
    const nameError = validateRoutineName(name);
    if (nameError) {
      logAction("routine_create_validation_failed", { error: nameError });
      throw new Error(nameError);
    }
    const notesError = validateNotes(notes);
    if (notesError) {
      logAction("routine_create_validation_failed", { error: notesError });
      throw new Error(notesError);
    }
    const id = await db.routines.add({ name, createdAt: new Date(), days, notes })
    markDirty()
    logAction("routine_created", { name, days: days.join(","), notes: notes || undefined });
    await get().load()
    return id
  },

  update: async (id, partial) => {
    await db.routines.update(id, partial)
    markDirty()
    logAction("routine_updated", partial as Record<string, string | number | null>);
  },

  remove: async (id) => {
    const r = await db.routines.get(id);
    await db.routines.delete(id)
    await db.routineExercises.where('routineId').equals(id).delete()
    markDirty()
    logAction("routine_deleted", { name: r?.name });
    await get().load()
  },

  addExercise: async (routineId, exerciseId, order, extras) => {
    await db.routineExercises.add({
      routineId,
      exerciseId,
      order,
      targetSets: extras?.targetSets,
      targetReps: extras?.targetReps,
      targetWeight: extras?.targetWeight,
      targetRest: extras?.targetRest,
    })
    markDirty()
    const ex = await db.exercises.get(exerciseId);
    logAction("routine_exercise_added", {
      exercise: ex?.name,
      target_sets: extras?.targetSets,
      target_reps: extras?.targetReps,
    });
  },

  updateExercise: async (id, partial) => {
    await db.routineExercises.update(id, partial)
    markDirty()
  },

  removeExercise: async (id) => {
    const re = await db.routineExercises.get(id);
    await db.routineExercises.delete(id)
    markDirty()
    if (re) {
      const ex = await db.exercises.get(re.exerciseId);
      logAction("routine_exercise_removed", { exercise: ex?.name });
    }
  },

  getExercises: async (routineId) => {
    return db.routineExercises.where('routineId').equals(routineId).toArray()
  },
}))
