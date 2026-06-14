/**
 * AccountSection — bloque en Profile para gestionar cuenta y sync.
 * Como auth es obligatorio, el usuario siempre está logueado cuando ve esto.
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Cloud, CloudOff, LogOut, RefreshCw, Trash2, AlertTriangle, GitMerge, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "../../services/auth/authStore";
import { useSyncStore } from "../../services/sync/syncStore";
import { useConflictStore } from "../../services/sync/conflictStore";
import { LoginScreen } from "./LoginScreen";
import { track } from "../../services/analytics";
import { logAction } from "../../services/actionLog";
import { isSupabaseConfigured } from "../../services/auth/supabaseClient";
import { db } from "../../db/database";
import { getSupabase } from "../../services/auth/supabaseClient";
import { markDirty, sync as triggerSync } from "../../services/sync/syncEngine";
import { getPendingBackup, clearPendingBackup } from "../../services/backup";
import { downloadJSON } from "../../services/dataPortability";

export function AccountSection() {
  const auth = useAuthStore();

  if (!isSupabaseConfigured()) {
    return null;
  }

  if (auth.status !== "authenticated" || !auth.user) {
    return null; // AuthGuard ya redirige a LoginScreen
  }

  // Sub-componente para backup pendiente
  return (
    <div className="space-y-4">
      <PendingBackupCard />
      <SyncStatusCard email={auth.user.email ?? "Sin email"} />
    </div>
  );
}

function SyncStatusCard({ email }: { email: string }) {
  const auth = useAuthStore();
  const sync = useSyncStore();
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="eyebrow">Cuenta</div>
          <h2 className="font-display text-lg font-semibold tracking-tight mt-0.5">
            Sincronizado
          </h2>
        </div>
        <SyncBadge status={sync.status} pendingChanges={sync.pendingChanges} />
      </div>
      <div className="rounded-lg bg-surface-2 p-3 text-sm">
        <div className="font-medium">{email}</div>
        <div className="text-xs text-fg-muted mt-0.5">
          {sync.lastSyncAt
            ? `Última sync: ${new Date(sync.lastSyncAt).toLocaleString()}`
            : "Nunca sincronizado"}
        </div>
      </div>
      {sync.status === "error" && sync.lastError && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-xs text-red-300">
          {sync.lastError}
        </div>
      )}

      {/* Conflict resolution banner */}
      <ConflictBanner />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Button
          variant="outline"
          onClick={async () => {
            logAction("sync_manual_triggered");
            await sync.triggerSync();
          }}
          disabled={sync.status === "syncing"}
          className="w-full"
        >
          <RefreshCw size={14} className={sync.status === "syncing" ? "animate-spin" : ""} />
          Sincronizar ahora
        </Button>
        <Button
          variant="ghost"
          onClick={async () => {
            track("logout_clicked");
            logAction("logout_clicked");
            await auth.signOut();
            logAction("logout_completed");
          }}
          className="w-full text-fg-muted"
        >
          <LogOut size={14} />
          Cerrar sesión
        </Button>
      </div>
      {!confirmDelete ? (
        <Button
          variant="ghost"
          className="w-full text-fg-muted hover:text-red-400"
          onClick={() => setConfirmDelete(true)}
        >
          <Trash2 size={14} />
          Eliminar cuenta
        </Button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 space-y-2"
        >
          <div className="flex items-start gap-2">
            <AlertTriangle size={14} className="mt-0.5 text-red-400 shrink-0" />
            <div className="text-xs text-fg-muted">
              <strong className="text-red-300">Esto no se puede deshacer.</strong> Se borrará tu cuenta, todos tus datos en el cloud, y tus datos locales. Tendrás que crear una cuenta nueva para volver a usar la app.
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => setConfirmDelete(false)}
              className="flex-1 h-8 text-xs"
            >
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                track("account_deleted");
                logAction("account_deleted");
                try {
                  const supabase = getSupabase();
                  await supabase.rpc("delete_user");
                } catch {
                  /* ignore */
                }
                await auth.signOut();
                for (const table of ["workouts", "workoutExercises", "sets", "routines", "routineExercises", "userProfile", "actionLog", "appState"]) {
                  try {
                    await db.table(table).clear();
                  } catch {
                    /* ignore */
                  }
                }
                setConfirmDelete(false);
                logAction("account_deleted_completed");
                location.reload();
              }}
              className="flex-1 h-8 text-xs bg-red-500/20 text-red-300 hover:bg-red-500/30"
            >
              Eliminar definitivamente
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function SyncBadge({ status, pendingChanges }: { status: string; pendingChanges: number }) {
  if (status === "syncing") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-fg-muted">
        <RefreshCw size={12} className="animate-spin" />
        Sincronizando…
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-red-400">
        <AlertTriangle size={12} />
        Error
      </span>
    );
  }
  if (status === "offline") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-fg-dim">
        <CloudOff size={12} />
        Offline
      </span>
    );
  }
  if (pendingChanges > 0) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-yellow-400">
        {pendingChanges} cambios
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-xs text-tier-esmeralda">
      <Cloud size={12} />
      Al día
    </span>
  );
}

