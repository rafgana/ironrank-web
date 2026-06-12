import { useEffect, useMemo, useState, lazy, Suspense } from "react";
import { motion } from "motion/react";
import { useWorkoutStore } from "../store/workoutStore";
import { useProfileStore } from "../store/profileStore";
import { useOverallTier } from "../hooks/useOverallTier";
import { db } from "../db/database";
import { bestSetForExercise } from "../db/queries";
import { estimatedMax } from "../utils/estimators";
import { tierFor } from "../services/rankingService";
import { TierEmblem } from "../components/ironrank/TierEmblem";
import { TierProgression } from "../components/ironrank/TierProgression";
import { SectionHeader } from "../components/ui/SectionHeader";
import { TierProgressBar } from "../components/ui/TierProgressBar";
import { Button } from "../components/ui/button";
import { NumberTicker } from "../components/magicui/number-ticker";
import { enterItem, enterStagger } from "../lib/motionTokens";
import { TIER_VARS, tierAlpha, type Tier } from "../models/types";
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
  Lock,
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

interface BigLift {
  name: string;
  rm: number | null;
  tier: Tier | null;
}

const BIG_LIFTS = ["Press Banca", "Sentadilla", "Peso Muerto"];

export function Dashboard({ onStartWorkout }: DashboardProps) {
  const ws = useWorkoutStore();
  const ps = useProfileStore();
  const overall = useOverallTier();
  const [bigLifts, setBigLifts] = useState<BigLift[]>(
    BIG_LIFTS.map((name) => ({ name, rm: null, tier: null })),
  );

  useEffect(() => {
    ws.loadWorkouts();
    ws.loadProfile();
  }, []);

  useEffect(() => {
    if (!ps.profile) return;
    let cancelled = false;
    (async () => {
      const lifts: BigLift[] = [];
      for (const name of BIG_LIFTS) {
        const e = await db.exercises
          .filter((x) => x.name.toLowerCase().includes(name.toLowerCase()))
          .first();
        const best = e ? await bestSetForExercise(e.id!) : null;
        if (best) {
          const rm = estimatedMax(best.weight, best.reps, best.rir);
          lifts.push({
            name,
            rm,
            tier: tierFor(
              rm,
              ps.profile!.bodyweight,
              ps.profile!.gender,
              ps.profile!.age,
              name,
            ),
          });
        } else {
          lifts.push({ name, rm: null, tier: null });
        }
      }
      if (!cancelled) setBigLifts(lifts);
    })();
    return () => {
      cancelled = true;
    };
  }, [ps.profile, ws.workouts]);

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
      className="grid auto-rows-min gap-4 lg:grid-cols-12"
    >
      {/* ══ HERO VERTICAL: identidad ranked (columna izquierda, 2 filas) ══ */}
      <motion.section
        variants={enterItem}
        className="card-accent hud bg-noise relative min-w-0 overflow-hidden lg:col-span-4 lg:row-span-2"
      >
        <div className="absolute inset-x-0 top-0 h-[2px] bg-[linear-gradient(90deg,transparent,var(--tier),transparent)] opacity-70" />
        <div className="relative z-10 flex h-full flex-col items-center gap-4 p-6 text-center lg:p-7">
          <div className="eyebrow text-(--tier)">
            Rango actual · Temporada 2026
          </div>
          <TierEmblem
            tier={overall.tier}
            size="xl"
            animated
            ringProgress={overall.hasData ? overall.score : undefined}
          />
          <h1 className="font-display tier-gradient-text text-display leading-none font-bold">
            {overall.tier}
          </h1>

          {overall.hasData ? (
            <div className="w-full max-w-xs space-y-2">
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
                <span className="font-mono tabular-nums">{overall.score}%</span>
              </div>
              <TierProgressBar value={overall.score} />
            </div>
          ) : (
            <p className="max-w-xs text-sm text-fg-muted">
              Registra tu primer{" "}
              <span className="font-semibold text-fg">Press Banca</span>,{" "}
              <span className="font-semibold text-fg">Sentadilla</span> o{" "}
              <span className="font-semibold text-fg">Peso Muerto</span> para
              desbloquear tu rango real.
            </p>
          )}

          <Button
            variant="tier"
            size="lg"
            onClick={onStartWorkout}
            className="w-full max-w-xs"
          >
            <Zap size={16} strokeWidth={2.5} />
            {totalWorkouts ? "Nuevo workout" : "Empezar primer workout"}
          </Button>

          {/* Stats integradas al pie del hero */}
          <div className="mt-auto grid w-full grid-cols-2 gap-x-6 gap-y-4 border-t border-(--tier-border) pt-5 text-left">
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

      {/* ══ CAMINO AL RETADOR ══ */}
      <motion.section
        variants={enterItem}
        className="card min-w-0 p-5 lg:col-span-8"
      >
        <SectionHeader eyebrow="Clasificatoria" title="Camino al Retador" />
        <TierProgression currentTier={overall.tier} />
      </motion.section>

      {/* ══ MAPA DE ACTIVIDAD ══ */}
      <motion.section
        variants={enterItem}
        className="card min-w-0 p-5 lg:col-span-8"
      >
        <SectionHeader eyebrow="Consistencia" title="Mapa de actividad" />
        <Suspense fallback={<div className="skeleton h-32" />}>
          <ActivityHeatmap data={heatmapData} weeks={26} />
        </Suspense>
      </motion.section>

      {/* ══ ACTIVIDAD RECIENTE ══ */}
      <motion.aside
        variants={enterItem}
        className="card flex min-w-0 flex-col p-5 lg:col-span-4"
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

      {/* ══ LOS 3 GRANDES: slots bloqueados/desbloqueados ══ */}
      <motion.section
        variants={enterItem}
        className="card min-w-0 p-5 lg:col-span-8"
      >
        <SectionHeader
          eyebrow="Big three"
          title="Los 3 grandes"
          action={
            <span className="font-mono text-sm tabular-nums text-fg-dim">
              {bigLifts.filter((l) => l.rm).length}/3
            </span>
          }
        />
        <div className="grid gap-3 sm:grid-cols-3">
          {bigLifts.map((l) =>
            l.rm && l.tier ? (
              <div
                key={l.name}
                className="flex items-center gap-3 rounded-xl border p-3.5"
                style={{
                  borderColor: tierAlpha(l.tier, 30),
                  background: tierAlpha(l.tier, 6),
                }}
              >
                <TierEmblem tier={l.tier} size="sm" />
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{l.name}</div>
                  <div
                    className="font-display text-xl font-bold tabular-nums"
                    style={{ color: TIER_VARS[l.tier] }}
                  >
                    {l.rm.toFixed(1)}
                    <span className="ml-0.5 text-xs font-normal text-fg-muted">
                      kg
                    </span>
                  </div>
                  <div className="text-xs" style={{ color: TIER_VARS[l.tier] }}>
                    {l.tier}
                  </div>
                </div>
              </div>
            ) : (
              <div
                key={l.name}
                className="flex items-center gap-3 rounded-xl border border-dashed border-border-subtle bg-surface-2/50 p-3.5"
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-surface-3 text-fg-dim">
                  <Lock size={18} />
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-fg-muted">
                    {l.name}
                  </div>
                  <div className="text-xs text-fg-dim">
                    Bloqueado · sin registro
                  </div>
                </div>
              </div>
            ),
          )}
        </div>
      </motion.section>

      {/* ══ QUEST LOG (solo sin rango desbloqueado) ══ */}
      {!overall.hasData && (
        <motion.section
          variants={enterItem}
          className="card min-w-0 p-5 lg:col-span-12"
        >
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
    <div className="min-w-0">
      <div className="mb-1 flex items-center gap-1.5" style={{ color: accent }}>
        <Icon size={14} />
        <span className="eyebrow !text-[11px] !text-fg-muted">{label}</span>
      </div>
      {valueStr !== undefined ? (
        <div
          className="font-display truncate text-xl font-bold tracking-tight"
          style={{ color: accent }}
        >
          {valueStr}
        </div>
      ) : (
        <div className="font-display text-2xl font-bold tracking-tight tabular-nums">
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
          <Icon
            size={13}
            className={done ? "text-(--tier)" : "text-fg-muted"}
          />
          <span className={done ? "text-(--tier)" : undefined}>{title}</span>
        </div>
        <div className="mt-0.5 text-xs text-fg-muted">{desc}</div>
      </div>
    </div>
  );
}
