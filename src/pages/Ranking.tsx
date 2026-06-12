import { useEffect, useMemo, useState, lazy, Suspense } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useProfileStore } from "../store/profileStore";
import { db } from "../db/database";
import { bestSetForExercise } from "../db/queries";
import { estimatedMax } from "../utils/estimators";
import {
  tierFor,
  nextMilestone,
  tierFromScore,
  rankedScore,
} from "../services/rankingService";
import {
  TIERS,
  TIER_VARS,
  type Tier,
  type Exercise,
} from "../models/types";
import { TierEmblem } from "../components/ironrank/TierEmblem";
import { TierProgression } from "../components/ironrank/TierProgression";
import { NumberTicker } from "../components/magicui/number-ticker";
import { AnimatedTabs } from "../components/ui/AnimatedTabs";
import { SectionHeader } from "../components/ui/SectionHeader";
import { TierProgressBar } from "../components/ui/TierProgressBar";
import { EmptyState } from "../components/ui/EmptyState";
import { enterItem, enterStagger, springUI } from "../lib/motionTokens";
import {
  Dumbbell,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Target,
  Crown,
} from "lucide-react";

const BellCurve = lazy(() =>
  import("../components/ironrank/BellCurve").then((m) => ({
    default: m.BellCurve,
  })),
);

interface ExerciseRow {
  id?: number;
  name: string;
  musclePrimary: string;
  equipment: string;
  tier: Tier;
  rm: number;
  progress: number;
  nextTier: Tier | null;
  weightNeeded: number;
  isMax: boolean;
  previousRm: number;
}

const TRACKED_EXERCISES = [
  "Press Banca",
  "Sentadilla",
  "Peso Muerto",
  "Press Militar",
  "Remo Barra",
  "Dominadas",
];

