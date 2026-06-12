import { create } from 'zustand'
import { db, getProfile } from '../db/database'
import type { Workout, WorkoutExercise, SetEntry, Exercise, UserProfile, PRType } from '../models/types'
import { suggestNext, detectPR } from '../services/progressionService'
import { getLastSetsForExercise } from '../db/queries'

interface WorkoutState {
  workouts: Workout[]
  activeWorkout: Workout | null
  activeExercises: { we: WorkoutExercise; exercise: Exercise; sets: SetEntry[] }[]
  restTimer: number
  isResting: boolean
  showPR: PRType | null
  profile: UserProfile | null

  loadProfile: () => Promise<void>
  loadWorkouts: () => Promise<void>
  startWorkout: (routineId?: number) => Promise<void>
  addSet: (weight: number, reps: number, rir: number | null) => Promise<void>
  toggleSet: (setId: number) => Promise<void>
  completeWorkout: () => Promise<void>
  startRestTimer: () => void
  stopRestTimer: () => void
  dismissPR: () => void
  lastHistory: (exerciseId: number) => Promise<string>
  suggestion: (exerciseId: number) => Promise<string | null>
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  workouts: [],
  activeWorkout: null,
  activeExercises: [],
  restTimer: 0,
  isResting: false,
  showPR: null,
  profile: null,

  loadProfile: async () => {
    const p = await getProfile()
    set({ profile: p })
  },

  loadWorkouts: async () => {
    const w = await db.workouts.orderBy('date').reverse().toArray()
    set({ workouts: w })
  },

  startWorkout: async (routineId?: number) => {
    const id = await db.workouts.add({ date: new Date(), duration: 0, notes: '' })
    const workout = { id, date: new Date(), duration: 0, notes: '' }
    set({ activeWorkout: workout, activeExercises: [], restTimer: 0, isResting: false })

    if (routineId) {
      const res = await db.routineExercises.where('routineId').equals(routineId).toArray()
      for (const re of res.sort((a, b) => a.order - b.order)) {
        const weId = await db.workoutExercises.add({ workoutId: id, exerciseId: re.exerciseId, order: re.order })
        const exercise = await db.exercises.get(re.exerciseId)
        if (exercise) {
          const s = get()
          set({ activeExercises: [...s.activeExercises, { we: { id: weId, workoutId: id, exerciseId: re.exerciseId, order: re.order }, exercise, sets: [] }] })
        }
      }
    }
  },

  addSet: async (weight, reps, rir) => {
    const s = get()
    if (!s.activeWorkout || !s.activeExercises.length) return
    const current = s.activeExercises[s.activeExercises.length - 1]
    const setId = await db.sets.add({
      workoutExerciseId: current.we.id!,
      weight, reps, rir, note: null, order: current.sets.length,
      completed: false, isDropSet: false, supersetGroupId: null
    })

    // Check PR
    const history = await getLastSetsForExercise(current.exercise.id!, 50)
    const newSet: SetEntry = { id: setId, workoutExerciseId: current.we.id!, weight, reps, rir, note: null, order: current.sets.length, completed: false, isDropSet: false, supersetGroupId: null }
    const pr = detectPR(current.exercise.id!, newSet, history)
    if (pr) set({ showPR: pr })

    // Reload exercises
    const updated = [...s.activeExercises]
    const idx = updated.findIndex(e => e.we.id === current.we.id)
    if (idx >= 0) {
      updated[idx] = { ...updated[idx], sets: [...updated[idx].sets, newSet] }
    }
    set({ activeExercises: updated })
    get().startRestTimer()
  },

  toggleSet: async (setId) => {
    const s = get()
    const currentSets = s.activeExercises.find(e => e.sets.some(set => set.id === setId))
    if (!currentSets) return
    const setToToggle = currentSets.sets.find(set => set.id === setId)
    if (!setToToggle) return
    setToToggle.completed = !setToToggle.completed
    await db.sets.update(setId, { completed: setToToggle.completed })
    set({ activeExercises: [...s.activeExercises] })
  },

  completeWorkout: async () => {
    const s = get()
    if (!s.activeWorkout) return
    const duration = Math.floor((+new Date() - +s.activeWorkout.date) / 1000)
    await db.workouts.update(s.activeWorkout.id!, { duration })
    set({ activeWorkout: null, activeExercises: [], restTimer: 0, isResting: false, showPR: null })
    await get().loadWorkouts()
  },

  startRestTimer: () => {
    const p = get().profile
    const d = p?.restTimerDefault ?? 90
    set({ restTimer: d, isResting: true })
  },

  stopRestTimer: () => set({ restTimer: 0, isResting: false }),

  dismissPR: () => set({ showPR: null }),

  lastHistory: async (exerciseId) => {
    const sets = await getLastSetsForExercise(exerciseId, 3)
    if (!sets.length) return ''
    return sets.map(s => `${s.weight.toFixed(1)}x${s.reps}`).join(', ')
  },

  suggestion: async (exerciseId) => {
    const sets = await getLastSetsForExercise(exerciseId, 5)
    const sug = suggestNext(sets)
    return sug?.reason ?? null
  },
}))
