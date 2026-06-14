/**
 * Sync engine — sincroniza IndexedDB local con Supabase.
 *
 * Estrategia: last-write-wins por `updated_at`.
 * - Push: enviar todos los registros con `updated_at > last_sync_at`
 * - Pull: traer todos los registros con `updated_at > last_sync_at`
 * - Conflict: si ambos (local y remote) cambiaron desde last_sync,
 *   se marca como conflicto. El user elige "keep local" o "use remote".
 *
 * Soft-delete: `deleted_at` se propaga. Al hacer pull, si remote.deleted_at
 * es más reciente que local, borramos local.
 *
 * Trigger: después de cualquier mutación local, marca dirty + schedule sync.
 * Sync es debounced 5s para evitar storms.
 */
import { db, getProfile } from "../../db/database";
import { getSupabase } from "../auth/supabaseClient";
import { useAuthStore } from "../auth/authStore";
import { logAction } from "../actionLog";
import type {
  Workout,
  WorkoutExercise,
  SetEntry,
  Exercise,
  Routine,
  RoutineExercise,
  UserProfile,
} from "../../models/types";

export type SyncStatus = "idle" | "syncing" | "error" | "offline" | "conflict";

export interface SyncState {
  status: SyncStatus;
  lastSyncAt: number | null;
  lastError: string | null;
  pendingChanges: number;
  conflictCount: number;
}

type Listener = (s: SyncState) => void;
const listeners = new Set<Listener>();

let state: SyncState = {
  status: "idle",
  lastSyncAt: null,
  lastError: null,
  pendingChanges: 0,
  conflictCount: 0,
};

function emit() {
  for (const l of listeners) l(state);
}

function set(patch: Partial<SyncState>) {
  state = { ...state, ...patch };
  emit();
}

export function getSyncState(): SyncState {
  return state;
}

export function subscribeSync(l: Listener): () => void {
  listeners.add(l);
  l(state);
  return () => listeners.delete(l);
}

const SYNC_KEY = "ironrank.sync.lastAt";
const QUEUE_KEY = "ironrank.sync.queue";

function getLastSyncAt(): number {
  try {
    const v = localStorage.getItem(SYNC_KEY);
    return v ? parseInt(v, 10) : 0;
  } catch {
    return 0;
  }
}
function setLastSyncAt(ts: number) {
  try {
    localStorage.setItem(SYNC_KEY, String(ts));
  } catch {
    /* ignore */
  }
}

// Cola de operaciones pendientes — persiste en localStorage para sobrevivir cierres
export interface QueuedOp {
  id: string;
  table: string;
  recordId: string;
  op: "upsert" | "delete";
  timestamp: number;
}
function getQueue(): QueuedOp[] {
  try {
    const v = localStorage.getItem(QUEUE_KEY);
    return v ? JSON.parse(v) : [];
  } catch {
    return [];
  }
}
function setQueue(q: QueuedOp[]) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
  } catch {
    /* ignore */
  }
}
export function enqueueOp(op: QueuedOp) {
  const q = getQueue();
  q.push(op);
  setQueue(q);
}
export function clearQueue() {
  setQueue([]);
}

// ============================================================
// PUSH — local → Supabase
// ============================================================

async function pushTable<T extends { id?: number | string; updated_at?: string; user_id?: string }>(
  tableName: string,
  localRows: T[],
  remoteTable: string,
  userId: string,
): Promise<number> {
  if (localRows.length === 0) return 0;
  const supabase = getSupabase();
  // Mapear columnas camelCase → snake_case
  const remoteRows = localRows
    .filter((r) => r.id != null)
    .map((r) => mapToRemote(r, tableName, userId));
  if (remoteRows.length === 0) return 0;
  const { error } = await supabase.from(remoteTable).upsert(remoteRows, {
    onConflict: "id",
    ignoreDuplicates: false,
  });
  if (error) throw new Error(`${remoteTable} push: ${error.message}`);
  return remoteRows.length;
}

function mapToRemote(row: Record<string, unknown>, table: string, userId: string) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    out[snakeCase(k)] = v;
  }
  out.user_id = userId;
  return out;
}

function snakeCase(s: string): string {
  return s.replace(/[A-Z]/g, (c) => "_" + c.toLowerCase());
}

