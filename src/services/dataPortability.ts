/**
 * Servicio de export/import de datos de IronRank.
 * Formato: JSON portable, versionado, validado.
 * - Export: backup completo de workouts + sets + profile + routines
 * - Import: validación con Zod-like check, merge inteligente (no duplica)
 */
import { db } from "../db/database";
import { track } from "./analytics";
import { logAction } from "./actionLog";
import type {
  Workout,
  WorkoutExercise,
  SetEntry,
  UserProfile,
  Routine,
  RoutineExercise,
  Exercise,
  ActionLog,
} from "../models/types";
import type { AppState } from "../db/database";

const EXPORT_VERSION = 1;
const APP_NAME = "IronRank";

export interface ExportPayload {
  app: typeof APP_NAME;
  version: number;
  exportedAt: string;
  counts: {
    workouts: number;
    sets: number;
    exercises: number;
    routines: number;
    profile: number;
    actionLog: number;
    appState: number;
  };
  data: {
    workouts: Workout[];
    workoutExercises: WorkoutExercise[];
    sets: SetEntry[];
    exercises: Exercise[];
    routines: Routine[];
    routineExercises: RoutineExercise[];
    userProfile: UserProfile[];
    actionLog: ActionLog[];
    appState: AppState[];
  };
}

export interface ImportResult {
  ok: boolean;
  imported: {
    workouts: number;
    sets: number;
    exercises: number;
    routines: number;
    profile: number;
    actionLog: number;
    appState: number;
  };
  skipped: number;
  message: string;
}

function safeJSON<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function validateShape(p: unknown): p is ExportPayload {
  if (!p || typeof p !== "object") return false;
  const o = p as Record<string, unknown>;
  if (o.app !== APP_NAME) return false;
  if (typeof o.version !== "number") return false;
  if (typeof o.exportedAt !== "string") return false;
  if (!o.data || typeof o.data !== "object") return false;
  const d = o.data as Record<string, unknown>;
  return (
    Array.isArray(d.workouts) &&
    Array.isArray(d.workoutExercises) &&
    Array.isArray(d.sets) &&
    Array.isArray(d.exercises) &&
    Array.isArray(d.routines) &&
    Array.isArray(d.routineExercises) &&
    Array.isArray(d.userProfile) &&
    Array.isArray(d.actionLog) &&
    Array.isArray(d.appState)
  );
}

/** Genera un JSON descargable con todos los datos del usuario. */
export async function exportAll(): Promise<{ json: string; filename: string }> {
  const [workouts, workoutExercises, sets, exercises, routines, routineExercises, userProfile, actionLog, appState] =
    await Promise.all([
      db.workouts.toArray(),
      db.workoutExercises.toArray(),
      db.sets.toArray(),
      db.exercises.toArray(),
      db.routines.toArray(),
      db.routineExercises.toArray(),
      db.userProfile.toArray(),
      db.actionLog.toArray(),
      db.appState.toArray(),
    ]);

  const payload: ExportPayload = {
    app: APP_NAME,
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    counts: {
      workouts: workouts.length,
      sets: sets.length,
      exercises: exercises.length,
      routines: routines.length,
      profile: userProfile.length,
      actionLog: actionLog.length,
      appState: appState.length,
    },
    data: {
      workouts,
      workoutExercises,
      sets,
      exercises,
      routines,
      routineExercises,
      userProfile,
      actionLog,
      appState,
    },
  };

  const json = JSON.stringify(payload, null, 2);
  const date = new Date().toISOString().slice(0, 10);
  track("export_data", { workouts: workouts.length, sets: sets.length });
  logAction("export_data", { workouts: workouts.length, sets: sets.length, exercises: exercises.length });
  return { json, filename: `ironrank-backup-${date}.json` };
}

