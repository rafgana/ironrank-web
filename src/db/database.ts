import Dexie from 'dexie'
import type { Workout, WorkoutExercise, SetEntry, Exercise, Routine, RoutineExercise, UserProfile, ActionLog } from '../models/types'

/**
 * Estado de la app (no datos del usuario, solo flags).
 * - onboardingStatus: 'pending' | 'completed' | 'skipped'
 * Migrado a IndexedDB para sobrevivir wipes selectivos de localStorage.
 */
// (Onboarding functions y type eliminados — sin uso tras quitar Onboarding component)
export interface AppState {
  id?: number;
  key: string;
  value: string;
}

export class IronRankDB extends Dexie {
  workouts!: Dexie.Table<Workout, number>
  workoutExercises!: Dexie.Table<WorkoutExercise, number>
  sets!: Dexie.Table<SetEntry, number>
  exercises!: Dexie.Table<Exercise, number>
  routines!: Dexie.Table<Routine, number>
  routineExercises!: Dexie.Table<RoutineExercise, number>
  userProfile!: Dexie.Table<UserProfile, number>
  actionLog!: Dexie.Table<ActionLog, number>
  appState!: Dexie.Table<AppState, number>

  constructor() {
    super('IronRank')

    // ============================================================
    // SCHEMA VERSIONING
    // ============================================================
    // Cada vez que cambies el schema (nueva tabla, índice, etc.),
    // añade una nueva entrada `this.version(N).stores(...)`.
    //
    // Para cambios que requieren transformación de datos (renombrar columna,
    // rellenar defaults, etc.), añade `.upgrade(async (tx) => { ... })`.
    //
    // Para cambios aditivos (nuevas columnas, tablas, índices sin
    // transformar datos existentes), basta con definir el nuevo schema.
    //
    // El `CURRENT_SCHEMA_VERSION` debe incrementarse en cada cambio.
    // ============================================================

    // v1: schema original
    this.version(1).stores({
      workouts: '++id, date',
      workoutExercises: '++id, workoutId, exerciseId',
      sets: '++id, workoutExerciseId, completed',
      exercises: '++id, name, musclePrimary',
      routines: '++id, name',
      routineExercises: '++id, routineId, exerciseId',
      userProfile: '++id',
      actionLog: '++id, timestamp, kind, [kind+timestamp]',
    });

    // v2: añadir appState store (flags del cliente)
    this.version(2).stores({
      workouts: '++id, date',
      workoutExercises: '++id, workoutId, exerciseId',
      sets: '++id, workoutExerciseId, completed',
      exercises: '++id, name, musclePrimary',
      routines: '++id, name',
      routineExercises: '++id, routineId, exerciseId',
      userProfile: '++id',
      actionLog: '++id, timestamp, kind, [kind+timestamp]',
      appState: '++id, &key',
    }).upgrade(async (tx) => {
      try {
        const oldFlag = localStorage.getItem("ironrank.onboarding.completed.v1");
        if (oldFlag) {
          const status = oldFlag === "true" ? "completed" : "skipped";
          await tx.table("appState").put({ key: "onboardingStatus", value: status });
          localStorage.removeItem("ironrank.onboarding.completed.v1");
        }
      } catch {
        /* ignore */
      }
    });

    // v3: ejemplo de cómo añadir una columna con default.
    // (No aplicamos cambios reales aquí, solo dejamos documentado el patrón)
    // this.version(3).stores({...}).upgrade(async (tx) => {
    //   await tx.table('workouts').toCollection().modify((w) => {
    //     if (!w.notes) w.notes = '';
    //   });
    // });
  }
}

export const db = new IronRankDB()

/** Versión actual del schema. Incrementar en cada cambio. */
export const CURRENT_SCHEMA_VERSION = 2;

/** Devuelve la versión actual de la BBDD. Útil para mostrar al usuario si hay upgrade pendiente. */
export async function getCurrentSchemaVersion(): Promise<number> {
  try {
    const row = await db.appState.get({ key: "schemaVersion" });
    if (row) return Number(row.value) || 0;
  } catch {
    /* table may not exist in v0 */
  }
  return 0;
}

/** Setea la versión actual de la BBDD. Llamar después de aplicar migraciones. */
export async function setCurrentSchemaVersion(version: number): Promise<void> {
  try {
    await db.appState.put({ key: "schemaVersion", value: String(version) });
  } catch {
    /* ignore */
  }
}

export async function seedExercises() {
  const count = await db.exercises.count()
  if (count > 0) return
  const res = await fetch(import.meta.env.BASE_URL + 'exercises.json')
  const exercises = await res.json()
  await db.exercises.bulkAdd(exercises)
}

export async function getProfile(): Promise<UserProfile | null> {
  const profiles = await db.userProfile.toArray()
  return profiles[0] ?? null
}
