import { useEffect, useMemo, lazy, Suspense } from "react";
import { motion } from "motion/react";
import { useWorkoutStore } from "../store/workoutStore";
import { useOverallTier } from "../hooks/useOverallTier";
import { TierEmblem } from "../components/ironrank/TierEmblem";
import { TierProgression } from "../components/ironrank/TierProgression";
import { SectionHeader } from "../components/ui/SectionHeader";
import { TierProgressBar } from "../components/ui/TierProgressBar";
import { Button } from "../components/ui/button";
import { NumberTicker } from "../components/magicui/number-ticker";
import { enterItem, enterStagger } from "../lib/motionTokens";
import { TIER_VARS } from "../models/types";
import {
  Dumbbell,
  Flame,
  Trophy,
  Calendar,
  Zap,
  Clock,
  User,
  TrendingUp,
  Check,
  type LucideIcon,
} from "lucide-react";

const ActivityHeatmap = lazy(() =>
  import("../components/ironrank/ActivityHeatmap").then((m) => ({
    default: m.ActivityHeatmap,
  })),
);

interface DashboardProps {
  onStartWorkout: () => void;
}

export function Dashboard({ onStartWorkout }: DashboardProps) {
  const ws = useWorkoutStore();
  const overall = useOverallTier();

  useEffect(() => {
    ws.loadWorkouts();
    ws.loadProfile();
  }, []);

  const totalWorkouts = ws.workouts.length;
  const weekWorkouts = ws.workouts.filter((w) => {
    const diff = (Date.now() - new Date(w.date).getTime()) / 86400000;
    return diff <= 7;
  }).length;

  /* Racha: días naturales consecutivos con ≥1 entreno (hoy o ayer cuentan como inicio) */
  const streak = useMemo(() => {
    const days = new Set(
      ws.workouts.map((w) => new Date(w.date).toDateString()),
    );
    let count = 0;
    const cursor = new Date();
    if (!days.has(cursor.toDateString())) cursor.setDate(cursor.getDate() - 1);
    while (days.has(cursor.toDateString())) {
      count++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return count;
  }, [ws.workouts]);

  const heatmapData = useMemo(
    () =>
      ws.workouts.map((w) => ({
        date: new Date(w.date),
        count: 1,
        volume: 0,
      })),
    [ws.workouts],
  );

  const recent = ws.workouts.slice(0, 6);

  return (
    <motion.div
      variants={enterStagger}
      initial="hidden"
      animate="show"
      className="grid gap-4 md:gap-5 lg:grid-cols-12"
    >
      {/* ══ HERO: identidad ranked + stats integradas ══ */}
      <motion.section
        variants={enterItem}
        className="min-w-0 card-accent hud bg-noise relative overflow-hidden lg:col-span-12"
      >
        {/* Línea de energía superior */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-[linear-gradient(90deg,transparent,var(--tier),transparent)] opacity-70" />

        <div className="relative z-10 grid items-center gap-6 p-6 md:grid-cols-[auto_1fr_auto] md:gap-10 md:p-8">
          {/* Emblema */}
          <div className="flex justify-center">
            <TierEmblem
              tier={overall.tier}
              size="xl"
              animated
              ringProgress={overall.hasData ? overall.score : undefined}
            />
          </div>

          {/* Rango + progreso */}
          <div className="space-y-3 text-center md:text-left">
            <div className="eyebrow text-(--tier)">
              Rango actual · Temporada 2026
            </div>
            <h1 className="font-display tier-gradient-text text-display font-bold">
              {overall.tier}
            </h1>
            {overall.hasData ? (
              <div className="max-w-md space-y-2 max-md:mx-auto">
                <div className="flex justify-between text-sm text-fg-muted">
                  <span>
                    Progreso a{" "}
                    <span
                      className="font-semibold"
                      style={{
                        color: TIER_VARS[overall.nextTier ?? overall.tier],
                      }}
                    >
                      {overall.nextTier ?? "MAX"}
                    </span>
                  </span>
                  <span className="font-mono tabular-nums">
                    {overall.score}%
                  </span>
                </div>
                <TierProgressBar value={overall.score} />
              </div>
            ) : (
              <p className="mx-auto max-w-md text-sm text-fg-muted md:mx-0">
                Registra tu primer{" "}
                <span className="font-semibold text-fg">Press Banca</span>,{" "}
                <span className="font-semibold text-fg">Sentadilla</span> o{" "}
                <span className="font-semibold text-fg">Peso Muerto</span> para
                desbloquear tu rango real.
              </p>
            )}
            <div className="flex flex-wrap justify-center gap-2 pt-1 md:justify-start">
              <Button variant="tier" size="md" onClick={onStartWorkout}>
                <Zap size={15} strokeWidth={2.5} />
                {totalWorkouts ? "Nuevo workout" : "Empezar primer workout"}
              </Button>
            </div>
          </div>

          {/* Stats integradas */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-5 border-t border-(--tier-border) pt-5 max-md:mt-1 md:border-t-0 md:border-l md:pt-0 md:pl-10">
            <HeroStat icon={Dumbbell} value={totalWorkouts} label="Entrenos" />
            <HeroStat
              icon={Flame}
              value={streak}
              label="Racha de días"
              accent="var(--color-brand-500)"
            />
            <HeroStat
              icon={Calendar}
              value={weekWorkouts}
              label="Esta semana"
              accent="var(--color-tier-esmeralda)"
            />
            <HeroStat
              icon={Trophy}
              valueStr={overall.tier}
              label="Rango"
              accent={TIER_VARS[overall.tier]}
            />
          </div>
        </div>
      </motion.section>

      {/* ══ QUEST LOG: primeros pasos (solo sin datos de rango) ══ */}
      {!overall.hasData && (
        <motion.section variants={enterItem} className="min-w-0 card p-5 lg:col-span-12">
          <SectionHeader
            eyebrow="Misiones"
            title="Primeros pasos"
            action={
              <span className="font-mono text-sm tabular-nums text-fg-dim">
                {(ws.profile ? 1 : 0) + (totalWorkouts > 0 ? 1 : 0)}/3
              </span>
            }
          />
          <div className="grid gap-2.5 md:grid-cols-3">
            <Quest
              n={1}
              done={!!ws.profile}
              icon={User}
              title="Configura tu perfil"
              desc="Peso corporal, edad y descanso por defecto"
            />
            <Quest
              n={2}
              done={totalWorkouts > 0}
              icon={Dumbbell}
              title="Completa un workout"
              desc="Registra tus primeras series"
            />
            <Quest
              n={3}
              done={false}
              icon={TrendingUp}
              title="Desbloquea tu rango"
              desc="Registra los 3 grandes levantamientos"
            />
          </div>
        </motion.section>
      )}

      {/* ══ CAMINO AL RETADOR: siempre visible, da identidad ══ */}
      <motion.section variants={enterItem} className="min-w-0 card p-5 md:p-6 lg:col-span-12">
        <SectionHeader eyebrow="Clasificatoria" title="Camino al Retador" />
        <TierProgression currentTier={overall.tier} />
      </motion.section>

      {/* ══ MAPA DE ACTIVIDAD: siempre visible (grid vacío estilo GitHub) ══ */}
      <motion.section variants={enterItem} className="min-w-0 card p-5 md:p-6 lg:col-span-8">
        <SectionHeader eyebrow="Consistencia" title="Mapa de actividad" />
        <Suspense fallback={<div className="skeleton h-32" />}>
          <ActivityHeatmap data={heatmapData} weeks={26} />
        </Suspense>
      </motion.section>

      {/* ══ ACTIVIDAD RECIENTE ══ */}
      <motion.aside
        variants={enterItem}
        className="min-w-0 card flex flex-col p-5 lg:col-span-4"
      >
        <SectionHeader eyebrow="Historial" title="Actividad reciente" />
        {recent.length > 0 ? (
          <ul className="flex-1 space-y-2">
            {recent.map((w) => (
              <li
                key={w.id}
                className="flex items-center justify-between rounded-lg border border-[color-mix(in_oklab,white_5%,transparent)] bg-surface-2 px-3 py-2.5"
              >
                <span className="flex items-center gap-2.5 text-sm">
                  <Calendar size={14} className="text-(--tier)" />
                  {new Date(w.date).toLocaleDateString("es-ES", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                </span>
                <span className="flex items-center gap-1 font-mono text-sm tabular-nums text-fg-muted">
                  <Clock size={12} />
                  {Math.floor(w.duration / 60)}m
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex-1 space-y-2">
            {[0.45, 0.3, 0.18].map((op, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border border-dashed border-border-subtle px-3 py-2.5"
                style={{ opacity: op }}
              >
                <span className="flex items-center gap-2.5 text-sm text-fg-dim">
                  <Calendar size={14} />
                  Próximo entreno
                </span>
                <span className="font-mono text-sm text-fg-dim">—</span>
              </div>
            ))}
            <p className="pt-1 text-xs text-fg-dim">
              Tus workouts aparecerán aquí.
            </p>
          </div>
        )}
        <Button
          variant="outline"
          size="md"
          className="mt-4 w-full"
          onClick={onStartWorkout}
        >
          <Zap size={14} strokeWidth={2.5} />
          Nuevo workout
        </Button>
      </motion.aside>
    </motion.div>
  );
}

/** Stat compacta integrada en el hero */
function HeroStat({
  icon: Icon,
  value,
  valueStr,
  label,
  accent = "var(--tier)",
}: {
  icon: LucideIcon;
  value?: number;
  valueStr?: string;
  label: string;
  accent?: string;
}) {
  return (
    <div className="min-w-24">
      <div className="mb-1 flex items-center gap-1.5" style={{ color: accent }}>
        <Icon size={14} />
        <span className="eyebrow !text-[11px] !text-fg-muted">{label}</span>
      </div>
      {valueStr !== undefined ? (
        <div
          className="font-display text-xl font-bold tracking-tight"
          style={{ color: accent }}
        >
          {valueStr}
        </div>
      ) : (
        <div className="font-display text-3xl font-bold tracking-tight tabular-nums">
          <NumberTicker value={value ?? 0} />
        </div>
      )}
    </div>
  );
}

/** Misión del quest-log inicial */
function Quest({
  n,
  done,
  icon: Icon,
  title,
  desc,
}: {
  n: number;
  done: boolean;
  icon: LucideIcon;
  title: string;
  desc: string;
}) {
  return (
    <div
      className={
        done
          ? "flex items-center gap-3 rounded-xl border border-(--tier-border) bg-(--tier-softer) p-3.5"
          : "flex items-center gap-3 rounded-xl border border-border-subtle bg-surface-2 p-3.5"
      }
    >
      <span
        className={
          done
            ? "flex size-9 shrink-0 items-center justify-center rounded-full bg-(--tier) text-(--tier-contrast)"
            : "flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-3 font-mono text-sm font-bold text-fg-muted"
        }
      >
        {done ? <Check size={16} strokeWidth={3} /> : n}
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-sm font-semibold">
          <Icon size={13} className={done ? "text-(--tier)" : "text-fg-muted"} />
          <span className={done ? "text-(--tier)" : undefined}>{title}</span>
        </div>
        <div className="mt-0.5 text-xs text-fg-muted">{desc}</div>
      </div>
    </div>
  );
}