export function Ranking() {
  const profile = useProfileStore((s) => s.profile);
  const [exercises, setExercises] = useState<ExerciseRow[]>([]);
  const [overall, setOverall] = useState<Tier>("Bronce");
  const [score, setScore] = useState(0);
  const [filter, setFilter] = useState<string>("all");
  const [sort, setSort] = useState<"1rm" | "progress" | "name">("1rm");

  useEffect(() => {
    if (profile) load();
  }, [profile]);

  const load = async () => {
    const p = profile!;
    const exs = await db.exercises
      .filter((e) => TRACKED_EXERCISES.includes(e.name))
      .toArray();

    let benchR = 0;
    let squatR = 0;
    let deadR = 0;

    const data: ExerciseRow[] = await Promise.all(
      exs.map(async (e: Exercise) => {
        const best = await bestSetForExercise(e.id!);
        if (!best) {
          return {
            id: e.id,
            name: e.name,
            musclePrimary: e.musclePrimary,
            equipment: e.equipment,
            tier: "Bronce" as Tier,
            rm: 0,
            progress: 0,
            nextTier: "Plata" as Tier,
            weightNeeded: 0,
            isMax: false,
            previousRm: 0,
          };
        }
        const rm = estimatedMax(best.weight, best.reps, best.rir);
        const t = tierFor(rm, p.bodyweight, p.gender, p.age, e.name);
        const m = nextMilestone(rm, p.bodyweight, p.gender, p.age, e.name);

        const prevSets = await db.sets
          .where("workoutExerciseId")
          .above(0)
          .filter((s) => s.completed)
          .toArray();
        const exWEs = await db.workoutExercises
          .where("exerciseId")
          .equals(e.id!)
          .toArray();
        const exSetIds = new Set(exWEs.map((we) => we.id!));
        const exSets = prevSets.filter((s) => exSetIds.has(s.workoutExerciseId));
        const sortedSets = exSets.sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
        const halfIdx = Math.floor(sortedSets.length / 2);
        const recentSet = sortedSets[sortedSets.length - 1];
        const oldSet = sortedSets[Math.max(0, halfIdx - 1)];

        const recentRm = recentSet
          ? estimatedMax(recentSet.weight, recentSet.reps, recentSet.rir)
          : 0;
        const oldRm = oldSet
          ? estimatedMax(oldSet.weight, oldSet.reps, oldSet.rir)
          : 0;

        const tIdx = TIERS.indexOf(t);
        const nextIdx = tIdx < TIERS.length - 1 ? TIERS[tIdx + 1] : null;
        const progress = nextIdx
          ? Math.min(
              100,
              Math.max(
                0,
                (rm / (m?.weightNeeded ? rm + m.weightNeeded : rm + 1)) * 100,
              ),
            )
          : 100;

        if (e.name.includes("Press Banca")) benchR = rm;
        if (e.name.includes("Sentadilla")) squatR = rm;
        if (e.name.includes("Peso Muerto")) deadR = rm;

        return {
          id: e.id,
          name: e.name,
          musclePrimary: e.musclePrimary,
          equipment: e.equipment,
          tier: t,
          rm,
          progress,
          nextTier: nextIdx,
          weightNeeded: m?.weightNeeded ?? 0,
          isMax: !nextIdx,
          previousRm: recentRm - oldRm,
        };
      }),
    );

    const s = rankedScore(benchR, squatR, deadR, p.bodyweight);
    setScore(s);
    setOverall(tierFromScore(s));
    setExercises(data);
  };

  const filtered = useMemo(() => {
    let list = exercises;
    if (filter !== "all") list = list.filter((e) => e.musclePrimary === filter);
    list = [...list].sort((a, b) => {
      if (sort === "1rm") return b.rm - a.rm;
      if (sort === "progress") return b.progress - a.progress;
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [exercises, filter, sort]);

  const muscles = useMemo(
    () => Array.from(new Set(exercises.map((e) => e.musclePrimary))).sort(),
    [exercises],
  );

  const currentIdx = TIERS.indexOf(overall);
  const nextTier = currentIdx < TIERS.length - 1 ? TIERS[currentIdx + 1] : null;
  const progressPct = Math.round(score * 100);

  return (
    <motion.div
      variants={enterStagger}
      initial="hidden"
      animate="show"
      className="grid items-start gap-4 md:gap-6 lg:grid-cols-12"
    >
      {/* COLUMNA IZQUIERDA: identidad ranked (sticky en desktop) */}
      <motion.div
        variants={enterItem}
        className="min-w-0 space-y-4 md:space-y-6 lg:sticky lg:top-24 lg:col-span-4"
      >
        <section className="card-accent hud bg-noise relative overflow-hidden p-6 text-center md:p-8">
          <TierEmblem
            tier={overall}
            size="xl"
            animated
            ringProgress={progressPct}
            className="mx-auto"
          />
          <div className="eyebrow mt-4 text-(--tier)">Rango general</div>
          <h1 className="font-display tier-gradient-text text-h1 font-bold">
            {overall}
          </h1>
          <div className="mt-3 font-display text-2xl font-bold tabular-nums">
            <NumberTicker value={Math.round(score * 1000)} duration={1.2} />
            <span className="ml-1 text-sm font-normal text-fg-muted">
              / 1000
            </span>
          </div>
          {nextTier ? (
            <div className="mt-4 space-y-2 text-left">
              <div className="flex justify-between text-sm text-fg-muted">
                <span>
                  Progreso a{" "}
                  <span
                    className="font-semibold"
                    style={{ color: TIER_VARS[nextTier] }}
                  >
                    {nextTier}
                  </span>
                </span>
                <span className="font-mono tabular-nums">{progressPct}%</span>
              </div>
              <TierProgressBar value={progressPct} />
            </div>
          ) : (
            <div className="eyebrow mt-4 flex items-center justify-center gap-1.5 text-(--tier)">
              <Crown size={12} />
              Rango máximo
            </div>
          )}
          <p className="mt-4 text-xs leading-relaxed text-fg-muted">
            1RM estimados de Press Banca, Sentadilla y Peso Muerto,
            normalizados por tu peso corporal ({profile?.bodyweight ?? "—"} kg).
          </p>
        </section>

        {/* Escalera de tiers: vertical en desktop, horizontal en móvil */}
        <section className="card p-4 md:p-5">
          <SectionHeader eyebrow="Clasificatoria" title="Camino al Retador" />
          <div className="max-lg:hidden">
            <TierProgression currentTier={overall} orientation="vertical" />
          </div>
          <div className="lg:hidden">
            <TierProgression currentTier={overall} />
          </div>
        </section>
      </motion.div>

      {/* COLUMNA DERECHA: distribución + ejercicios */}
      <div className="min-w-0 space-y-4 md:space-y-6 lg:col-span-8">
        <motion.section variants={enterItem} className="card p-4 md:p-6">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="eyebrow mb-1">Distribución poblacional</div>
              <div
                className="font-display text-2xl font-bold"
                style={{ color: TIER_VARS[overall] }}
              >
                {progressPct === 0 ? (
                  <span className="text-fg-dim">—</span>
                ) : (
                  <>
                    Top{" "}
                    <NumberTicker
                      value={Math.max(1, Math.round(100 - progressPct * 1.2))}
                    />
                    %
                  </>
                )}
              </div>
            </div>
          </div>
          <Suspense fallback={<div className="skeleton h-44" />}>
            <BellCurve
              currentTier={overall}
              userPosition={(currentIdx + 0.5) * (100 / TIERS.length)}
            />
          </Suspense>
        </motion.section>

        <motion.section variants={enterItem}>
          <SectionHeader
            eyebrow="Por ejercicio"
            title="Tus ejercicios"
            action={
              <span className="text-sm tabular-nums text-fg-dim">
                {filtered.length}
              </span>
            }
          />

          <div className="mb-3 flex flex-wrap items-center gap-2">
            <AnimatedTabs
              layoutId="ranking-filter"
              scrollable
              tabs={[
                { value: "all", label: "Todos" },
                ...muscles.map((m) => ({ value: m, label: m })),
              ]}
              value={filter}
              onChange={setFilter}
            />
          </div>
          <div className="mb-4 flex items-center justify-end gap-2">
            <span className="text-xs text-fg-dim">Ordenar</span>
            <AnimatedTabs
              layoutId="ranking-sort"
              tabs={[
                { value: "1rm", label: "1RM" },
                { value: "progress", label: "Progreso" },
                { value: "name", label: "A-Z" },
              ]}
              value={sort}
              onChange={setSort}
            />
          </div>

          {filtered.length > 0 ? (
            <motion.div layout className="space-y-2.5">
              <AnimatePresence initial={false}>
                {filtered.map((e) => (
                  <motion.div
                    key={e.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={springUI}
                  >
                    <ExerciseCard exercise={e} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <EmptyState
              icon={Dumbbell}
              title="Sin ejercicios aún"
              body="Empieza un workout para desbloquear tu ranking por ejercicio."
            />
          )}
        </motion.section>
      </div>
    </motion.div>
  );
}

function ExerciseCard({ exercise: e }: { exercise: ExerciseRow }) {
  const hasData = e.rm > 0;
  return (
    <div
      className="card relative overflow-hidden p-4 pl-5"
      style={{
        boxShadow: hasData
          ? `inset 3px 0 0 0 ${TIER_VARS[e.tier]}, var(--shadow-card)`
          : undefined,
      }}
    >
      <div className="flex items-center gap-4">
        <TierEmblem tier={e.tier} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-base font-semibold">{e.name}</span>
            {e.previousRm > 0.5 && (
              <span className="inline-flex items-center gap-0.5 text-xs text-emerald-400">
                <TrendingUp size={11} />
                {e.previousRm.toFixed(1)}kg
              </span>
            )}
            {e.previousRm < -0.5 && (
              <span className="inline-flex items-center gap-0.5 text-xs text-red-400">
                <TrendingDown size={11} />
                {Math.abs(e.previousRm).toFixed(1)}kg
              </span>
            )}
            {Math.abs(e.previousRm) <= 0.5 && hasData && (
              <span className="inline-flex items-center gap-0.5 text-xs text-fg-dim">
                <Minus size={11} />
                estable
              </span>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-fg-muted">
            <span>{e.musclePrimary}</span>
            <span className="text-fg-dim">·</span>
            <span>{e.equipment}</span>
          </div>
        </div>
        <div className="shrink-0 text-right">
          {hasData ? (
            <>
              <div
                className="font-display text-h2 leading-none font-bold tabular-nums"
                style={{ color: TIER_VARS[e.tier] }}
              >
                <NumberTicker value={Math.round(e.rm * 10) / 10} duration={1} />
                <span className="ml-0.5 text-xs font-normal text-fg-muted">
                  kg
                </span>
              </div>
              <div
                className="eyebrow mt-1 !text-[11px]"
                style={{ color: TIER_VARS[e.tier] }}
              >
                {e.tier}
              </div>
            </>
          ) : (
            <span className="text-xs text-fg-dim">sin datos</span>
          )}
        </div>
      </div>

      {hasData && !e.isMax && (
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 text-fg-muted">
              <Target size={11} />
              {e.nextTier ? `→ ${e.nextTier}` : "max"}
            </span>
            <span
              className="font-mono font-semibold tabular-nums"
              style={{ color: TIER_VARS[e.nextTier ?? e.tier] }}
            >
              {e.weightNeeded > 0 ? `+${e.weightNeeded.toFixed(1)}kg` : "—"}{" "}
              <span className="ml-1 font-normal text-fg-dim">
                {Math.round(e.progress)}%
              </span>
            </span>
          </div>
          <TierProgressBar value={e.progress} tier={e.tier} className="h-1.5" />
        </div>
      )}

      {e.isMax && hasData && (
        <div
          className="eyebrow mt-3 flex items-center gap-1.5"
          style={{ color: TIER_VARS[e.tier] }}
        >
          <Sparkles size={11} />
          Rango máximo
        </div>
      )}
    </div>
  );
}