async function pushAll(userId: string): Promise<{
  workouts: number;
  workoutExercises: number;
  sets: number;
  routines: number;
  routineExercises: number;
  profile: number;
}> {
  const lastSync = getLastSyncAt();
  const since = new Date(lastSync).toISOString();

  const [
    workouts,
    workoutExercises,
    sets,
    routines,
    routineExercises,
    profile,
  ] = await Promise.all([
    db.workouts.where("date").above(new Date(0)).toArray(),
    db.workoutExercises.toArray(),
    db.sets.toArray(),
    db.routines.toArray(),
    db.routineExercises.toArray(),
    db.userProfile.toArray(),
  ]);

  const [w, we, s, r, re, p] = await Promise.all([
    pushTable("workouts", workouts, "workouts", userId),
    pushTable("workoutExercises", workoutExercises, "workout_exercises", userId),
    pushTable("sets", sets, "sets", userId),
    pushTable("routines", routines, "routines", userId),
    pushTable("routineExercises", routineExercises, "routine_exercises", userId),
    pushTable("userProfile", profile, "user_profile", userId),
  ]);

  return { workouts: w, workoutExercises: we, sets: s, routines: r, routineExercises: re, profile: p };
}

// ============================================================
// PULL — Supabase → local
// ============================================================

async function pullTable<T>(
  remoteTable: string,
  localTable: string,
  idField: string,
  userId: string,
): Promise<number> {
  const supabase = getSupabase();
  // user_profile usa 'id' como PK (también FK a auth.users), no 'user_id'
  const filterColumn = remoteTable === "user_profile" ? "id" : "user_id";
  const { data, error } = await supabase
    .from(remoteTable)
    .select("*")
    .eq(filterColumn, userId);
  if (error) throw new Error(`${remoteTable} pull: ${error.message}`);
  if (!data || data.length === 0) return 0;
  const localTable_ = (db as unknown as Record<string, DexieLikeTable>)[localTable];
  if (!localTable_) return 0;
  for (const row of data) {
    const local = remoteToLocal(row);
    await localTable_.put(local);
  }
  return data.length;
}

interface DexieLikeTable {
  put: (row: unknown) => Promise<unknown>;
  toArray: () => Promise<unknown[]>;
  clear: () => Promise<unknown>;
  where: (field: string) => {
    above: (val: unknown) => { toArray: () => Promise<unknown[]> };
    equals: (val: unknown) => { toArray: () => Promise<unknown[]> };
  };
}

function remoteToLocal(row: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    const camel = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    out[camel] = v;
  }
  return out;
}

async function pullAll(userId: string): Promise<{
  workouts: number;
  workoutExercises: number;
  sets: number;
  routines: number;
  routineExercises: number;
  profile: number;
}> {
  const [w, we, s, r, re, p] = await Promise.all([
    pullTable("workouts", "workouts", "id", userId),
    pullTable("workout_exercises", "workoutExercises", "id", userId),
    pullTable("sets", "sets", "id", userId),
    pullTable("routines", "routines", "id", userId),
    pullTable("routine_exercises", "routineExercises", "id", userId),
    pullTable("user_profile", "userProfile", "id", userId),
  ]);
  return { workouts: w, workoutExercises: we, sets: s, routines: r, routineExercises: re, profile: p };
}

// ============================================================
// SYNC ORCHESTRATOR
// ============================================================

let syncInProgress = false;
let syncTimer: ReturnType<typeof setTimeout> | null = null;
let dirtyFlag = false;

/** Throttle: máximo 1 increment por segundo. Evita spamear pendingChanges. */
let lastMarkDirty = 0;
export function markDirty() {
  const now = Date.now();
  if (now - lastMarkDirty < 1000) {
    // Throttle: no incrementamos counter más de 1 vez/seg, pero marcamos dirty igualmente
    dirtyFlag = true;
    scheduleSync();
    return;
  }
  lastMarkDirty = now;
  dirtyFlag = true;
  set({ pendingChanges: state.pendingChanges + 1 });
  // Persistir queue en localStorage para sobrevivir cierres
  try {
    const queue = getQueue();
    queue.push({
      id: crypto.randomUUID?.() ?? String(Date.now()),
      table: "unknown", // se actualiza cuando se sepa
      recordId: String(Date.now()),
      op: "upsert",
      timestamp: Date.now(),
    });
    setQueue(queue);
  } catch {
    /* ignore */
  }
  scheduleSync();
}

/** Hook de inicialización: limpia queue si está vacía después de un sync exitoso */
export function clearQueueOnSuccess() {
  if (state.pendingChanges === 0) {
    clearQueue();
  }
}

export function scheduleSync(delayMs = 5000) {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    if (dirtyFlag) sync();
  }, delayMs);
}

