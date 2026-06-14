import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { motion } from "motion/react";
import {
  X,
  Check,
  History as HistoryIcon,
  Lightbulb,
  Plus,
  Search,
  Sparkles,
  Dumbbell,
  ListChecks,
} from "lucide-react";
import { useWorkoutStore } from "../store/workoutStore";
import { useProfileStore } from "../store/profileStore";
import { useStandardsStore } from "../store/standardsStore";
import { SetRow } from "../components/SetRow";
import { AddSetSheet } from "../components/AddSetSheet";
import { BottomSheet } from "../components/ui/BottomSheet";
import { EmptyState } from "../components/ui/EmptyState";
import { Button } from "../components/ui/button";
import { springUI } from "../lib/motionTokens";
import { type Exercise, type Tier } from "../models/types";
import { estimatedMax } from "../utils/estimators";
import { tierFromScore, rankedScore, type Gender } from "../services/rankingService";
import { db } from "../db/database";
import { bestSetPerExercise } from "../db/queries";

const RestTimer = lazy(() =>
  import("../components/RestTimer").then((m) => ({ default: m.RestTimer })),
);
const PRBadge = lazy(() =>
  import("../components/PRBadge").then((m) => ({ default: m.PRBadge })),
);

export function ActiveWorkout({ onComplete }: { onComplete: () => void }) {
  const s = useWorkoutStore();
  const p = useProfileStore();
  const std = useStandardsStore();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [addedTime, setAddedTime] = useState(0);
  const [history, setHistory] = useState<Record<number, string>>({});
  const [suggestions, setSuggestions] = useState<Record<number, string>>({});
  const [elapsed, setElapsed] = useState(0);
  const [, setTier] = useState<Tier>("Bronce");
  const startRef = useRef<number>(Date.now());

  useEffect(() => {
    if (s.activeWorkout) {
      startRef.current = +new Date(s.activeWorkout.date);
    }
  }, [s.activeWorkout?.id]);

  useEffect(() => {
    const tick = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const next: Record<number, string> = {};
      const nextSug: Record<number, string> = {};
      for (const e of s.activeExercises) {
        const h = await s.lastHistory(e.exercise.id!);
        const sug = await s.suggestion(e.exercise.id!);
        if (cancelled) return;
        next[e.exercise.id!] = h;
        if (sug) nextSug[e.exercise.id!] = sug;
      }
      if (!cancelled) {
        setHistory(next);
        setSuggestions(nextSug);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [s.activeExercises.length]);

  useEffect(() => {
    (async () => {
      if (!p.profile) return;
      const bests = await bestSetPerExercise();
      if (!std.standards) return;
      const gender: Gender = p.profile.gender === 'female' ? 'mujer' : 'hombre';
      const exercises = bests
        .map((b) => ({
          rm: estimatedMax(b.set.weight, b.set.reps, b.set.rir),
          name: b.exerciseName,
        }))
        .filter((e) => e.rm > 0);
      const score = rankedScore(
        exercises,
        p.profile.bodyweight,
        gender,
        p.profile.age,
        std.standards,
      );
      setTier(tierFromScore(score));
    })();
  }, [p.profile, s.activeExercises]);

  const total = s.activeExercises.reduce((n, e) => n + e.sets.length, 0);
  const done = s.activeExercises.reduce(
    (n, e) => n + e.sets.filter((x) => x.completed).length,
    0,
  );
  const progressPct = total ? (done / total) * 100 : 0;

  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;
  const timeStr = hours
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : `${minutes}:${String(seconds).padStart(2, "0")}`;

  const current = s.activeExercises[s.activeExercises.length - 1];
  const restSeconds = p.profile?.restTimerDefault ?? 90;

  return (
    <div className="flex min-h-screen flex-col bg-surface-0">
      {/* Header con barra de progreso integrada en el borde superior */}
      <header className="sticky top-0 z-20 border-b border-border-subtle bg-[color-mix(in_oklab,var(--color-surface-0)_88%,transparent)] backdrop-blur">
        <div className="h-[3px] w-full bg-surface-2">
          <motion.div
            className="h-full bg-(image:--tier-gradient) shadow-[0_0_8px_var(--tier-glow)]"
            initial={false}
            animate={{ width: `${progressPct}%` }}
            transition={springUI}
          />
        </div>
        <div className="flex h-14 items-center justify-between px-4">
          <button
            onClick={onComplete}
            className="tap-target flex items-center gap-1 text-sm text-fg-muted transition-colors hover:text-fg"
          >
            <X size={16} />
            Salir
          </button>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center">
              <span className="eyebrow !text-[11px]">Tiempo</span>
              <span className="font-mono text-base font-bold tabular-nums">
                {timeStr}
              </span>
            </div>
            <span className="rounded-full bg-(--tier-soft) px-2.5 py-1 font-mono text-xs font-semibold tabular-nums text-(--tier)">
              {done}/{total}
            </span>
          </div>
          <button
            onClick={() => s.completeWorkout()}
            disabled={done === 0}
            className="tap-target flex items-center gap-1 text-sm font-bold text-(--tier) transition-opacity disabled:opacity-30"
          >
            <Check size={16} />
            Finalizar
          </button>
        </div>
      </header>

      {/* Lista de ejercicios */}
      <div className="flex-1 space-y-3 overflow-auto px-3 py-4 pb-36 md:px-4 md:pb-40">
        <div className="mx-auto max-w-3xl space-y-3">
          {s.activeExercises.length === 0 ? (
            <EmptyState
              icon={ListChecks}
              title="Sin ejercicios todavía"
              body="Añade el primero para empezar a registrar series."
            >
              <Button onClick={() => setPickerOpen(true)}>
                <Plus size={14} />
                Añadir ejercicio
              </Button>
            </EmptyState>
          ) : (
            s.activeExercises.map((e, i) => {
              const last = i === s.activeExercises.length - 1;
              return (
                <motion.div
                  key={e.we.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...springUI, delay: i * 0.04 }}
                  className={
                    last
                      ? "card-accent p-4 shadow-(--shadow-glow-tier)"
                      : "card p-4"
                  }
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="eyebrow !text-[11px]">#{i + 1}</span>
                      <span className="font-display text-base font-bold">
                        {e.exercise.name}
                      </span>
                    </div>
                    {last && (
                      <span className="eyebrow flex items-center gap-1 rounded-full bg-(--tier-soft) px-2 py-1 text-(--tier)">
                        <Sparkles size={10} />
                        Actual
                      </span>
                    )}
                  </div>

                  <div className="mb-3 flex flex-wrap items-center gap-1.5">
                    {history[e.exercise.id!] && (
                      <span className="flex items-center gap-1 rounded-md bg-surface-3 px-2 py-0.5 text-xs text-fg-muted">
                        <HistoryIcon size={11} />
                        {history[e.exercise.id!]}
                      </span>
                    )}
                    {suggestions[e.exercise.id!] && (
                      <span className="flex items-center gap-1 rounded-md bg-[color-mix(in_oklab,var(--color-tier-esmeralda)_12%,transparent)] px-2 py-0.5 text-xs text-tier-esmeralda">
                        <Lightbulb size={11} />
                        {suggestions[e.exercise.id!]}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    {e.sets.length === 0 ? (
                      <div className="py-3 text-center text-xs text-fg-dim">
                        Sin series todavía
                      </div>
                    ) : (
                      e.sets.map((set, setIdx) => {
                        // PR detection: si el e1RM de este set es el mayor histórico del ejercicio,
                        // calculamos el delta sobre el segundo mejor.
                        const allE1rm = e.sets.map((s) =>
                          estimatedMax(s.weight, s.reps, s.rir),
                        );
                        const currentE1rm = allE1rm[setIdx];
                        const otherMax = Math.max(
                          ...allE1rm.filter((_, i) => i !== setIdx),
                          0,
                        );
                        const isPR = currentE1rm > otherMax && otherMax > 0;
                        const prDelta = isPR ? currentE1rm - otherMax : 0;
                        return (
                          <SetRow
                            key={set.id}
                            set={set}
                            index={setIdx}
                            onToggle={() => s.toggleSet(set.id!)}
                            onRemove={() => s.removeSet(set.id!)}
                            isPR={isPR}
                            prDelta={prDelta}
                          />
                        );
                      })
                    )}
                  </div>
                </motion.div>
              );
            })
          )}

          {s.activeExercises.length > 0 && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setPickerOpen(true)}
            >
              <Plus size={14} />
              Añadir otro ejercicio
            </Button>
          )}
        </div>
      </div>

      {/* CTA sticky: abre el sheet en ambos breakpoints */}
      {current && (
        <div className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-border-subtle bg-[color-mix(in_oklab,var(--color-surface-0)_88%,transparent)] px-4 py-3 backdrop-blur">
          <div className="mx-auto max-w-3xl">
            <Button
              onClick={() => setSheetOpen(true)}
              variant="cta"
              className="w-full"
            >
              <Plus size={18} strokeWidth={2.5} />
              Añadir serie · {current.exercise.name}
            </Button>
          </div>
        </div>
      )}

      {current && (
        <AddSetSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          history={history[current.exercise.id!]}
          suggestion={suggestions[current.exercise.id!] ?? null}
          prefill={(() => {
            const sets = current.sets;
            if (!sets.length) return null;
            const last = sets[sets.length - 1];
            return { weight: last.weight, reps: last.reps, rir: last.rir };
          })()}
          defaultRest={restSeconds}
          barWeight={20}
          availablePlates={
            p.profile?.availablePlates ?? [25, 20, 15, 10, 5, 2.5, 1.25]
          }
          onAdd={(w, r, rir) => s.addSet(w, r, rir)}
        />
      )}

      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={async (id) => {
          await s.addExercise(id);
          setPickerOpen(false);
        }}
      />

      {/* Timer de descanso — pill flotante en bottom (no modal) */}
      {s.isResting && s.restStartTimestamp && s.restDuration > 0 && (
        <Suspense fallback={null}>
          <RestTimer
            key={s.restStartTimestamp}
            startTime={s.restStartTimestamp}
            duration={s.restDuration + addedTime}
            onComplete={() => {
              s.stopRestTimer();
              setAddedTime(0);
            }}
            onSkip={() => {
              s.stopRestTimer();
              setAddedTime(0);
            }}
            onAddTime={(sec) => setAddedTime((t) => t + sec)}
          />
        </Suspense>
      )}

      {s.showPR && (
        <Suspense fallback={null}>
          <PRBadge pr={s.showPR} onDismiss={() => s.dismissPR()} />
        </Suspense>
      )}
    </div>
  );
}

/** Selector de ejercicio para el workout activo */
function ExercisePicker({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (exerciseId: number) => void;
}) {
  const [all, setAll] = useState<Exercise[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    db.exercises.toArray().then(setAll);
  }, [open]);

  const filtered = all.filter(
    (e) => !query || e.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <BottomSheet open={open} onClose={onClose} title="Añadir ejercicio">
      <div className="space-y-3">
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-fg-dim"
          />
          <input
            type="search"
            placeholder="Buscar..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-border-subtle bg-surface-2 py-3 pr-4 pl-10 text-base text-fg outline-none placeholder:text-fg-dim focus:border-(--tier-border)"
          />
        </div>
        <ul className="max-h-[50vh] space-y-1 overflow-y-auto">
          {filtered.map((e) => (
            <li key={e.id}>
              <button
                onClick={() => onPick(e.id!)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-surface-2"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-(--tier-soft) text-(--tier)">
                  <Dumbbell size={14} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">
                    {e.name}
                  </span>
                  <span className="block text-xs text-fg-muted">
                    {e.musclePrimary} · {e.equipment}
                  </span>
                </span>
                <Plus size={14} className="shrink-0 text-fg-dim" />
              </button>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="py-6 text-center text-sm text-fg-dim">
              Sin resultados
            </li>
          )}
        </ul>
      </div>
    </BottomSheet>
  );
}
