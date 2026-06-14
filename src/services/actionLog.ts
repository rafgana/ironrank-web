/**
 * Action log service — captura todo lo que el usuario hace para análisis con IA.
 *
 * Cada log lleva:
 *  - timestamp
 *  - kind + category (qué pasó)
 *  - payload (datos específicos: peso, reps, etc.)
 *  - context automático (tier, streak, total workouts, session_id, app_version, viewport)
 *
 * Persiste en IndexedDB (db.actionLog). Rotación FIFO a MAX_ENTRIES.
 *
 * No bloquea: si falla la escritura, el error se silencia (analytics nunca debe romper la app).
 */
import type { ActionKind, ActionLog } from '../models/types';
import { db } from '../db/database';
import { useWorkoutStore } from '../store/workoutStore';
import { useProfileStore } from '../store/profileStore';
import { computeOverallTier } from '../hooks/useOverallTier';

const MAX_ENTRIES = 5000;
const SESSION_KEY = 'ironrank.sessionId';
const VERSION = 'v6.0.0';

let _sessionId: string | null = null;
function sessionId(): string {
  if (typeof window === 'undefined') return 'ssr';
  if (_sessionId) return _sessionId;
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      id = crypto.randomUUID();
    } else {
      // Fallback: 32 chars hex
      let h = '';
      for (let i = 0; i < 32; i++) h += Math.floor(Math.random() * 16).toString(16);
      id = h;
    }
    sessionStorage.setItem(SESSION_KEY, id);
  }
  _sessionId = id;
  return id;
}

function computeStreak(workoutDates: Date[]): number {
  if (workoutDates.length === 0) return 0;
  const days = new Set(workoutDates.map((d) => d.toDateString()));
  let count = 0;
  const cursor = new Date();
  if (!days.has(cursor.toDateString())) cursor.setDate(cursor.getDate() - 1);
  while (days.has(cursor.toDateString())) {
    count++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

function captureContext(): ActionLog['context'] {
  if (typeof window === 'undefined') return { appVersion: VERSION };
  const ctx: ActionLog['context'] = {
    sessionId: sessionId(),
    appVersion: VERSION,
    viewport: { w: window.innerWidth, h: window.innerHeight },
    online: navigator.onLine,
  };
  try {
    // Leer state de zustand (no son hooks, son stores, OK llamarlos aquí)
    const ws = useWorkoutStore.getState();
    const ps = useProfileStore.getState();
    ctx.totalWorkouts = ws.workouts.length;
    if (ps.profile) {
      ctx.streakDays = computeStreak(ws.workouts.map((w) => new Date(w.date)));
    }
  } catch {
    /* ignore */
  }
  return ctx;
}

// Cache 5s del tier — la mayoría de acciones en una sesión comparten tier.
let _tierCache: { tier: string; ts: number } | null = null;
async function getTierAsync(): Promise<string | null> {
  try {
    if (_tierCache && Date.now() - _tierCache.ts < 5000) {
      return _tierCache.tier;
    }
    const ps = useProfileStore.getState();
    const result = await computeOverallTier(ps.profile);
    if (result) {
      _tierCache = { tier: result.tier, ts: Date.now() };
      return result.tier;
    }
  } catch {
    /* ignore */
  }
  return null;
}

async function rotate(): Promise<void> {
  try {
    const count = await db.actionLog.count();
    if (count >= MAX_ENTRIES) {
      // Borrar las 100 más antiguas
      const old = await db.actionLog
        .orderBy('id')
        .limit(count - MAX_ENTRIES + 100)
        .toArray();
      const ids = old.map((e) => e.id!).filter(Boolean);
      await db.actionLog.bulkDelete(ids);
    }
  } catch {
    /* ignore */
  }
}

/**
 * Log una acción. Fire-and-forget. El await es opcional.
 * El tier del context se calcula con un timeout corto — si tarda más, se loguea sin tier.
 */
export async function logAction(
  kind: ActionKind,
  payload?: ActionLog['payload'],
  category?: string,
): Promise<void> {
  try {
    const ctx = captureContext();
    // Tier con timeout 200ms — no debe bloquear la UX
    const tierResult = await Promise.race([
      getTierAsync(),
      new Promise<string | null>((resolve) => setTimeout(() => resolve(null), 200)),
    ]);
    if (tierResult) ctx.tier = tierResult;
    const entry: ActionLog = {
      timestamp: new Date().toISOString(),
      kind,
      category,
      payload,
      context: ctx,
    };
    await db.actionLog.add(entry);
    // Fire-and-forget rotation check
    if (Math.random() < 0.05) rotate();
  } catch {
    /* analytics never breaks the app */
  }
}

/** Versión sincrónica: para casos críticos donde no se quiere await */
export function logActionSync(
  kind: ActionKind,
  payload?: ActionLog['payload'],
  category?: string,
): void {
  try {
    const entry: ActionLog = {
      timestamp: new Date().toISOString(),
      kind,
      category,
      payload,
      context: captureContext(),
    };
    db.actionLog.add(entry);
  } catch {
    /* ignore */
  }
}

/** Lee todas las acciones (ordenadas desc por timestamp). */
export async function getAllActions(limit = 5000): Promise<ActionLog[]> {
  try {
    return await db.actionLog
      .orderBy('timestamp')
      .reverse()
      .limit(limit)
      .toArray();
  } catch {
    return [];
  }
}

/** Borra todo el log. */
export async function clearActionLog(): Promise<void> {
  try {
    await db.actionLog.clear();
  } catch {
    /* ignore */
  }
}

/** Cuenta de acciones por kind (para UI). */
export async function getActionCounts(): Promise<Record<string, number>> {
  try {
    const all = await db.actionLog.toArray();
    const counts: Record<string, number> = {};
    for (const a of all) {
      counts[a.kind] = (counts[a.kind] || 0) + 1;
    }
    return counts;
  } catch {
    return {};
  }
}

/** Exporta el log como JSON. */
export async function exportActionLog(): Promise<string> {
  const all = await getAllActions();
  return JSON.stringify(
    {
      app: 'IronRank',
      version: VERSION,
      exportedAt: new Date().toISOString(),
      count: all.length,
      actions: all,
    },
    null,
    2,
  );
}
