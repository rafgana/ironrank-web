import { create } from 'zustand'
import type { Routine, RoutineExercise } from '../models/types'
import { db } from '../db/database'

interface RoutineState {
  routines: Routine[]
  load: () => Promise<void>
  create: (name: string) => Promise<number | undefined>
  remove: (id: number) => Promise<void>
  addExercise: (routineId: number, exerciseId: number, order: number) => Promise<void>
  getExercises: (routineId: number) => Promise<RoutineExercise[]>
}

export const useRoutineStore = create<RoutineState>((set, get) => ({
  routines: [],

  load: async () => {
    const r = await db.routines.orderBy('createdAt').toArray()
    set({ routines: r })
  },

  create: async (name) => {
    return db.routines.add({ name, createdAt: new Date() })
  },

  remove: async (id) => {
    await db.routines.delete(id)
    await db.routineExercises.where('routineId').equals(id).delete()
    await get().load()
  },

  addExercise: async (routineId, exerciseId, order) => {
    await db.routineExercises.add({ routineId, exerciseId, order })
  },

  getExercises: async (routineId) => {
    return db.routineExercises.where('routineId').equals(routineId).toArray()
  },
}))