/**
 * Banner de conflictos — muestra registros que fueron modificados en local
 * y en remote desde el último sync. El usuario elige "keep local" o "use remote".
 */
function ConflictBanner() {
  const conflicts = useConflictStore((s) => s.conflicts);
  const resolveConflict = useConflictStore((s) => s.resolveConflict);
  const clearAll = useConflictStore((s) => s.clearAll);
  const auth = useAuthStore();
  const [expanded, setExpanded] = useState(false);

  if (conflicts.length === 0) return null;

  async function keepLocal(c: { table: string; recordId: string; id: string }) {
    // Subir la versión local a Supabase (push) → resuelve el conflicto
    try {
      const supabase = getSupabase();
      const localRows = await (db as unknown as Record<string, { toArray: () => Promise<unknown[]> }>)[c.table].toArray();
      const local = localRows.find((r) => String((r as { id: string | number }).id) === c.recordId) as Record<string, unknown> | undefined;
      if (!local) return;
      // Convertir a snake_case
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(local)) {
        out[k.replace(/[A-Z]/g, (m) => "_" + m.toLowerCase())] = v;
      }
      out.user_id = auth.user?.id;
      out.updated_at = new Date().toISOString();
      const { error } = await supabase.from(snakeToRemoteTable(c.table)).upsert(out);
      if (error) throw error;
      logAction("sync_conflict_resolved", { id: c.id, resolution: "keep_local" });
      resolveConflict(c.id);
    } catch (e) {
      logAction("sync_conflict_resolve_failed", { id: c.id, error: String(e) });
    }
  }

  async function useRemote(c: { table: string; recordId: string; id: string }) {
    try {
      // Sobrescribir local con remote
      const supabase = getSupabase();
      const remoteTable = snakeToRemoteTable(c.table);
      const { data, error } = await supabase
        .from(remoteTable)
        .select("*")
        .eq("id", c.recordId)
        .single();
      if (error) throw error;
      if (!data) return;
      // Convertir a camelCase
      const local: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(data)) {
        local[k.replace(/_([a-z])/g, (_, m) => m.toUpperCase())] = v;
      }
      // Cast id para Dexie
      if ("id" in local && (c.table === "workouts" || c.table === "routines" || c.table === "workoutExercises" || c.table === "routineExercises" || c.table === "sets")) {
        // Mantener id como string
      }
      const localTable = (db as unknown as Record<string, { put: (r: unknown) => Promise<unknown> }>)[c.table];
      await localTable.put(local);
      logAction("sync_conflict_resolved", { id: c.id, resolution: "use_remote" });
      resolveConflict(c.id);
    } catch (e) {
      logAction("sync_conflict_resolve_failed", { id: c.id, error: String(e) });
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-yellow-500/40 bg-yellow-500/5 p-3 space-y-2"
    >
      <div className="flex items-start gap-2">
        <GitMerge size={14} className="mt-0.5 text-yellow-400 shrink-0" />
        <div className="flex-1 text-xs">
          <strong className="text-yellow-300">
            {conflicts.length} conflicto{conflicts.length !== 1 ? "s" : ""} de sincronización
          </strong>
          <p className="text-fg-muted mt-0.5">
            Estos registros fueron modificados en este dispositivo y en el cloud.
            Elige qué versión mantener.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-xs text-fg-muted hover:text-fg underline shrink-0"
        >
          {expanded ? "Ocultar" : "Ver"}
        </button>
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {conflicts.map((c) => (
              <div
                key={c.id}
                className="rounded-md bg-surface-2 p-2 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-fg-muted">{c.table}</span>
                  <span className="text-fg-dim">id: {c.recordId.slice(0, 8)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="rounded bg-surface-1 p-1.5">
                    <div className="text-fg-dim">Local</div>
                    <div>{new Date(c.localUpdatedAt).toLocaleString()}</div>
                  </div>
                  <div className="rounded bg-surface-1 p-1.5">
                    <div className="text-fg-dim">Remoto</div>
                    <div>{new Date(c.remoteUpdatedAt).toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <Button
                    variant="outline"
                    onClick={() => keepLocal(c)}
                    className="flex-1 h-7 text-xs"
                  >
                    Mantener local
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => useRemote(c)}
                    className="flex-1 h-7 text-xs"
                  >
                    Usar remoto
                  </Button>
                </div>
              </div>
            ))}
            <Button
              variant="ghost"
              onClick={() => {
                clearAll();
                logAction("sync_conflicts_dismissed", { count: conflicts.length });
              }}
              className="w-full h-7 text-xs"
            >
              Ignorar todos (próximo sync los reconciliará)
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function snakeToRemoteTable(local: string): string {
  const map: Record<string, string> = {
    workouts: "workouts",
    workoutExercises: "workout_exercises",
    sets: "sets",
    routines: "routines",
    routineExercises: "routine_exercises",
    userProfile: "user_profile",
  };
  return map[local] || local;
}

/**
 * Card que muestra un backup automático pendiente de descarga.
 * Aparece cada 24h si el usuario está logueado.
 */
function PendingBackupCard() {
  const [pending, setPending] = useState(getPendingBackup());

  // Re-check cada minuto por si llega un backup
  useEffect(() => {
    const id = setInterval(() => setPending(getPendingBackup()), 60_000);
    return () => clearInterval(id);
  }, []);

  if (!pending) return null;

  function handleDownload() {
    logAction("auto_backup_downloaded", { size: pending!.json.length });
    downloadJSON(pending!.json, pending!.filename);
    clearPendingBackup();
    setPending(null);
  }

  function handleDismiss() {
    logAction("auto_backup_dismissed");
    clearPendingBackup();
    setPending(null);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-brand-500/40 bg-brand-500/5 p-3 space-y-2"
    >
      <div className="flex items-start gap-2">
        <Download size={14} className="mt-0.5 text-brand-500 shrink-0" />
        <div className="flex-1 text-xs">
          <strong className="text-fg">Backup automático listo</strong>
          <p className="text-fg-muted mt-0.5">
            {new Date(pending.timestamp).toLocaleString()} · {(pending.json.length / 1024).toFixed(0)} KB
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button onClick={handleDownload} className="flex-1 h-8 text-xs">
          <Download size={12} />
          Descargar
        </Button>
        <Button
          variant="ghost"
          onClick={handleDismiss}
          className="flex-1 h-8 text-xs"
        >
          Ignorar
        </Button>
      </div>
    </motion.div>
  );
}
