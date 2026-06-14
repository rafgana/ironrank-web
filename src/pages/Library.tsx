"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  Search,
  X,
  Dumbbell,
  Target,
  Activity,
  ChevronRight,
  Trophy,
  Calendar,
  type LucideIcon,
} from "lucide-react";
import { useProfileStore } from "../store/profileStore";
import { useStandardsStore } from "../store/standardsStore";
import { db } from "../db/database";
import { bestSetForExercise } from "../db/queries";
import { estimatedMax } from "../utils/estimators";
import { tierFor, type Gender } from "../services/rankingService";
import type { Exercise, Tier } from "../models/types";
import { TIER_VARS } from "../models/types";
import { TierEmblem } from "../components/ironrank/TierEmblem";
import { AnimatedTabs } from "../components/ui/AnimatedTabs";
import { BottomSheet } from "../components/ui/BottomSheet";
import { Button } from "../components/ui/button";
import { NumberTicker } from "../components/magicui/number-ticker";
import { enterItem, enterStagger } from "../lib/motionTokens";
import { RoutinesManager } from "../components/routines/RoutinesManager";

interface EnrichedExercise extends Exercise {
  tier?: Tier;
  rm?: number;
}

const MUSCLE_COLORS: Record<string, string> = {
  Pecho: "#FF7A1A",
  Espalda: "#10B981",
  Hombros: "#FF2E63",
  Biceps: "#9C40FF",
  Triceps: "#FFD700",
  Piernas: "#00E5FF",
  Gluteos: "#FFB36B",
  Abdominales: "#6EC5FF",
  Peso: "#C0C0C0",
  Pantorrillas: "#34D399",
  Antebrazo: "#84CC16",
};

export function Library() {
  const p = useProfileStore();
  const std = useStandardsStore();
  const [tab, setTab] = useState<"exercises" | "routines">("routines");
  const [exs, setExs] = useState<EnrichedExercise[]>([]);
  const [search, setSearch] = useState("");
  const [muscle, setMuscle] = useState<string>("all");
  const [selected, setSelected] = useState<EnrichedExercise | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    let all = await db.exercises.toArray();
    if (p.profile && std.standards) {
      const gender: Gender = p.profile.gender === 'female' ? 'mujer' : 'hombre';
      const age = p.profile.age;
      const standards = std.standards;
      all = await Promise.all(
        all.map(async (e) => {
          const best = await bestSetForExercise(e.id!);
          if (!best) return e;
          const rm = estimatedMax(best.weight, best.reps, best.rir);
          const tier = tierFor(rm, p.profile!.bodyweight, gender, age, e.name, standards);
          return { ...e, tier, rm };
        }),
      );
    }
    setExs(all);
    setLoading(false);
  };

  useEffect(() => {
    if (p.profile) void load();
  }, [p.profile]);

  if (tab === "routines") {
    return (
      <motion.div
        variants={enterStagger}
        initial="hidden"
        animate="show"
        className="space-y-5"
      >
        <motion.header variants={enterItem} className="flex items-end justify-between gap-3">
          <div>
            <div className="eyebrow mb-1">Planificación</div>
            <h1 className="font-display text-h1 font-bold">Mis workouts</h1>
            <p className="mt-1 text-sm text-fg-muted">
              Diseña tu semana. Asigna ejercicios a días. Lleva el conteo.
            </p>
          </div>
          <AnimatedTabs
            layoutId="library-tab"
            tabs={[
              { value: "routines", label: "Workouts" },
              { value: "exercises", label: "Ejercicios" },
            ]}
            value={tab === "routines" ? "routines" : "exercises"}
            onChange={(v) => setTab(v as "exercises" | "routines")}
          />
        </motion.header>
        <motion.div variants={enterItem}>
          {/* TODO: re-enable RoutinesManager after fixing TDZ issues */}
          <div className="rounded-lg border border-dashed border-border-subtle p-8 text-center text-fg-muted">
            <div className="eyebrow mb-1">Rutinas</div>
            <p className="text-sm">Próximamente. Estamos simplificando la app.</p>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  const muscles = Array.from(new Set(exs.map((e) => e.musclePrimary))).sort();
  const filtered = exs.filter(
    (e) =>
      (muscle === "all" || e.musclePrimary === muscle) &&
      (!search || e.name.toLowerCase().includes(search.toLowerCase())),
  );

  const counts: Record<string, number> = {};
  for (const e of exs) {
    counts[e.musclePrimary] = (counts[e.musclePrimary] ?? 0) + 1;
  }

  return (
    <motion.div
      variants={enterStagger}
      initial="hidden"
      animate="show"
      className="space-y-5"
    >
      <motion.header variants={enterItem} className="flex items-end justify-between gap-3">
        <div>
          <div className="eyebrow mb-1">Ejercicios</div>
          <h1 className="font-display text-h1 font-bold">Biblioteca</h1>
          <p className="mt-1 text-sm text-fg-muted">
            {exs.length} ejercicios · {muscles.length} grupos musculares
          </p>
        </div>
        <AnimatedTabs
          layoutId="library-tab"
          tabs={[
            { value: "routines", label: "Workouts" },
            { value: "exercises", label: "Ejercicios" },
          ]}
          value={tab}
          onChange={(v) => setTab(v as "exercises" | "routines")}
        />
      </motion.header>

      <motion.div variants={enterItem} className="relative">
        <Search
          size={16}
          className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-fg-dim"
        />
        <input
          type="search"
          placeholder="Buscar ejercicios..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="card w-full !rounded-xl py-3 pr-10 pl-10 text-base text-fg outline-none transition-colors placeholder:text-fg-dim focus:border-(--tier-border)"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="tap-target absolute top-1/2 right-0 flex -translate-y-1/2 items-center justify-center text-fg-muted"
            aria-label="Limpiar búsqueda"
          >
            <X size={16} />
          </button>
        )}
      </motion.div>

      <motion.div variants={enterItem}>
        <AnimatedTabs
          layoutId="library-filter"
          scrollable
          tabs={[
            { value: "all", label: `Todos (${exs.length})` },
            ...muscles.map((m) => ({
              value: m,
              label: `${m} (${counts[m]})`,
              icon: (
                <span
                  className="size-2 rounded-full"
                  style={{ background: MUSCLE_COLORS[m] ?? "var(--tier)" }}
                />
              ),
            })),
          ]}
          value={muscle}
          onChange={setMuscle}
        />
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton h-16" />
          ))}
        </div>
      ) : (
        <motion.div
          variants={enterItem}
          className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3"
        >
          {filtered.map((e) => (
            <ExerciseRow
              key={e.id}
              exercise={e}
              onClick={() => setSelected(e)}
              muscleColor={MUSCLE_COLORS[e.musclePrimary]}
            />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-12 text-center text-sm text-fg-dim">
              Sin resultados para "{search}"
            </div>
          )}
        </motion.div>
      )}

      <ExerciseDetailSheet
        exercise={selected}
        onClose={() => setSelected(null)}
      />
    </motion.div>
  );
}

