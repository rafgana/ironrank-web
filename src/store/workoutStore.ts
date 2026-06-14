import { create } from 'zustand'
import { db, getProfile } from '../db/database'
import type { Workout, WorkoutExercise, SetEntry, Exercise, UserProfile, PRType } from '../models/types'
import { suggestNext, detectPR } from '../services/progressionService'
import { getLastSetsForExercise } from '../db/queries'
import { track } from '../services/analytics'
import { logAction } from '../services/actionLog'
import { markDirty } from '../services/sync/syncEngine'

interface WorkoutState {
  workouts: Workout[]
  activeWorkout: Workout | null
  activeExercises: { we: WorkoutExercise; exercise: Exercise; sets: SetEntry[] }[]
  restTimer: number
  isResting: boolean
  /** Timestamp (Date.now()) cuando empezó el descanso actual. null = no activo. */
  restStartTimestamp: number | null
  /** Duración total del descanso actual en segundos. */
  restDuration: number
  showPR: PRType | null
  profile: UserProfile | null

  loadProfile: () => Promise<void>
  loadWorkouts: () => Promise<void>
  loadActiveWorkout: () => Promise<boolean | undefined>
  startWorkout: (routineId?: number, copyFromWorkoutId?: number) => Promise<void>
  addExercise: (exerciseId: number) => Promise<void>
  addSet: (weight: number, reps: number, rir: number | null) => Promise<void>
  toggleSet: (setId: number) => Promise<void>
  removeSet: (setId: number) => Promise<void>
  removeExercise: (weId: number) => Promise<void>
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
  restStartTimestamp: null,
  restDuration: 0,
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

  /**
   * Carga el workout activo desde BBDD (recovery tras cerrar la app).
   * Detecta un workout sin duration o con duration <60s como potencialmente
   * abandonado. Si existe, lo restaura con todos sus exercises y sets.
   */
  loadActiveWorkout: async () => {
    // Workout activo = el más reciente que no esté cerrado (duration <= 60s)
    const all = await db.workouts.toArray();
    if (all.length === 0) return;
    const sorted = all.sort((a, b) => +new Date(b.date) - +new Date(a.date));
    // Buscar el primer workout "incompleto": duration es 0 o muy bajo
    // Y fue creado hace menos de 7 días (no resurrectar workouts viejos)
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const candidate = sorted.find(
      (w) => w.duration < 60 && +new Date(w.date) > sevenDaysAgo
    );
    if (!candidate) return;
    // Cargar WEs y sets
    const wes = await db.workoutExercises
      .where("workoutId")
      .equals(candidate.id!)
      .sortBy("order");
    if (wes.length === 0) return; // workout vacío abandonado
    const exIds = wes.map((we) => we.exerciseId);
    const exs = await db.exercises.bulkGet(exIds);
    const activeExercises: WorkoutState["activeExercises"] = [];
    for (const we of wes) {
      const exercise = exs.find((e) => e?.id === we.exerciseId);
      if (!exercise) continue;
      const sets = await db.sets
        .where("workoutExerciseId")
        .equals(we.id!)
        .sortBy("order");
      activeExercises.push({ we, exercise, sets });
    }
    set({
      activeWorkout: candidate,
      activeExercises,
    });
    // Restaurar rest timer si estaba activo y no ha expirado
    if (candidate.restStartTimestamp && candidate.restDuration) {
      const elapsed = (Date.now() - candidate.restStartTimestamp) / 1000;
      if (elapsed < candidate.restDuration) {
        // Aún dentro del tiempo de descanso — restaurar
        set({
          restStartTimestamp: candidate.restStartTimestamp,
          restDuration: candidate.restDuration,
          restTimer: candidate.restDuration,
          isResting: true,
        });
      } else {
        // Ya expiró mientras la app estaba cerrada — limpiar
        await db.workouts.update(candidate.id!, { restStartTimestamp: null, restDuration: 0 });
      }
    }
    // Devolver el flag para que App.tsx sepa que se restauró
    return true;
  },

