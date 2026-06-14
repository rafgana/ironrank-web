/**
 * Backup automático — descarga el JSON completo del usuario cada 24h.
 *
 * Trigger:
 * 1. Al login (si la última backup > 24h)
 * 2. Cada 24h mientras la app está abierta
 *
 * No se sube a ningún cloud storage: el backup es local.
 * El usuario puede compartirlo (AirDrop, email, etc.) si quiere.
 *
 * El state se persiste en IndexedDB (appState.lastAutoBackup) para que
 * la próxima sesión sepa cuándo fue la última.
 */
import { db } from "../db/database";
import { exportAll } from "./dataPortability";
import { useAuthStore } from "./auth/authStore";
import { logAction } from "./actionLog";
import { track } from "./analytics";

const BACKUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24h
const BACKUP_KEY = "lastAutoBackup";

async function getLastAutoBackup(): Promise<number> {
  try {
    const row = await db.appState.get({ key: BACKUP_KEY });
    return row ? Number(row.value) || 0 : 0;
  } catch {
    return 0;
  }
}

async function setLastAutoBackup(ts: number): Promise<void> {
  try {
    await db.appState.put({ key: BACKUP_KEY, value: String(ts) });
  } catch {
    /* ignore */
  }
}

/** Decide si toca backup ahora. */
async function shouldBackup(): Promise<boolean> {
  const last = await getLastAutoBackup();
  if (last === 0) return true;
  return Date.now() - last > BACKUP_INTERVAL_MS;
}

/** Ejecuta el backup. Devuelve true si se hizo. */
export async function runAutoBackup(): Promise<boolean> {
  const auth = useAuthStore.getState();
  if (auth.status !== "authenticated" || !auth.user) return false;
  if (!(await shouldBackup())) return false;

  try {
    const { json, filename } = await exportAll();
    // Lo guardamos en una variable global para que el usuario pueda descargarlo
    // desde la UI. No disparamos descarga automática (UX intrusivo).
    pendingBackup = { json, filename, timestamp: Date.now() };
    await setLastAutoBackup(Date.now());
    logAction("auto_backup_created", { size: json.length });
    track("auto_backup_created");
    return true;
  } catch (e) {
    logAction("auto_backup_failed", { error: String(e) });
    return false;
  }
}

interface PendingBackup {
  json: string;
  filename: string;
  timestamp: number;
}
let pendingBackup: PendingBackup | null = null;

export function getPendingBackup(): PendingBackup | null {
  return pendingBackup;
}

export function clearPendingBackup() {
  pendingBackup = null;
}

let intervalId: ReturnType<typeof setInterval> | null = null;

/** Inicia el scheduler. Llamar una vez al cargar la app. */
export function startAutoBackupScheduler() {
  if (intervalId) return; // ya corriendo
  // Check cada 5 minutos si toca backup
  intervalId = setInterval(() => {
    void runAutoBackup();
  }, 5 * 60 * 1000);
  // También intentar al cargar (por si la app estuvo cerrada varios días)
  void runAutoBackup();
}

/** Detiene el scheduler (para tests o cuando se hace logout). */
export function stopAutoBackupScheduler() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
