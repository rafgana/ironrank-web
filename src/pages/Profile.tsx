"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Weight,
  Timer,
  Download,
  Upload,
  Trash2,
  Sparkles,
  Award,
  Calendar,
  Crown,
  Cloud,
  CloudOff,
  Info,
  Check,
  AlertTriangle,
  BarChart3,
  Bell,
  Sun,
  Activity,
  type LucideIcon,
} from "lucide-react";
import { useProfileStore } from "../store/profileStore";
import { useWorkoutStore } from "../store/workoutStore";
import { useOverallTier } from "../hooks/useOverallTier";
import { requestNotificationPermission } from "../hooks/useIdleNotification";
import { applyTheme } from "../services/themeService";
import { TIER_VARS, tierAlpha } from "../models/types";
import { isSyncEnabled } from "../services/syncService";
import { downloadJSON, exportAll, importAll, wipeAll } from "../services/dataPortability";
import { exportActionLog, getActionCounts, logAction } from "../services/actionLog";
import { AccountSection } from "../components/auth/AccountSection";
import { Switch } from "../components/ui/switch";
import { Slider } from "../components/ui/slider";
import { Button } from "../components/ui/button";
import { SectionHeader } from "../components/ui/SectionHeader";
import { NumberTicker } from "../components/magicui/number-ticker";
import { TierEmblem } from "../components/ironrank/TierEmblem";
import { enterItem, enterStagger } from "../lib/motionTokens";
import { springFast } from "../lib/motionTokens";

type ToastState = { kind: "ok" | "err"; message: string } | null;

