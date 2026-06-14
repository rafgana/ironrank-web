/**
 * Conflict store — lista de conflictos entre local y remote.
 * Se actualiza después de cada sync si hay cambios en ambos lados.
 */
import { create } from "zustand";

export type ConflictTable =
  | "workouts"
  | "workout_exercises"
  | "sets"
  | "routines"
  | "routine_exercises"
  | "user_profile";

/** Mapeo de nombre local (Dexie) → nombre canónico */
export function normalizeConflictTable(
  t: "workouts" | "workout_exercises" | "sets" | "routines" | "routine_exercises" | "user_profile",
): ConflictTable {
  return t;
}

export interface Conflict {
  id: string; // `${table}:${recordId}`
  table: ConflictTable;
  recordId: string;
  /** Timestamp local del último update (epoch ms) */
  localUpdatedAt: number;
  /** Timestamp remoto del último update (epoch ms) */
  remoteUpdatedAt: number;
  /** Cuántos segundos de diferencia */
  diffSeconds: number;
}

interface ConflictStoreState {
  conflicts: Conflict[];
  setConflicts: (conflicts: Conflict[]) => void;
  resolveConflict: (id: string) => void;
  clearAll: () => void;
}

export const useConflictStore = create<ConflictStoreState>((set) => ({
  conflicts: [],
  setConflicts: (conflicts) => set({ conflicts }),
  resolveConflict: (id) =>
    set((state) => ({ conflicts: state.conflicts.filter((c) => c.id !== id) })),
  clearAll: () => set({ conflicts: [] }),
}));

export function detectConflicts(
  table: ConflictTable,
  local: Map<string, { id: string; updatedAt: number; data: Record<string, unknown> }>,
  remote: Map<string, { id: string; updatedAt: number; data: Record<string, unknown> }>,
  lastSyncAt: number,
): Conflict[] {
  const conflicts: Conflict[] = [];
  for (const [id, l] of local) {
    const r = remote.get(id);
    if (!r) continue; // no conflict si solo uno de los dos cambió
    if (l.updatedAt > lastSyncAt && r.updatedAt > lastSyncAt) {
      // ambos cambiaron desde el último sync → conflicto
      conflicts.push({
        id: `${table}:${id}`,
        table,
        recordId: id,
        localUpdatedAt: l.updatedAt,
        remoteUpdatedAt: r.updatedAt,
        diffSeconds: Math.abs(l.updatedAt - r.updatedAt) / 1000,
      });
    }
  }
  return conflicts;
}