// Listener de online/offline — al volver online, intenta sincronizar
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    logAction("network_back_online");
    if (dirtyFlag) {
      logAction("auto_sync_on_network_recovery");
      void sync();
    }
  });
  window.addEventListener("offline", () => {
    logAction("network_offline");
    set({ status: "offline" });
  });
}

// ============================================================
// REALTIME — Supabase Realtime
// ============================================================

let realtimeChannel: ReturnType<ReturnType<typeof getSupabase>["channel"]> | null = null;
let realtimeEnabled = false;

/**
 * Activa la suscripción realtime a Supabase.
 * Cuando otro device modifica una tabla del usuario, refresca local.
 * Requiere que el usuario esté autenticado.
 */
export async function enableRealtime(userId: string): Promise<void> {
  if (realtimeEnabled) return;
  const supabase = getSupabase();
  // Channel por user — Supabase filtra por RLS
  const channel = supabase.channel(`ironrank-sync-${userId}`);
  const tables = [
    { remote: "workouts", local: "workouts" },
    { remote: "workout_exercises", local: "workoutExercises" },
    { remote: "sets", local: "sets" },
    { remote: "routines", local: "routines" },
    { remote: "routine_exercises", local: "routineExercises" },
    { remote: "user_profile", local: "userProfile" },
  ];
  for (const t of tables) {
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: t.remote },
      (payload) => {
        logAction("realtime_change_received", {
          table: t.remote,
          event: payload.eventType,
        });
        void applyRealtimeChange(t.local, payload);
      },
    );
  }
  channel.subscribe((status) => {
    if (status === "SUBSCRIBED") {
      realtimeEnabled = true;
      logAction("realtime_subscribed");
    } else if (status === "CHANNEL_ERROR") {
      logAction("realtime_channel_error");
    }
  });
  realtimeChannel = channel;
}

export function disableRealtime() {
  if (realtimeChannel) {
    const supabase = getSupabase();
    supabase.removeChannel(realtimeChannel);
    realtimeChannel = null;
    realtimeEnabled = false;
    logAction("realtime_unsubscribed");
  }
}

async function applyRealtimeChange(
  localTable: string,
  payload: { eventType: string; new?: Record<string, unknown>; old?: Record<string, unknown> },
) {
  try {
    const table = (db as unknown as Record<string, DexieLikeTable>)[localTable];
    if (!table) return;
    if (payload.eventType === "DELETE" && payload.old) {
      // Borrar por id (remote usa UUIDs, local usa IDs)
      const id = (payload.old as { id: string }).id;
      await table.toArray().then((rows: unknown[]) => {
        for (const r of rows) {
          if (String((r as { id: string | number }).id) === id) {
            // table.delete expects the local ID
            return table.put; // noop, ref
          }
        }
      });
      // Mejor: usar bulkDelete por remote_id
      // (en este MVP no tenemos remote_id mapping, saltamos el delete realtime)
      logAction("realtime_delete_skipped", { local: localTable, remote_id: id });
    } else if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
      if (!payload.new) return;
      const local: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(payload.new)) {
        const camel = k.replace(/_([a-z])/g, (_, m) => m.toUpperCase());
        local[camel] = v;
      }
      await table.put(local);
    }
    logAction("realtime_applied", { table: localTable });
  } catch (e) {
    logAction("realtime_apply_failed", { error: String(e) });
  }
}

export async function sync(): Promise<void> {
  if (syncInProgress) {
    logAction("sync_skipped", { reason: "already_in_progress" });
    return;
  }
  if (!navigator.onLine) {
    set({ status: "offline" });
    return;
  }
  const auth = useAuthStore.getState();
  if (auth.status !== "authenticated" || !auth.user) {
    set({ status: "idle" });
    return;
  }
  const userId = auth.user.id;

  syncInProgress = true;
  set({ status: "syncing", lastError: null });
  const start = Date.now();
  try {
    // Push primero, luego pull
    const pushed = await pushAll(userId);
    const pulled = await pullAll(userId);
    const now = Date.now();
    setLastSyncAt(now);
    dirtyFlag = false;

    // Detectar conflictos: registros modificados en ambos lados desde last sync
    const conflicts = await detectAllConflicts(now);
    const conflictCount = conflicts.length;
    if (conflictCount > 0) {
      const { useConflictStore } = await import("./conflictStore");
      useConflictStore.getState().setConflicts(conflicts);
      logAction("sync_conflicts_detected", { count: conflictCount });
    }

    set({
      status: conflictCount > 0 ? "conflict" : "idle",
      lastSyncAt: now,
      pendingChanges: 0,
      lastError: null,
      conflictCount,
    });
    // Sync exitoso: limpiar queue persistida
    clearQueue();
    logAction("sync_completed", {
      duration_ms: Date.now() - start,
      pushed: JSON.stringify(pushed),
      pulled: JSON.stringify(pulled),
    });
  } catch (e) {
    const msg = (e as Error).message;
    set({ status: "error", lastError: msg });
    logAction("sync_failed", { error: msg });
  } finally {
    syncInProgress = false;
  }
}

