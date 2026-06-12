import { useEffect, useMemo, lazy, Suspense } from "react";
import { motion } from "motion/react";
import { useWorkoutStore } from "../store/workoutStore";
import { useOverallTier } from "../hooks/useOverallTier";
import { TierEmblem } from "../components/ironrank/TierEmblem";
import { StatTile } from "../components/ironrank/StatTile";
import { SectionHeader } from "../components/ui/SectionHeader";
import { TierProgressBar } from "../components/ui/TierProgressBar";
import { EmptyState } from "../components/ui/EmptyState";
import { Button } from "../components/ui/button";
import { enterItem, enterStagger } from "../lib/motionTokens";
import { TIER_VARS } from "../models/types";
import {
  Dumbbell,
  Flame,
  Trophy,
  Calendar,
  Zap,
  Clock,
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

  const recent = ws.workouts.slice(0, 5);

  return (
    <motion.div
      variants={enterStagger}
      initial="hidden"
      animate="show"
      className="grid gap-4 md:gap-6 lg:grid-cols-12"
    >
      {/* HERO DEL TIER */}
      <motion.section
        variants={enterItem}
        className="card-accent bg-noise relative overflow-hidden p-6 md:p-10 lg:col-span-8"
      >
        <div className="relative z-10 flex flex-col items-center gap-6 md:flex-row md:gap-10">
          <TierEmblem
            tier={overall.tier}
            size="2xl"
            animated
            ringProgress={overall.hasData ? overall.score : undefined}
            className="max-md:scale-90"
          />
          <div className="flex-1 space-y-3 text-center md:text-left">
            <div className="eyebrow text-(--tier)">Rango actual</div>
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
                Registra tu primer Press Banca, Sentadilla o Peso Muerto para
                desbloquear tu rango.
              </p>
            )}
          </div>
        </div>
      </motion.section>

      {/* ACTIVIDAD RECIENTE (right rail desktop) */}
      <motion.aside
        variants={enterItem}
        className="card flex flex-col p-5 lg:col-span-4 lg:row-span-2"
      >
        <SectionHeader eyebrow="Historial" title="Actividad reciente" />
        {recent.length > 0 ? (
          <ul className="flex-1 space-y-2">
            {recent.map((w) => (
              <li
                key={w.id}
                className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2.5"
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
          <p className="flex-1 text-sm text-fg-muted">
            Aún no hay entrenos registrados.
          </p>
        )}
        <Button
          variant="tier"
          size="lg"
          className="mt-4 w-full max-md:hidden"
          onClick={onStartWorkout}
        >
          <Zap size={16} strokeWidth={2.5} />
          {recent.length ? "Nuevo workout" : "Empezar primer workout"}
        </Button>
      </motion.aside>

      {/* STATS */}
      <motion.section
        variants={enterItem}
        className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4 lg:col-span-8"
      >
        <StatTile icon={Dumbbell} label="Entrenos" value={totalWorkouts} />
        <StatTile
          icon={Flame}
          label="Racha de días"
          value={streak}
          accent="var(--color-brand-500)"
        />
        <StatTile
          icon={Calendar}
          label="Esta semana"
          value={weekWorkouts}
          suffix={weekWorkouts === 1 ? "sesión" : "sesiones"}
          accent="var(--color-tier-esmeralda)"
        />
        <StatTile
          icon={Trophy}
          label="Rango"
          valueStr={overall.tier}
          accent={TIER_VARS[overall.tier]}
        />
      </motion.section>

      {/* HEATMAP DE ACTIVIDAD / EMPTY STATE */}
      <motion.section variants={enterItem} className="lg:col-span-12">
        {totalWorkouts > 0 ? (
          <div className="card p-5 md:p-6">
            <SectionHeader eyebrow="Consistencia" title="Mapa de actividad" />
            <Suspense fallback={<div className="skeleton h-32" />}>
              <ActivityHeatmap data={heatmapData} weeks={26} />
            </Suspense>
          </div>
        ) : (
          <EmptyState
            icon={Dumbbell}
            title="Tu primer PR te espera"
            body="Empieza una serie y compite por subir de tier. Sin cuentas, sin nube: todo queda en tu dispositivo."
          >
            <Button variant="cta" onClick={onStartWorkout}>
              <Zap size={20} strokeWidth={2.5} />
              Empezar primer workout
            </Button>
          </EmptyState>
        )}
      </motion.section>
    </motion.div>
  );
}
