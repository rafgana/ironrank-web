import { useEffect, useMemo, useState, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useWorkoutStore } from "../store/workoutStore";
import { useProfileStore } from "../store/profileStore";
import { useStandardsStore } from "../store/standardsStore";
import { useOverallTier } from "../hooks/useOverallTier";
import { db } from "../db/database";
import { bestSetPerExercise } from "../db/queries";
import { estimatedMax } from "../utils/estimators";
import { tierFor, exerciseScore } from "../services/rankingService";
import { TierEmblem } from "../components/ironrank/TierEmblem";
import { TierProgression } from "../components/ironrank/TierProgression";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { NumberTicker } from "../components/magicui/number-ticker";
import { enterItem, enterStagger } from "../lib/motionTokens";
import { ShareCard } from "../components/ShareCard";
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
  Target,
  Share2,
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
  history: string;
}

export function Dashboard({ onStartWorkout }: DashboardProps) {
  const ws = useWorkoutStore();
  const ps = useProfileStore();
  const std = useStandardsStore();
  const overall = useOverallTier();
  const [topLifts, setTopLifts] = useState<BigLift[]>([]);
  const [activeQuests, setActiveQuests] = useState({
    profile: false,
    workout: false,
    ranked: false,
  });
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    ws.loadWorkouts();
    ws.loadProfile();
  }, []);

  useEffect(() => {
    if (!ps.profile) return;
    let cancelled = false;
    (async () => {
      // Top ejercicios del usuario por score contra su tier Retador.
      // Sin hardcodear nombres: usa los 3 mejores de los que tenga data,
      // y rellena hasta 3 con placeholders "registra otro ejercicio".
      const all = await bestSetPerExercise();
      const ranked = all
        .map((b) => {
          const rm = estimatedMax(b.set.weight, b.set.reps, b.set.rir);
          const tier = std.standards
            ? tierFor(
                rm,
                ps.profile!.bodyweight,
                ps.profile!.gender,
                ps.profile!.age,
                b.exerciseName,
                std.standards,
              )
            : "Bronce";
          const score = std.standards
            ? exerciseScore(
                rm,
                ps.profile!.bodyweight,
                ps.profile!.gender,
                ps.profile!.age,
                b.exerciseName,
                std.standards,
              )
            : 0;
          return { name: b.exerciseName, rm, tier, history: "", score };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);
      if (!cancelled) {
        setTopLifts(ranked);
        setActiveQuests({
          profile: true,
          workout: ws.workouts.length > 0,
          ranked: ranked.length >= 3,
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ps.profile, ws.workouts, std.standards]);

  const totalWorkouts = ws.workouts.length;

  // Cuántos workouts esta semana (lunes a domingo)
  const weekWorkouts = useMemo(() => {
    const now = new Date();
    const dow = (now.getDay() + 6) % 7; // 0=Lun, 6=Dom
    const monday = new Date(now);
    monday.setDate(now.getDate() - dow);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 7);
    return ws.workouts.filter((w) => {
      const d = new Date(w.date);
      return d >= monday && d < sunday;
    }).length;
  }, [ws.workouts]);

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

  return (
    <motion.div
      variants={enterStagger}
      initial="hidden"
      animate="show"
      className="space-y-5"
    >
      {/* ═══ HERO BANNER — full-width, horizontal, dense ═══ */}
      <motion.section
        variants={enterItem}
        className="card card-tier hud bg-noise relative min-w-0 overflow-hidden"
      >
        <div
          className="absolute inset-x-0 top-0 h-[2px]"
          style={{ background: "linear-gradient(90deg, transparent, var(--tier) 50%, transparent)" }}
        />
        <div className="relative z-10 grid items-center gap-4 p-5 md:gap-6 md:p-7 lg:grid-cols-[auto_1fr_auto]">
          <div className="flex items-center gap-4 md:gap-5">
            <TierEmblem
              tier={overall.tier}
              size="lg"
              animated
              ringProgress={overall.hasData ? overall.score : undefined}
            />
            <div className="md:hidden">
              <div className="eyebrow-bracket eyebrow text-(--tier)">rango</div>
              <h1 className="display tier-gradient-text text-4xl font-bold leading-none">
                {overall.tier}
              </h1>
            </div>
          </div>
          <div className="min-w-0 space-y-2.5">
            <div className="hidden md:flex items-center gap-2">
              <span className="eyebrow-bracket eyebrow text-(--tier)">rango actual</span>
              <span className="eyebrow text-fg-dim">/</span>
              <span className="eyebrow text-fg-dim">Temporada · 2026</span>
            </div>
            <div className="hidden md:block">
              <h1
                className="display tier-gradient-text font-bold leading-[0.92] tracking-[-0.02em]"
                style={{ fontSize: "clamp(2.5rem, 5vw, 4.5rem)" }}
              >
                {overall.tier}
                <span className="serif-italic text-(--tier) opacity-80">.</span>
              </h1>
            </div>
            <p className="text-sm text-fg-muted max-w-[58ch] text-pretty">
              {overall.hasData
                ? `Score ${overall.score}/100 · ${overall.exerciseCount} ${overall.exerciseCount === 1 ? "ejercicio" : "ejercicios"}. ${overall.nextTier ? `Próximo: ${overall.nextTier}.` : "Rango máximo alcanzado."}`
                : "Registra tu primer ejercicio para desbloquear tu rango real."}
            </p>
            {overall.hasData && overall.nextTier && (
              <div className="space-y-1.5 max-w-md pt-1">
                <div
                  className="relative h-1.5 rounded-full overflow-hidden"
                  style={{ background: "var(--color-surface-3)" }}
                >
                  <div
                    className="h-full rounded-full tier-glow"
                    style={{
                      width: `${overall.score}%`,
                      background: "var(--tier-gradient)",
                    }}
                  />
                </div>
                <div className="flex justify-between text-[9px] font-mono text-fg-dim tabular-nums uppercase tracking-[0.14em]">
                  <span>bronce</span>
                  <span style={{ color: "var(--tier)" }}>{overall.score}%</span>
                  <span>retador</span>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowShare(true)}
              className="h-12 px-4 max-md:hidden"
            >
              <Share2 size={14} />
              Compartir
            </Button>
            <Button onClick={onStartWorkout} className="h-12 px-5">
              <Zap size={16} strokeWidth={2.5} fill="currentColor" />
              {totalWorkouts ? "Nuevo workout" : "Empezar primer workout"}
            </Button>
          </div>
        </div>
      </motion.section>

      {/* ═══ STATS — 4 compact tiles ═══ */}
      <motion.section
        variants={enterItem}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      >
        <StatTile
          icon={Calendar}
          label="Esta semana"
          value={weekWorkouts}
          hint={
            ps.profile?.weeklyWorkoutsGoal && ps.profile.weeklyWorkoutsGoal > 0
              ? `/ ${ps.profile.weeklyWorkoutsGoal} workouts`
              : "workouts"
          }
          accent="var(--color-tier-esmeralda)"
        />
        <StatTile
          icon={Flame}
          label="Racha"
          value={streak}
          hint={streak === 1 ? "día" : "días"}
          accent="var(--color-brand-500)"
        />
        <StatTile
          icon={Trophy}
          label="Rango"
          valueStr={overall.tier}
          hint="7 niveles"
          accent={TIER_VARS[overall.tier]}
        />
        <StatTile
          icon={Dumbbell}
          label="Total"
          value={totalWorkouts}
          hint="workouts"
        />
      </motion.section>

      {/* ═══ CAMINO AL RETADOR + MAPA DE ACTIVIDAD — 2 cols ═══ */}
      <motion.section
        variants={enterItem}
        className="grid gap-4 lg:grid-cols-2 items-start"
      >
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="eyebrow">Clasificatoria</div>
              <h2 className="font-display text-lg font-semibold tracking-tight mt-0.5">
                Camino al Retador
              </h2>
            </div>
            <span
              className="font-condensed tracking-widest text-[10px] px-2 py-1 rounded-md"
              style={{
                background: "var(--tier-softer)",
                color: "var(--tier)",
                border: "1px solid var(--tier-border)",
              }}
            >
              7 TIERS
            </span>
          </div>
          <TierProgression currentTier={overall.tier} />
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="eyebrow">Consistencia</div>
              <h2 className="font-display text-lg font-semibold tracking-tight mt-0.5">
                Mapa de actividad
              </h2>
            </div>
            <div className="hidden md:flex items-center gap-3 text-[11px] text-fg-muted">
              <span className="flex items-center gap-1.5">
                <Flame
                  size={11}
                  style={{ color: "var(--color-brand-500)" }}
                />
                <span className="tabular-nums font-mono">{streak}</span>
              </span>
              <span className="text-fg-dim">·</span>
              <span className="font-mono tabular-nums">{totalWorkouts}</span>
            </div>
          </div>
          <Suspense
            fallback={<div className="skeleton h-32" />}
          >
            <ActivityHeatmap data={heatmapData} weeks={20} />
          </Suspense>
        </div>
      </motion.section>

      {/* ═══ TUS EJERCICIOS TOP — los 3 mejores por score ═══ */}
      <motion.section
        variants={enterItem}
        className="card p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="eyebrow">Top ejercicios</div>
            <h2 className="font-display text-lg font-semibold tracking-tight mt-0.5">
              {topLifts.length > 0
                ? "Tus 3 mejores"
                : "Tus ejercicios top"}
            </h2>
          </div>
          <span className="font-mono text-[10px] text-fg-dim tabular-nums">
            {topLifts.length} {topLifts.length === 1 ? "ejercicio" : "ejercicios"}
          </span>
        </div>
        {topLifts.length === 0 ? (
          <div className="text-sm text-fg-muted py-4 text-center">
            Registra tu primer ejercicio para verlo aquí con su tier.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            {topLifts.map((l) =>
              l.rm != null && l.tier ? (
                <div
                  key={l.name}
                  className="flex items-center gap-3 rounded-xl border p-4"
                  style={{
                    borderColor: tierAlpha(l.tier, 30),
                    background: tierAlpha(l.tier, 6),
                  }}
                >
                  <TierEmblem tier={l.tier} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">
                      {l.name}
                    </div>
                    <div
                      className="font-display text-2xl font-bold tabular-nums leading-none mt-1"
                      style={{ color: TIER_VARS[l.tier] }}
                    >
                      {l.rm.toFixed(1)}
                      <span className="ml-0.5 text-[10px] font-normal text-fg-muted">
                        kg
                      </span>
                    </div>
                    <div
                      className="text-[10px] font-condensed tracking-widest mt-1"
                      style={{ color: TIER_VARS[l.tier] }}
                    >
                      {l.tier.toUpperCase()}
                    </div>
                  </div>
                </div>
              ) : null,
            )}
          </div>
        )}
      </motion.section>

      {/* ═══ QUEST LOG — primeros pasos ═══ */}
      {!activeQuests.ranked && (
        <motion.section variants={enterItem} className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="eyebrow">Misiones</div>
              <h2 className="font-display text-lg font-semibold tracking-tight mt-0.5">
                Primeros pasos
              </h2>
            </div>
            <div className="font-mono text-[10px] text-fg-dim tabular-nums">
              {Object.values(activeQuests).filter(Boolean).length}/3
            </div>
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            <QuestRow
              n={1}
              done={activeQuests.profile}
              icon={User}
              title="Configura tu perfil"
              desc="Peso, edad y descanso por defecto"
            />
            <QuestRow
              n={2}
              done={activeQuests.workout}
              icon={Dumbbell}
              title="Completa un workout"
              desc="Registra tus primeras series"
            />
            <QuestRow
              n={3}
              done={activeQuests.ranked}
              icon={TrendingUp}
              title="Desbloquea tu rango"
              desc="Registra 3 ejercicios para ver tu tier combinado"
            />
          </div>
        </motion.section>
      )}

      {/* Share card modal */}
      <AnimatePresence>
        {showShare && (
          <ShareCard
            open={showShare}
            onClose={() => setShowShare(false)}
            tier={overall.tier}
            stats={{
              totalWorkouts: ws.workouts.length,
              streak: streak,
              bestLift: topLifts.find((l) => l.rm != null && l.rm > 0)
                ? {
                    name: topLifts.find((l) => l.rm != null && l.rm > 0)!.name,
                    weight: Math.round((topLifts.find((l) => l.rm != null && l.rm > 0)!.rm ?? 0) * 10) / 10,
                    reps: 1,
                  }
                : undefined,
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  valueStr,
  hint,
  accent = "var(--tier)",
}: {
  icon: LucideIcon;
  label: string;
  value?: number;
  valueStr?: string;
  hint?: string;
  accent?: string;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <Icon size={14} style={{ color: "var(--color-fg-muted)" }} />
        <span className="eyebrow !text-fg-dim">{label}</span>
      </div>
      <div
        className="font-display text-3xl font-bold leading-none tabular-nums"
        style={{ color: accent }}
      >
        {valueStr !== undefined ? (
          valueStr
        ) : (
          <NumberTicker value={value ?? 0} />
        )}
      </div>
      {hint && (
        <div className="text-[10px] font-mono text-fg-dim mt-2 truncate">
          {hint}
        </div>
      )}
    </div>
  );
}

function QuestRow({
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
      className="flex items-center gap-3 p-3 rounded-lg transition-colors"
      style={{
        background: done
          ? "var(--tier-softer)"
          : "var(--color-surface-2)",
        border: `1px solid ${done ? "var(--tier-border)" : "transparent"}`,
      }}
    >
      <div
        className="size-9 rounded-full flex items-center justify-center shrink-0 font-mono text-sm font-bold"
        style={
          done
            ? {
                background: "var(--tier)",
                color: "var(--tier-contrast)",
              }
            : {
                background: "var(--color-surface-3)",
                color: "var(--color-fg-muted)",
              }
        }
      >
        {done ? <Check size={15} strokeWidth={3} /> : n}
      </div>
      <div className="min-w-0 flex-1">
        <div
          className="text-sm font-semibold"
          style={done ? { color: "var(--tier)" } : undefined}
        >
          {title}
        </div>
        <div className="text-[11px] text-fg-muted leading-snug">{desc}</div>
      </div>
    </div>
  );
}