  startWorkout: async (routineId?: number, copyFromWorkoutId?: number) => {
    const id = await db.workouts.add({ date: new Date(), duration: 0, notes: '' })
    const workout = { id, date: new Date(), duration: 0, notes: '' }
    set({ activeWorkout: workout, activeExercises: [], restTimer: 0, isResting: false, restStartTimestamp: null, restDuration: 0 })
    logAction("workout_started", { routineId, copyFromWorkoutId })
    markDirty()

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
    } else if (copyFromWorkoutId) {
      // Smash session: clonar los ejercicios del último workout, sin sets (los añade el user)
      const srcWEs = await db.workoutExercises.where('workoutId').equals(copyFromWorkoutId).toArray()
      for (const we of srcWEs.sort((a, b) => a.order - b.order)) {
        const weId = await db.workoutExercises.add({ workoutId: id, exerciseId: we.exerciseId, order: we.order })
        const exercise = await db.exercises.get(we.exerciseId)
        if (exercise) {
          const s = get()
          set({ activeExercises: [...s.activeExercises, { we: { id: weId, workoutId: id, exerciseId: we.exerciseId, order: we.order }, exercise, sets: [] }] })
        }
      }
    }
  },

  addExercise: async (exerciseId) => {
    const s = get()
    if (!s.activeWorkout) return
    const order = s.activeExercises.length
    const weId = await db.workoutExercises.add({ workoutId: s.activeWorkout.id!, exerciseId, order })
    const exercise = await db.exercises.get(exerciseId)
    if (exercise) {
      set({ activeExercises: [...s.activeExercises, { we: { id: weId, workoutId: s.activeWorkout.id!, exerciseId, order }, exercise, sets: [] }] })
    }
    markDirty()
  },

  addSet: async (weight, reps, rir) => {
    const s = get()
    if (!s.activeWorkout || !s.activeExercises.length) return
    const current = s.activeExercises[s.activeExercises.length - 1]
    /* Un set recién añadido cuenta como completado: el usuario ya rellenó
       peso + reps. El checkbox sirve para desmarcarlo si se equivocó. */
    const setId = await db.sets.add({
      workoutExerciseId: current.we.id!,
      weight, reps, rir, note: null, order: current.sets.length,
      completed: true, isDropSet: false, supersetGroupId: null
    })

    // Check PR
    const history = await getLastSetsForExercise(current.exercise.id!, 50)
    const newSet: SetEntry = { id: setId, workoutExerciseId: current.we.id!, weight, reps, rir, note: null, order: current.sets.length, completed: true, isDropSet: false, supersetGroupId: null }
    const pr = detectPR(current.exercise.id!, newSet, history)
    if (pr) {
      set({ showPR: pr })
      const prProps: Record<string, string | number> = {
        exercise: current.exercise.name,
        kind: pr.kind,
      }
      if ("weight" in pr) prProps.weight = pr.weight;
      if ("new" in pr) prProps.value = pr.new;
      track("pr_set", prProps)
      logAction("pr_set", {
        exercise: current.exercise.name,
        kind: pr.kind,
        weight: "weight" in pr ? pr.weight : undefined,
        value: "new" in pr ? pr.new : undefined,
        reps,
      }, current.exercise.name);
    }
    track("set_logged", { exercise: current.exercise.name, weight, reps })
    logAction("set_logged", { exercise: current.exercise.name, weight, reps, rir }, current.exercise.name);

    // Reload exercises
    const updated = [...s.activeExercises]
    const idx = updated.findIndex(e => e.we.id === current.we.id)
    if (idx >= 0) {
      updated[idx] = { ...updated[idx], sets: [...updated[idx].sets, newSet] }
    }
    set({ activeExercises: updated })
    get().startRestTimer()
    markDirty()
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
    markDirty()
  },

  removeSet: async (setId) => {
    const s = get()
    const exIdx = s.activeExercises.findIndex(e => e.sets.some(set => set.id === setId))
    if (exIdx < 0) return
    try {
      await db.sets.delete(setId)
    } catch {
      /* ignore */
    }
    const updated = [...s.activeExercises]
    updated[exIdx] = {
      ...updated[exIdx],
      sets: updated[exIdx].sets.filter(set => set.id !== setId),
    }
    set({ activeExercises: updated })
    markDirty()
  },

  removeExercise: async (weId) => {
    const s = get()
    const exIdx = s.activeExercises.findIndex(e => e.we.id === weId)
    if (exIdx < 0) return
    try {
      // Borrar sets primero
      const sets = s.activeExercises[exIdx].sets.map(set => set.id!).filter(Boolean)
      if (sets.length > 0) await db.sets.bulkDelete(sets)
      await db.workoutExercises.delete(weId)
    } catch {
      /* ignore */
    }
    const updated = s.activeExercises.filter(e => e.we.id !== weId)
    set({ activeExercises: updated })
    markDirty()
  },

  completeWorkout: async () => {
    const s = get()
    if (!s.activeWorkout) return
    const duration = Math.floor((+new Date() - +s.activeWorkout.date) / 1000)
    const totalSets = s.activeExercises.reduce((acc, e) => acc + e.sets.filter(x => x.completed).length, 0)
    const exerciseCount = s.activeExercises.length
    const exercises = s.activeExercises.map((e) => e.exercise.name);
    await db.workouts.update(s.activeWorkout.id!, { duration })
    set({ activeWorkout: null, activeExercises: [], restTimer: 0, isResting: false, restStartTimestamp: null, restDuration: 0, showPR: null })
    await get().loadWorkouts()
    markDirty()
    track("workout_completed", { duration_seconds: duration, exercises: exerciseCount, sets: totalSets })
    logAction("workout_completed", {
      duration_seconds: duration,
      exercises: exerciseCount,
      sets: totalSets,
      exercise_list: exercises.join(", "),
    })
  },

  startRestTimer: () => {
    const p = get().profile
    const d = p?.restTimerDefault ?? 90
    const ts = Date.now()
    set({
      restStartTimestamp: ts,
      restDuration: d,
      restTimer: d, // legacy field — actualízalo el componente
      isResting: true,
    })
    // Persistir en el Workout row para sobrevivir a refresh / cierre
    const aw = get().activeWorkout
    if (aw?.id != null) {
      db.workouts.update(aw.id, { restStartTimestamp: ts, restDuration: d })
    }
  },

  stopRestTimer: () => {
    set({
      restStartTimestamp: null,
      restDuration: 0,
      restTimer: 0,
      isResting: false,
    })
    // Limpiar persistencia
    const aw = get().activeWorkout
    if (aw?.id != null) {
      db.workouts.update(aw.id, { restStartTimestamp: null, restDuration: 0 })
    }
  },

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