/** Dispara descarga del JSON. */
export function downloadJSON(json: string, filename: string): void {
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Importa datos desde JSON. Merge inteligente:
 * - Exercises: añade solo los que no existan (por nombre)
 * - Routines + routineExercises: añade solo los que no existan (por nombre+exercises)
 * - Workouts: añade solo los que no existan (por date+duration)
 * - UserProfile: reemplaza siempre (es un único perfil)
 */
export async function importAll(json: string): Promise<ImportResult> {
  const parsed = safeJSON<unknown>(json);
  if (!parsed) {
    return { ok: false, imported: { workouts: 0, sets: 0, exercises: 0, routines: 0, profile: 0, actionLog: 0, appState: 0 }, skipped: 0, message: "JSON inválido" };
  }
  if (!validateShape(parsed)) {
    return { ok: false, imported: { workouts: 0, sets: 0, exercises: 0, routines: 0, profile: 0, actionLog: 0, appState: 0 }, skipped: 0, message: "El archivo no es un backup de IronRank válido" };
  }
  if (parsed.version > EXPORT_VERSION) {
    return { ok: false, imported: { workouts: 0, sets: 0, exercises: 0, routines: 0, profile: 0, actionLog: 0, appState: 0 }, skipped: 0, message: `Versión ${parsed.version} no soportada (máx ${EXPORT_VERSION})` };
  }

  const data = parsed.data;
  let imported = { workouts: 0, sets: 0, exercises: 0, routines: 0, profile: 0, actionLog: 0, appState: 0 };
  let skipped = 0;

  // 1. Exercises: dedupe by name
  const existingExercises = await db.exercises.toArray();
  const existingNames = new Set(existingExercises.map((e) => e.name));
  const newExercises = data.exercises.filter((e) => !existingNames.has(e.name));
  if (newExercises.length > 0) {
    await db.exercises.bulkAdd(newExercises.map(({ id: _id, ...rest }) => rest as Exercise));
    imported.exercises = newExercises.length;
  }
  skipped += data.exercises.length - newExercises.length;

  // 2. Routines: dedupe by name
  const existingRoutines = await db.routines.toArray();
  const existingRoutineNames = new Set(existingRoutines.map((r) => r.name));
  const newRoutines = data.routines.filter((r) => !existingRoutineNames.has(r.name));
  if (newRoutines.length > 0) {
    const newIds = await db.routines.bulkAdd(
      newRoutines.map(({ id: _id, ...rest }) => rest as Routine),
      { allKeys: true }
    );
    imported.routines = newRoutines.length;
    // 3. routineExercises: only those linked to new routines
    const newRoutineIds = new Set(newIds);
    const newRoutineExercises = data.routineExercises.filter(
      (re) => newRoutineIds.has(re.routineId) || re.routineId === undefined
    );
    if (newRoutineExercises.length > 0) {
      await db.routineExercises.bulkAdd(
        newRoutineExercises.map(({ id: _id, ...rest }) => rest as RoutineExercise)
      );
    }
  }
  skipped += data.routines.length - newRoutines.length;

  // 4. Workouts: dedupe by (date timestamp + duration + notes)
  const existingWorkouts = await db.workouts.toArray();
  const existingKeys = new Set(
    existingWorkouts.map((w) => `${new Date(w.date).getTime()}|${w.duration}|${w.notes ?? ""}`),
  );
  const newWorkouts = data.workouts.filter(
    (w) => !existingKeys.has(`${new Date(w.date).getTime()}|${w.duration}|${w.notes ?? ""}`),
  );
  if (newWorkouts.length > 0) {
    const newIds = await db.workouts.bulkAdd(
      newWorkouts.map(({ id: _id, ...rest }) => rest as Workout),
      { allKeys: true }
    );
    imported.workouts = newWorkouts.length;

    // 5. workoutExercises: only those linked to new workouts
    const newWorkoutIds = new Set(newIds);
    const newWEs = data.workoutExercises.filter((we) => newWorkoutIds.has(we.workoutId));
    if (newWEs.length > 0) {
      const weIds = await db.workoutExercises.bulkAdd(
        newWEs.map(({ id: _id, ...rest }) => rest as WorkoutExercise),
        { allKeys: true }
      );
      // 6. Sets: only those linked to new workoutExercises
      const newWeIds = new Set(weIds);
      const newSets = data.sets.filter((s) => newWeIds.has(s.workoutExerciseId));
      if (newSets.length > 0) {
        await db.sets.bulkAdd(newSets.map(({ id: _id, ...rest }) => rest as SetEntry));
        imported.sets = newSets.length;
      }
    }
  }
  skipped += data.workouts.length - newWorkouts.length;

  // 7. UserProfile: replace (only one)
  if (data.userProfile.length > 0) {
    await db.userProfile.clear();
    await db.userProfile.bulkAdd(data.userProfile);
    imported.profile = 1;
  }

  // 8. ActionLog: dedupe por timestamp + kind (no ID porque los IDs se regeneran)
  if (data.actionLog && data.actionLog.length > 0) {
    const existingLogs = await db.actionLog.toArray();
    const existingKeys = new Set(
      existingLogs.map((l) => `${l.timestamp}|${l.kind}`),
    );
    const newLogs = data.actionLog.filter(
      (l) => !existingKeys.has(`${l.timestamp}|${l.kind}`),
    );
    if (newLogs.length > 0) {
      await db.actionLog.bulkAdd(
        newLogs.map(({ id: _id, ...rest }) => rest as ActionLog),
      );
      imported.actionLog = newLogs.length;
    }
    skipped += data.actionLog.length - newLogs.length;
  }

  // 9. AppState: dedupe por key
  if (data.appState && data.appState.length > 0) {
    const existingState = await db.appState.toArray();
    const existingKeys = new Set(existingState.map((s) => s.key));
    const newState = data.appState.filter((s) => !existingKeys.has(s.key));
    if (newState.length > 0) {
      await db.appState.bulkAdd(
        newState.map(({ id: _id, ...rest }) => rest as AppState),
      );
      imported.appState = newState.length;
    }
    skipped += data.appState.length - newState.length;
  }

  track("import_data", {
    workouts: imported.workouts,
    sets: imported.sets,
    exercises: imported.exercises,
    skipped,
  });
  logAction("import_data", {
    workouts: imported.workouts,
    sets: imported.sets,
    exercises: imported.exercises,
    skipped,
  });

  return {
    ok: true,
    imported,
    skipped,
    message: `Importado: ${imported.workouts} workouts, ${imported.sets} series, ${imported.exercises} ejercicios${imported.actionLog > 0 ? `, ${imported.actionLog} acciones` : ""}${imported.appState > 0 ? `, ${imported.appState} estados` : ""}${skipped > 0 ? `, ${skipped} duplicados omitidos` : ""}`,
  };
}

/** Borra todos los datos del usuario. Devuelve una promesa que resuelve tras la limpieza. */
export async function wipeAll(): Promise<void> {
  await Promise.all([
    db.workouts.clear(),
    db.workoutExercises.clear(),
    db.sets.clear(),
    db.routines.clear(),
    db.routineExercises.clear(),
    db.userProfile.clear(),
    db.actionLog.clear(),
  ]);
  // Limpiar app state (no hay onboarding desde el switch a auth obligatorio)
  try {
    const { db } = await import("../db/database");
    await db.appState.clear();
  } catch {
    /* ignore */
  }
  // We keep `exercises` (seed library) — re-seed
  const { seedExercises } = await import("../db/database");
  await seedExercises();
  track("wipe_data");
  logAction("wipe_data");
}