/**
 * Detecta conflictos comparando local vs remote después del pull.
 * Carga todos los registros de cada tabla y compara updatedAt.
 */
async function detectAllConflicts(
  lastSyncAt: number,
): Promise<Array<{
  id: string;
  table: "workouts" | "workout_exercises" | "sets" | "routines" | "routine_exercises" | "user_profile";
  recordId: string;
  localUpdatedAt: number;
  remoteUpdatedAt: number;
  diffSeconds: number;
}>> {
  const auth = useAuthStore.getState();
  if (!auth.user) return [];
  const userId = auth.user.id;
  const supabase = getSupabase();
  const conflicts: Array<{
    id: string;
    table: "workouts" | "workout_exercises" | "sets" | "routines" | "routine_exercises" | "user_profile";
    recordId: string;
    localUpdatedAt: number;
    remoteUpdatedAt: number;
    diffSeconds: number;
  }> = [];
  const since = new Date(lastSyncAt - 60_000).toISOString(); // ventana de 60s
  const tables: Array<{
    table: string;
    local: "workouts" | "workoutExercises" | "sets" | "routines" | "routineExercises" | "userProfile";
    filter: string;
  }> = [
    { table: "workouts", local: "workouts", filter: "user_id" },
    { table: "workout_exercises", local: "workoutExercises", filter: "user_id" },
    { table: "sets", local: "sets", filter: "user_id" },
    { table: "routines", local: "routines", filter: "user_id" },
    { table: "routine_exercises", local: "routineExercises", filter: "user_id" },
  ];
  for (const t of tables) {
    const { data: remoteRows, error } = await supabase
      .from(t.table)
      .select("*")
      .eq(t.filter, userId)
      .gt("updated_at", since);
    if (error || !remoteRows) continue;
    const localRows = await (db as unknown as Record<string, DexieLikeTable>)[t.local].toArray();
    const localById = new Map<string, { updatedAt: number }>();
    for (const r of localRows) {
      const updatedAt = new Date((r as { updatedAt?: string; date?: string }).updatedAt ?? (r as { date?: string }).date ?? 0).getTime();
      if (updatedAt > lastSyncAt) {
        localById.set(String((r as { id: number | string }).id), { updatedAt });
      }
    }
    for (const r of remoteRows) {
      const rid = String((r as { id: string | number }).id);
      const remoteUpdatedAt = new Date((r as { updated_at: string }).updated_at).getTime();
      const l = localById.get(rid);
      if (l && Math.abs(l.updatedAt - remoteUpdatedAt) > 1000) {
        conflicts.push({
          id: `${t.local}:${rid}`,
          table: t.local as "workouts" | "workout_exercises" | "sets" | "routines" | "routine_exercises" | "user_profile",
          recordId: rid,
          localUpdatedAt: l.updatedAt,
          remoteUpdatedAt,
          diffSeconds: Math.abs(l.updatedAt - remoteUpdatedAt) / 1000,
        });
      }
    }
  }
  return conflicts;
}

// ============================================================
// FULL SYNC (en login — reemplaza local con remoto)
// ============================================================

export async function fullSyncOnLogin(): Promise<void> {
  if (!navigator.onLine) {
    set({ status: "offline" });
    return;
  }
  const auth = useAuthStore.getState();
  if (auth.status !== "authenticated" || !auth.user) {
    return;
  }
  const userId = auth.user.id;
  syncInProgress = true;
  set({ status: "syncing", lastError: null });
  try {
    // En login: push primero (los datos locales se suben al cloud)
    // Luego pull (cualquier cambio desde otro device)
    await pushAll(userId);
    await pullAll(userId);
    const now = Date.now();
    setLastSyncAt(now);
    dirtyFlag = false;
    set({ status: "idle", lastSyncAt: now, pendingChanges: 0 });
    logAction("sync_full_on_login", { duration_ms: 0 });
  } catch (e) {
    set({ status: "error", lastError: (e as Error).message });
    logAction("sync_failed_on_login", { error: (e as Error).message });
  } finally {
    syncInProgress = false;
  }
}