function ExerciseRow({
  exercise: e,
  onClick,
  muscleColor,
}: {
  exercise: EnrichedExercise;
  onClick: () => void;
  muscleColor?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="card group p-3 text-left transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-(--shadow-card-hover) active:scale-[0.99]"
    >
      <div className="flex items-center gap-3">
        <div
          className="flex size-9 shrink-0 items-center justify-center rounded-lg"
          style={{
            background: muscleColor
              ? `color-mix(in oklab, ${muscleColor} 12%, transparent)`
              : "var(--color-surface-2)",
            color: muscleColor ?? "var(--color-fg-muted)",
          }}
        >
          <Dumbbell size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display truncate text-sm font-semibold">
            {e.name}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-fg-muted">
            <span>{e.musclePrimary}</span>
            <span className="text-fg-dim">·</span>
            <span>{e.equipment}</span>
          </div>
        </div>
        {e.tier ? (
          <TierEmblem tier={e.tier} size="xs" />
        ) : (
          <ChevronRight
            size={14}
            className="text-fg-dim transition-colors group-hover:text-fg-muted"
          />
        )}
      </div>
    </button>
  );
}

function ExerciseDetailSheet({
  exercise,
  onClose,
}: {
  exercise: EnrichedExercise | null;
  onClose: () => void;
}) {
  const hasData = !!exercise?.rm;
  const [history, setHistory] = useState<{ date: Date; weight: number; reps: number; e1rm: number }[]>([]);

  useEffect(() => {
    if (!exercise) return;
    (async () => {
      const exs = await db.workoutExercises.where("exerciseId").equals(exercise.id!).toArray();
      const sets = await db.sets
        .where("workoutExerciseId")
        .above(0)
        .filter((s) => s.completed)
        .toArray();
      const exIds = new Set(exs.map((e) => e.id!));
      const workouts = await db.workouts.toArray();
      const wById = new Map(workouts.map((w) => [w.id!, w]));
      const hist: { date: Date; weight: number; reps: number; e1rm: number }[] = [];
      for (const s of sets) {
        if (!exIds.has(s.workoutExerciseId)) continue;
        const we = exs.find((e) => e.id === s.workoutExerciseId);
        if (!we) continue;
        const w = wById.get(we.workoutId);
        if (!w) continue;
        hist.push({
          date: new Date(w.date),
          weight: s.weight,
          reps: s.reps,
          e1rm: estimatedMax(s.weight, s.reps, s.rir),
        });
      }
      hist.sort((a, b) => b.e1rm - a.e1rm);
      setHistory(hist.slice(0, 5));
    })();
  }, [exercise?.id]);

  // RIR recomendado: RPE-based
  // Para hipertrofia: RIR 1-3 (RPE 7-9), para fuerza: RIR 0-2 (RPE 8-10)
  // Aquí sugerimos 2 (sweet spot)
  const recommendedRIR = "1-3";
  const recommendedRIRReason = "Para hipertrofia general, busca RIR 1-3 (te quedan 1-3 reps en reserva). Si quieres fuerza máxima, baja a RIR 0-1.";

  return (
    <BottomSheet
      open={!!exercise}
      onClose={onClose}
      title={exercise?.name ?? ""}
    >
      {exercise && (
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="eyebrow">
              {exercise.musclePrimary} · {exercise.equipment}
            </div>
            {hasData && <TierEmblem tier={exercise.tier!} size="md" />}
          </div>

          {hasData && (
            <div className="grid grid-cols-2 gap-3">
              <DetailStat
                icon={Trophy}
                label="1RM estimado"
                value={exercise.rm!}
                unit="kg"
                accent={TIER_VARS[exercise.tier!]}
              />
              <DetailStat
                icon={Target}
                label="Rango"
                value={exercise.tier!}
                accent={TIER_VARS[exercise.tier!]}
                isString
              />
            </div>
          )}

          {/* RIR recomendado */}
          <div
            className="rounded-lg p-3"
            style={{
              background: "color-mix(in oklab, var(--color-tier-oro) 10%, transparent)",
              border: "1px solid color-mix(in oklab, var(--color-tier-oro) 30%, transparent)",
            }}
          >
            <div className="flex items-center gap-2">
              <span className="eyebrow" style={{ color: "var(--color-tier-oro)" }}>
                RIR recomendado
              </span>
              <span className="font-display text-lg font-bold tabular-nums" style={{ color: "var(--color-tier-oro)" }}>
                {recommendedRIR}
              </span>
            </div>
            <p className="mt-1.5 text-xs text-fg-muted leading-relaxed">
              {recommendedRIRReason}
            </p>
          </div>

          {/* PR history */}
          {history.length > 0 && (
            <div>
              <div className="eyebrow mb-1.5">Top 5 mejores marcas (e1RM)</div>
              <ul className="space-y-1">
                {history.map((h, i) => {
                  const isPR = i === 0;
                  return (
                    <li
                      key={i}
                      className="flex items-center gap-2 rounded-md bg-surface-2/40 px-2.5 py-1.5 text-xs"
                    >
                      <span className="font-mono w-5 text-fg-dim tabular-nums text-right">
                        #{i + 1}
                      </span>
                      <span className="font-mono font-semibold tabular-nums">
                        {h.weight.toFixed(1)}kg × {h.reps}
                      </span>
                      <span
                        className="ml-auto font-mono tabular-nums"
                        style={{ color: isPR ? "var(--tier)" : "var(--color-fg-muted)" }}
                      >
                        {h.e1rm.toFixed(1)}kg e1RM
                      </span>
                      <span className="text-fg-dim text-[10px] font-mono tabular-nums w-12 text-right">
                        {timeAgo(h.date)}
                      </span>
                      {isPR && (
                        <Trophy size={11} style={{ color: "var(--tier)" }} />
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {exercise.muscleSecondary && (
            <div className="text-sm">
              <span className="text-fg-muted">Músculos secundarios: </span>
              <span className="text-fg">{exercise.muscleSecondary}</span>
            </div>
          )}

          <div>
            <div className="eyebrow mb-1.5">Instrucciones</div>
            <p className="text-sm leading-relaxed text-fg">
              {exercise.instructions}
            </p>
          </div>

          {exercise.alternatives.length > 0 && (
            <div>
              <div className="eyebrow mb-1.5">Alternativas</div>
              <div className="flex flex-wrap gap-1.5">
                {exercise.alternatives.map((alt) => (
                  <span
                    key={alt}
                    className="flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 text-xs text-fg-muted"
                  >
                    <Activity size={11} />
                    {alt}
                  </span>
                ))}
              </div>
            </div>
          )}

          <Button variant="cta" className="w-full" onClick={onClose}>
            <Calendar size={16} strokeWidth={2.5} />
            Usar en próximo workout
          </Button>
        </div>
      )}
    </BottomSheet>
  );
}

function timeAgo(date: Date): string {
  const ms = +new Date() - +date;
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days === 0) return "hoy";
  if (days === 1) return "ayer";
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.floor(days / 7)}sem`;
  if (days < 365) return `${Math.floor(days / 30)}mes`;
  return `${Math.floor(days / 365)}a`;
}

function DetailStat({
  icon: Icon,
  label,
  value,
  unit,
  accent,
  isString,
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
  unit?: string;
  accent: string;
  isString?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border-subtle bg-surface-2 p-3">
      <div className="mb-1.5 flex items-center gap-1.5">
        <Icon size={12} style={{ color: accent }} />
        <span className="eyebrow !text-[11px]">{label}</span>
      </div>
      {isString ? (
        <div
          className="font-display text-xl font-bold"
          style={{ color: accent }}
        >
          {value}
        </div>
      ) : (
        <div
          className="font-display text-xl font-bold tabular-nums"
          style={{ color: accent }}
        >
          <NumberTicker value={value as number} duration={1.2} />
          {unit && (
            <span className="ml-1 text-xs font-normal text-fg-muted">
              {unit}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
