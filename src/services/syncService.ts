/**
 * Supabase sync (opcional)
 *
 * Para activar:
 *  1. Crear un proyecto en supabase.com
 *  2. Crear las tablas (ver supabase/schema.sql en este archivo)
 *  3. Definir VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env.local
 *  4. Habilitar Google OAuth en Supabase Auth
 *
 * Sin variables de entorno, el sync queda desactivado y la app sigue 100% local.
 *
 * Tablas Supabase necesarias:
 *   - users_profile: row 1:1 con auth.users
 *     id (uuid, PK, FK auth.users.id)
 *     age, gender, bodyweight, height, rest_timer_default, use_kg
 *     created_at, updated_at
 *   - workouts: id (bigint PK), user_id, date, duration, notes
 *   - workout_exercises: id, workout_id, exercise_id, order
 *   - sets: id, workout_exercise_id, weight, reps, rir, note, order, completed
 *   - exercises: id, name, muscle_primary, muscle_secondary, equipment, instructions
 *
 * Estrategia: pull-then-merge. Al login, descarga todo y reemplaza local. Al workout,
 * sube en background. Conflictos se resuelven con "remote wins" (last-write-wins).
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSyncEnabled = (): boolean => {
  return Boolean(SUPABASE_URL && SUPABASE_KEY);
};

export const getSupabaseConfig = () => ({
  url: SUPABASE_URL,
  key: SUPABASE_KEY,
});

interface SyncResult {
  ok: boolean;
  message: string;
  workouts?: number;
}

export async function syncUp(): Promise<SyncResult> {
  if (!isSyncEnabled()) {
    return { ok: false, message: "Sync no configurado" };
  }
  // TODO: implementar cuando se configure Supabase.
  // Pseudocódigo:
  // 1. const { data: { user } } = await supabase.auth.getUser();
  // 2. const workouts = await db.workouts.toArray();
  // 3. for (const w of workouts) await supabase.from('workouts').upsert(...)
  return { ok: false, message: "Sync aún no implementado" };
}

export async function syncDown(): Promise<SyncResult> {
  if (!isSyncEnabled()) {
    return { ok: false, message: "Sync no configurado" };
  }
  return { ok: false, message: "Sync aún no implementado" };
}

export async function signInWithGoogle(): Promise<SyncResult> {
  if (!isSyncEnabled()) {
    return {
      ok: false,
      message:
        "Sync desactivado. Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env.local para activarlo.",
    };
  }
  return { ok: false, message: "Auth aún no implementado" };
}

export async function signOut(): Promise<void> {
  // Limpiar sesión local aunque sync esté desactivado
}