export function Profile() {
  const s = useProfileStore();
  const ws = useWorkoutStore();
  const { tier } = useOverallTier();
  const totalWorkouts = ws.workouts.length;
  const [toast, setToast] = useState<ToastState>(null);
  const [confirmWipe, setConfirmWipe] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    s.load();
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const showToast = (kind: "ok" | "err", message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ kind, message });
    toastTimer.current = setTimeout(() => setToast(null), 4500);
  };

  const handleExport = async () => {
    try {
      const { json, filename } = await exportAll();
      downloadJSON(json, filename);
      showToast("ok", "Backup descargado");
    } catch (e) {
      showToast("err", `Error al exportar: ${(e as Error).message}`);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // reset to allow re-importing same file
    if (!file) return;
    try {
      const text = await file.text();
      const result = await importAll(text);
      if (result.ok) {
        showToast("ok", result.message);
        await s.load();
        await ws.loadWorkouts();
      } else {
        showToast("err", result.message);
      }
    } catch (e) {
      showToast("err", `Error al importar: ${(e as Error).message}`);
    }
  };

  const handleWipe = async () => {
    try {
      await wipeAll();
      setConfirmWipe(false);
      showToast("ok", "Todos los datos borrados");
      location.reload();
    } catch (e) {
      showToast("err", `Error al borrar: ${(e as Error).message}`);
    }
  };

  const handleExportActionLog = async () => {
    try {
      const json = await exportActionLog();
      const counts = await getActionCounts();
      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      const date = new Date().toISOString().slice(0, 10);
      downloadJSON(json, `ironrank-actions-${date}.json`);
      logAction("export_data", { scope: "action_log", total, kinds: Object.keys(counts).length });
      showToast("ok", `Log descargado (${total} acciones)`);
    } catch (e) {
      showToast("err", `Error al exportar log: ${(e as Error).message}`);
    }
  };

  if (!s.profile) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-20" />
        <div className="skeleton h-32" />
        <div className="skeleton h-64" />
      </div>
    );
  }

  const p = s.profile;

  return (
    <motion.div
      variants={enterStagger}
      initial="hidden"
      animate="show"
      className="mx-auto max-w-4xl space-y-6"
    >
      {/* IDENTIDAD */}
      <motion.header
        variants={enterItem}
        className="card-accent hud bg-noise flex items-center gap-5 p-5 md:p-6"
      >
        <TierEmblem tier={tier} size="md" animated />
        <div className="min-w-0 flex-1">
          <div className="eyebrow mb-0.5 text-(--tier)">Perfil</div>
          <h1 className="font-display text-h1 font-bold">IronRanker</h1>
          <div className="mt-1 flex items-center gap-2 text-sm">
            <span className="font-semibold" style={{ color: TIER_VARS[tier] }}>
              {tier}
            </span>
            <span className="text-fg-dim">·</span>
            <span className="text-fg-muted">{totalWorkouts} workouts</span>
          </div>
        </div>
      </motion.header>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        {/* COLUMNA IZQUIERDA: stats + logros */}
        <div className="space-y-6">
          <motion.section variants={enterItem} className="card p-5">
            <div className="grid grid-cols-3 gap-4 text-center">
              <MiniStat
                icon={Calendar}
                value={totalWorkouts}
                label="Workouts"
              />
              <MiniStat
                icon={Award}
                value={Math.round(p.bodyweight)}
                label="Peso corporal"
                unit="kg"
              />
              <MiniStat
                icon={Timer}
                value={p.restTimerDefault}
                label="Descanso"
                unit="s"
              />
            </div>
          </motion.section>

          <motion.section variants={enterItem} className="card p-5">
            <SectionHeader
              eyebrow="Progresión"
              title="Logros"
              action={<Crown size={16} style={{ color: TIER_VARS[tier] }} />}
            />
            <div className="grid grid-cols-4 gap-3">
              <Achievement
                unlocked={totalWorkouts > 0}
                icon="🥉"
                label="Primer entreno"
              />
              <Achievement
                unlocked={totalWorkouts >= 10}
                icon="🥈"
                label="10 workouts"
              />
              <Achievement
                unlocked={totalWorkouts >= 50}
                icon="🥇"
                label="50 workouts"
              />
              <Achievement unlocked={false} icon="💎" label="100 workouts" />
            </div>
          </motion.section>

          <motion.section variants={enterItem} className="card space-y-5 p-5">
            <SectionHeader eyebrow="Sobre ti" title="Datos personales" />
            <Field
              label="Edad"
              value={p.age}
              unit="años"
              onChange={(v) => s.update({ age: v })}
              min={10}
              max={100}
            />
            <Field
              label="Peso corporal"
              value={p.bodyweight}
              unit="kg"
              onChange={(v) => s.update({ bodyweight: v })}
              min={30}
              max={250}
              step={0.5}
            />
            <Field
              label="Altura"
              value={p.height}
              unit="cm"
              onChange={(v) => s.update({ height: v })}
              min={100}
              max={250}
            />
          </motion.section>
        </div>

        {/* COLUMNA DERECHA: preferencias + datos */}
        <div className="space-y-6">
          <motion.section variants={enterItem} className="card space-y-5 p-5">
            <SectionHeader eyebrow="Ajustes" title="Preferencias" />

            <div
              className="flex items-center justify-between gap-3 rounded-lg border p-3"
              style={
                isSyncEnabled()
                  ? {
                      background: tierAlpha("Esmeralda", 10),
                      borderColor: tierAlpha("Esmeralda", 30),
                    }
                  : {
                      background: "var(--color-surface-2)",
                      borderColor: "var(--color-border-subtle)",
                    }
              }
            >
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                {isSyncEnabled() ? (
                  <Cloud size={16} className="text-tier-esmeralda" />
                ) : (
                  <CloudOff size={16} className="text-fg-muted" />
                )}
                <div className="min-w-0">
                  <div className="text-sm font-semibold">
                    {isSyncEnabled() ? "Sync en la nube activo" : "Solo local"}
                  </div>
                  <div className="truncate text-xs text-fg-muted">
                    {isSyncEnabled()
                      ? "Tus datos se sincronizan con Supabase"
                      : "Configura Supabase en .env.local para activar"}
                  </div>
                </div>
              </div>
              <a
                href="https://supabase.com"
                target="_blank"
                rel="noopener noreferrer"
                className="tap-target flex items-center justify-center rounded-md hover:bg-surface-3"
                aria-label="Más información sobre sync"
              >
                <Info size={13} className="text-fg-muted" />
              </a>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Timer size={13} className="text-fg-muted" />
                  <span className="text-sm">Descanso por defecto</span>
                </div>
                <span className="font-mono text-sm font-semibold tabular-nums text-(--tier)">
                  {p.restTimerDefault}s
                </span>
              </div>
              <Slider
                value={[p.restTimerDefault]}
                min={30}
                max={300}
                step={15}
                onValueChange={([v]) => s.update({ restTimerDefault: v })}
              />
              <div className="mt-1.5 flex justify-between gap-1">
                {[30, 60, 90, 120, 180, 300].map((v) => {
                  const active = p.restTimerDefault === v;
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => s.update({ restTimerDefault: v })}
                      className={
                        "flex-1 h-7 rounded-md text-xs font-mono tabular-nums transition-colors " +
                        (active
                          ? "bg-brand-500 text-black font-semibold"
                          : "bg-surface-2 text-fg-muted hover:bg-surface-3 hover:text-fg")
                      }
                    >
                      {v < 60 ? `${v}s` : `${v / 60}:${v % 60 ? String(v % 60).padStart(2, "0") : "00"}`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Objetivo de volumen semanal */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 size={13} className="text-fg-muted" />
                  <span className="text-sm">Volumen semanal objetivo</span>
                </div>
                <span className="font-mono text-sm font-semibold tabular-nums text-(--tier)">
                  {p.weeklyVolumeGoal && p.weeklyVolumeGoal > 0
                    ? `${(p.weeklyVolumeGoal / 1000).toFixed(1)}t`
                    : "—"}
                </span>
              </div>
              <Slider
                value={[p.weeklyVolumeGoal ?? 0]}
                min={0}
                max={30000}
                step={1000}
                onValueChange={([v]) => s.update({ weeklyVolumeGoal: v })}
              />
              <div className="mt-1 flex justify-between font-mono text-[11px] text-fg-dim">
                <span>0</span>
                <span>10t</span>
                <span>20t</span>
                <span>30t</span>
              </div>
            </div>

            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <Calendar size={13} className="text-fg-muted" />
                <span className="text-sm">Workouts por semana (objetivo)</span>
              </div>
              <span className="font-mono text-sm font-semibold tabular-nums text-(--tier)">
                {p.weeklyWorkoutsGoal && p.weeklyWorkoutsGoal > 0 ? p.weeklyWorkoutsGoal : "—"}
              </span>
            </div>
            <Slider
              value={[p.weeklyWorkoutsGoal ?? 0]}
              min={0}
              max={7}
              step={1}
              onValueChange={([v]) => s.update({ weeklyWorkoutsGoal: v })}
            />
            <div className="mt-1 flex justify-between font-mono text-[11px] text-fg-dim">
              <span>0</span><span>2</span><span>4</span><span>6</span><span>7</span>
            </div>

            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <Weight size={13} className="text-fg-muted" />
                <span className="text-sm">Unidad en kg</span>
              </div>
              <Switch
                checked={p.useKg}
                onCheckedChange={(v) => s.update({ useKg: v })}
              />
            </div>

            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <Sun size={13} className="text-fg-muted" />
                <span className="text-sm">Tema claro</span>
              </div>
              <Switch
                checked={
                  typeof document !== "undefined" &&
                  document.documentElement.dataset.theme === "light"
                }
                onCheckedChange={(v) => {
                  if (v) {
                    applyTheme("light");
                  } else {
                    applyTheme("dark");
                  }
                  logAction("theme_changed", { mode: v ? "light" : "dark" });
                  showToast("ok", v ? "Tema claro" : "Tema oscuro");
                }}
              />
            </div>

            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <Bell size={13} className="text-fg-muted" />
                <span className="text-sm">Recordatorio si llevo 3+ días sin entrenar</span>
              </div>
              <Switch
                checked={
                  typeof Notification !== "undefined" &&
                  Notification.permission === "granted"
                }
                onCheckedChange={async (v) => {
                  if (v) {
                    const perm = await requestNotificationPermission();
                    if (perm === "granted") {
                      showToast("ok", "Recordatorios activados");
                    } else {
                      showToast("err", "Permiso denegado por el navegador");
                    }
                  } else {
                    showToast("err", "Para desactivar, quita el permiso en ajustes del navegador");
                  }
                }}
              />
            </div>
          </motion.section>

          <AccountSection />

          <motion.section variants={enterItem} className="card space-y-4 p-5">
            <SectionHeader eyebrow="Privacidad" title="Tus datos" />
            <p className="text-sm leading-relaxed text-fg-muted">
              Todo se guarda en tu dispositivo (IndexedDB). Sin cuentas, sin
              nube, sin anuncios. Exporta cuando quieras para tener un backup.
            </p>

            {/* Hidden file input for import */}
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleImportFile}
              className="hidden"
              aria-hidden
            />

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button
                variant="outline"
                onClick={handleExport}
                className="w-full"
              >
                <Download size={14} />
                Exportar backup
              </Button>
              <Button
                variant="outline"
                onClick={handleImportClick}
                className="w-full"
              >
                <Upload size={14} />
                Importar backup
              </Button>
            </div>

            {/* Action log — para análisis con IA */}
            <Button
              variant="outline"
              onClick={handleExportActionLog}
              className="w-full"
            >
              <Activity size={14} />
              Descargar log de acciones
            </Button>
            <p className="text-xs text-fg-muted -mt-1">
              Historial anónimo de tus acciones (workouts, sets, PRs, tier, etc.) en JSON.
              Útil si quieres pedirle un análisis a una IA.
            </p>

            {!confirmWipe ? (
              <Button
                variant="ghost"
                className="w-full text-fg-muted hover:text-red-400"
                onClick={() => setConfirmWipe(true)}
              >
                <Trash2 size={14} />
                Borrar todos los datos
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
                    <strong className="text-red-300">Esto no se puede deshacer.</strong> Se borrarán todos tus workouts, series, rutinas y perfil. La biblioteca de ejercicios volverá a la versión por defecto.
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => setConfirmWipe(false)}
                    className="flex-1 h-8 text-xs"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleWipe}
                    className="flex-1 h-8 text-xs bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30"
                  >
                    <Trash2 size={12} />
                    Sí, borrar
                  </Button>
                </div>
              </motion.div>
            )}
          </motion.section>
        </div>
      </div>

      <motion.p variants={enterItem} className="eyebrow text-center">
        IronRank · v6.0 · offline-first
      </motion.p>

      {/* TOAST */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={springFast}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 md:bottom-6"
            role="status"
            aria-live="polite"
          >
            <div
              className="card flex items-center gap-2.5 px-4 py-3 text-sm shadow-2xl"
              style={
                toast.kind === "ok"
                  ? { borderColor: tierAlpha("Esmeralda", 40) }
                  : { borderColor: tierAlpha("Retador", 40) }
              }
            >
              {toast.kind === "ok" ? (
                <Check size={15} className="text-tier-esmeralda shrink-0" />
              ) : (
                <AlertTriangle size={15} className="text-tier-retador shrink-0" />
              )}
              <span className="text-fg">{toast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function MiniStat({
  icon: Icon,
  value,
  label,
  unit,
}: {
  icon: LucideIcon;
  value: number;
  label: string;
  unit?: string;
}) {
  return (
    <div>
      <div className="mb-1 flex justify-center text-(--tier)">
        <Icon size={15} />
      </div>
      <div className="font-display text-2xl font-bold tabular-nums text-(--tier)">
        <NumberTicker value={value} />
        {unit && (
          <span className="ml-0.5 text-xs font-normal text-fg-muted">
            {unit}
          </span>
        )}
      </div>
      <div className="mt-0.5 text-xs text-fg-muted">{label}</div>
    </div>
  );
}

function Field({
  label,
  value,
  unit,
  onChange,
  min,
  max,
  step = 1,
}: {
  label: string;
  value: number;
  unit: string;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <label className="flex-1 text-sm text-fg">{label}</label>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onChange(Math.max(min, value - step))}
          className="tap-target flex items-center justify-center rounded-md bg-surface-2 text-fg-muted transition-transform active:scale-90"
          aria-label={`Decrementar ${label}`}
        >
          −
        </button>
        <div className="w-20 rounded-md border border-border-subtle bg-surface-2 px-3 py-2 text-center font-mono text-sm font-semibold tabular-nums text-(--tier)">
          {value}
          <span className="ml-1 text-[11px] text-fg-muted">{unit}</span>
        </div>
        <button
          onClick={() => onChange(Math.min(max, value + step))}
          className="tap-target flex items-center justify-center rounded-md bg-surface-2 text-fg-muted transition-transform active:scale-90"
          aria-label={`Incrementar ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

function Achievement({
  unlocked,
  icon,
  label,
}: {
  unlocked: boolean;
  icon: string;
  label: string;
}) {
  return (
    <div
      className={
        unlocked
          ? "flex flex-col items-center gap-1.5 rounded-lg border border-border-subtle bg-surface-2 p-3 text-center"
          : "flex flex-col items-center gap-1.5 rounded-lg border border-transparent bg-surface-1 p-3 text-center opacity-35"
      }
    >
      <div
        className="text-2xl"
        style={{ filter: unlocked ? undefined : "grayscale(100%)" }}
      >
        {icon}
      </div>
      <span className="text-[11px] leading-tight text-fg-muted">{label}</span>
    </div>
  );
}
