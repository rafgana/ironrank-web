"use client";

import { useEffect } from "react";
import { motion } from "motion/react";
import {
  Weight,
  Timer,
  LogOut,
  Sparkles,
  Award,
  Calendar,
  Crown,
  Cloud,
  CloudOff,
  Info,
  type LucideIcon,
} from "lucide-react";
import { useProfileStore } from "../store/profileStore";
import { useWorkoutStore } from "../store/workoutStore";
import { useOverallTier } from "../hooks/useOverallTier";
import { TIER_VARS, tierAlpha } from "../models/types";
import { isSyncEnabled } from "../services/syncService";
import { Switch } from "../components/ui/switch";
import { Slider } from "../components/ui/slider";
import { Button } from "../components/ui/button";
import { SectionHeader } from "../components/ui/SectionHeader";
import { NumberTicker } from "../components/magicui/number-ticker";
import { TierEmblem } from "../components/ironrank/TierEmblem";
import { enterItem, enterStagger } from "../lib/motionTokens";

export function Profile() {
  const s = useProfileStore();
  const ws = useWorkoutStore();
  const { tier } = useOverallTier();
  const totalWorkouts = ws.workouts.length;

  useEffect(() => {
    s.load();
  }, []);

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
        className="card-accent bg-noise flex items-center gap-5 p-5 md:p-6"
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
              <div className="mt-1 flex justify-between font-mono text-[11px] text-fg-dim">
                <span>30s</span>
                <span>1m</span>
                <span>2m</span>
                <span>3m</span>
                <span>5m</span>
              </div>
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
                <Sparkles size={13} className="text-fg-muted" />
                <span className="text-sm">Notificaciones de PR</span>
              </div>
              <Switch checked disabled />
            </div>
          </motion.section>

          <motion.section variants={enterItem} className="card space-y-4 p-5">
            <SectionHeader eyebrow="Privacidad" title="Tus datos" />
            <p className="text-sm leading-relaxed text-fg-muted">
              Todo se guarda en tu dispositivo (IndexedDB). Sin cuentas, sin
              nube, sin anuncios.
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                if (
                  confirm(
                    "¿Borrar todos los datos? Esta acción no se puede deshacer.",
                  )
                ) {
                  indexedDB.deleteDatabase("IronRank");
                  location.reload();
                }
              }}
            >
              <LogOut size={14} />
              Borrar todos los datos
            </Button>
          </motion.section>
        </div>
      </div>

      <motion.p variants={enterItem} className="eyebrow text-center">
        IronRank · v2.0 · offline-first
      </motion.p>
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
