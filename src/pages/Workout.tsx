"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  Plus,
  Timer,
  Activity,
  Dumbbell,
  ListChecks,
  Zap,
} from "lucide-react";
import { useWorkoutStore } from "../store/workoutStore";
import { useProfileStore } from "../store/profileStore";
import { db } from "../db/database";
import { bestSetForExercise } from "../db/queries";
import { estimatedMax } from "../utils/estimators";
import { tierFor } from "../services/rankingService";
import { TIER_VARS, tierAlpha, type Tier } from "../models/types";
import { Button } from "../components/ui/button";
import { StatTile } from "../components/ironrank/StatTile";
import { SectionHeader } from "../components/ui/SectionHeader";
import { EmptyState } from "../components/ui/EmptyState";
import { TierEmblem } from "../components/ironrank/TierEmblem";
import { enterItem, enterStagger, springUI } from "../lib/motionTokens";

interface WorkoutSummary {
  id?: number;
  date: Date;
  duration: number;
  totalSets: number;
  totalVolume: number;
  exerciseCount: number;
  prsHit: number;
  tier: Tier;
}

interface BestLift {
  name: string;
  rm: number;
  tier: Tier;
}

const BIG_LIFTS = ["Press Banca", "Sentadilla", "Peso Muerto"];

export function WorkoutList({ onStart }: { onStart: () => void }) {
  const ws = useWorkoutStore();
  const ps = useProfileStore();
  const [summaries, setSummaries] = useState<WorkoutSummary[]>([]);
  const [bestLifts, setBestLifts] = useState<BestLift[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSummaries();
    loadBestLifts();
  }, [ws.workouts, ps.profile]);

  const loadSummaries = async () => {
    setLoading(true);
    const all = await db.workouts.orderBy("date").reverse().toArray();
    const sums: WorkoutSummary[] = await Promise.all(
      all.map(async (w) => {
        const wes = await db.workoutExercises
          .where("workoutId")
          .equals(w.id!)
          .toArray();
        let totalSets = 0;
        let totalVolume = 0;
        let topRm = 0;
        let topExercise = "";
        for (const we of wes) {
          const exercise = await db.exercises.get(we.exerciseId);
          const sets = await db.sets
            .where("workoutExerciseId")
            .equals(we.id!)
            .filter((s) => s.completed)
            .toArray();
          totalSets += sets.length;
          for (const s of sets) {
            totalVolume += s.weight * s.reps;
            const rm = estimatedMax(s.weight, s.reps, s.rir);
            if (rm > topRm && exercise) {
              topRm = rm;
              topExercise = exercise.name;
            }
          }
        }
        let tier: Tier = "Bronce";
        if (ps.profile && topExercise) {
          tier = tierFor(
            topRm,
            ps.profile.bodyweight,
            ps.profile.gender,
            ps.profile.age,
            topExercise,
          );
        }
        return {
          id: w.id,
          date: new Date(w.date),
          duration: w.duration,
          totalSets,
          totalVolume,
          exerciseCount: wes.length,
          prsHit: 0,
          tier,
        };
      }),
    );
    setSummaries(sums);
    setLoading(false);
  };

  const loadBestLifts = async () => {
    if (!ps.profile) return;
    const lifts: BestLift[] = [];
    for (const name of BIG_LIFTS) {
      const e = await db.exercises
        .filter((x) => x.name.toLowerCase().includes(name.toLowerCase()))
        .first();
      if (!e) continue;
      const best = await bestSetForExercise(e.id!);
      if (!best) continue;
      const rm = estimatedMax(best.weight, best.reps, best.rir);
      lifts.push({
        name,
        rm,
        tier: tierFor(
          rm,
          ps.profile.bodyweight,
          ps.profile.gender,
          ps.profile.age,
          name,
        ),
      });
    }
    setBestLifts(lifts);
  };

  const total = summaries.length;
  const totalVolume = summaries.reduce((a, s) => a + s.totalVolume, 0);
  const avgDuration = total
    ? Math.round(summaries.reduce((a, s) => a + s.duration, 0) / total / 60)
    : 0;

  return (
    <motion.div
      variants={enterStagger}
      initial="hidden"
      animate="show"
      className="space-y-5"
    >
      <motion.header
        variants={enterItem}
        className="flex items-center justify-between"
      >
        <div>
          <div className="eyebrow mb-1">Historial</div>
          <h1 className="font-display text-h1 font-bold">Entrenos</h1>
          <p className="mt-1 text-sm text-fg-muted">
            {total} workouts completados
          </p>
        </div>
        <Button variant="tier" onClick={onStart} className="max-md:hidden">
          <Plus size={16} strokeWidth={2.5} />
          Nuevo
        </Button>
      </motion.header>

      {total > 0 && (
        <motion.div variants={enterItem} className="grid grid-cols-3 gap-3">
          <StatTile
            icon={Activity}
            value={totalVolume}
            suffix="kg"
            label="Volumen total"
          />
          <StatTile
            icon={Timer}
            value={avgDuration}
            suffix="min"
            label="Duración media"
            accent="var(--color-tier-esmeralda)"
          />
          <StatTile
            icon={Dumbbell}
            value={total}
            label="Workouts"
            accent="var(--color-brand-500)"
          />
        </motion.div>
      )}

      <div className="grid items-start gap-4 md:gap-6 lg:grid-cols-12">
        {/* TIMELINE */}
        <motion.section variants={enterItem} className="min-w-0 lg:col-span-8">
          {loading ? (
            <div className="space-y-2.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="skeleton h-20" />
              ))}
            </div>
          ) : total === 0 ? (
            <EmptyState
              icon={Dumbbell}
              title="Tu primer workout"
              body="Empieza ahora y desbloquea tu primer rango. Cada serie suma."
            >
              <Button variant="cta" onClick={onStart}>
                <Zap size={18} strokeWidth={2.5} />
                Empezar primer workout
              </Button>
            </EmptyState>
          ) : (
            <div className="relative pl-6">
              {/* Línea del timeline */}
              <div className="absolute inset-y-2 left-[5px] w-0.5 rounded-full bg-surface-2" />
              <div className="space-y-2.5">
                {summaries.map((s, i) => (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...springUI, delay: Math.min(i, 10) * 0.04 }}
                    className="relative"
                  >
                    {/* Nodo del color del tier */}
                    <span
                      className="absolute top-1/2 -left-6 size-3 -translate-y-1/2 rounded-full border-2 border-surface-0"
                      style={{
                        background: TIER_VARS[s.tier],
                        boxShadow:
                          i === 0
                            ? `0 0 8px ${tierAlpha(s.tier, 60)}`
                            : undefined,
                      }}
                    />
                    <WorkoutRow summary={s} isFirst={i === 0} />
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.section>

        {/* MEJORES LEVANTAMIENTOS */}
        {bestLifts.length > 0 && (
          <motion.aside
            variants={enterItem}
            className="min-w-0 card p-5 lg:sticky lg:top-24 lg:col-span-4"
          >
            <SectionHeader eyebrow="Big three" title="Mejores marcas" />
            <ul className="space-y-3">
              {bestLifts.map((l) => (
                <li key={l.name} className="flex items-center gap-3">
                  <TierEmblem tier={l.tier} size="xs" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">
                      {l.name}
                    </div>
                    <div
                      className="text-xs"
                      style={{ color: TIER_VARS[l.tier] }}
                    >
                      {l.tier}
                    </div>
                  </div>
                  <div
                    className="font-display text-lg font-bold tabular-nums"
                    style={{ color: TIER_VARS[l.tier] }}
                  >
                    {l.rm.toFixed(1)}
                    <span className="ml-0.5 text-xs font-normal text-fg-muted">
                      kg
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </motion.aside>
        )}
      </div>
    </motion.div>
  );
}

function WorkoutRow({
  summary: s,
  isFirst,
}: {
  summary: WorkoutSummary;
  isFirst: boolean;
}) {
  const hours = Math.floor(s.duration / 3600);
  const minutes = Math.floor((s.duration % 3600) / 60);
  const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  return (
    <div className={isFirst ? "card-accent p-4" : "card p-4"}>
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-display text-sm font-semibold">
              {s.date.toLocaleDateString("es-ES", {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}
            </span>
            <span className="text-xs text-fg-dim">
              {s.date.toLocaleTimeString("es-ES", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            {isFirst && (
              <span className="eyebrow rounded-full bg-(--tier-soft) px-2 py-0.5 text-(--tier)">
                Último
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs text-fg-muted">
            <span className="flex items-center gap-1">
              <Dumbbell size={11} />
              {s.exerciseCount} ej
            </span>
            <span className="flex items-center gap-1">
              <ListChecks size={11} />
              {s.totalSets} series
            </span>
            <span className="flex items-center gap-1">
              <Activity size={11} />
              {s.totalVolume.toLocaleString("es-ES")} kg
            </span>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div
            className="font-display text-base font-bold tabular-nums"
            style={{ color: TIER_VARS[s.tier] }}
          >
            {timeStr}
          </div>
          <div
            className="eyebrow !text-[11px]"
            style={{ color: TIER_VARS[s.tier] }}
          >
            {s.tier}
          </div>
        </div>
      </div>
    </div>
  );
}
