"use client";

/**
 * RoutinesManager — Diseña workouts semanales.
 *
 * Lista de workouts + crear/editar/borrar. Cada workout tiene:
 *   - nombre
 *   - ejercicios con target sets/reps/peso/descanso
 *   - días de la semana asignados (Lun/Mar/...)
 *
 * UX:
 *   - Click "+ Nuevo workout" → modal con nombre + checkboxes de días
 *   - Click en un workout → expande con sus ejercicios + botón "+ Añadir ejercicio"
 *   - Click en un día → toggle on/off
 */

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  Trash2,
  Calendar,
  Dumbbell,
  Target,
  X,
  ChevronDown,
  Search,
  Trophy,
  Check,
  Flame,
} from "lucide-react";
import { useRoutineStore } from "../../store/routineStore";
import { db } from "../../db/database";
import type { Routine, RoutineExercise, WeekDay, Exercise } from "../../models/types";
import { WEEK_DAY_LABELS, WEEK_DAY_NAMES } from "../../models/types";
import { Button } from "../ui/button";
import { BottomSheet } from "../ui/BottomSheet";
import { AnimatedTabs } from "../ui/AnimatedTabs";
import { enterItem, enterStagger, springUI } from "../../lib/motionTokens";

export function RoutinesManager() {
  const rs = useRoutineStore();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingExercises, setEditingExercises] = useState<number | null>(null);
  const [showAddEx, setShowAddEx] = useState<number | null>(null);

  useEffect(() => {
    rs.load();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="eyebrow">{rs.routines.length} workouts programados</div>
        <Button variant="tier" onClick={() => setShowCreate(true)}>
          <Plus size={14} strokeWidth={2.5} />
          Nuevo workout
        </Button>
      </div>

      {rs.routines.length === 0 ? (
        <EmptyRoutines onCreate={() => setShowCreate(true)} />
      ) : (
        <motion.div
          variants={enterStagger}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          <AnimatePresence>
            {rs.routines.map((r) => (
              <RoutineCard
                key={r.id}
                routine={r}
                expanded={expandedId === r.id}
                onToggle={() => setExpandedId(expandedId === r.id ? null : r.id!)}
                onDelete={() => rs.remove(r.id!)}
                onAddExercise={() => setShowAddEx(r.id!)}
                onDeleteRoutine={() => rs.remove(r.id!)}
                onUpdateDays={(days) => rs.update(r.id!, { days })}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <CreateRoutineSheet open={showCreate} onClose={() => setShowCreate(false)} />
      <AddExerciseSheet
        routineId={showAddEx}
        onClose={() => setShowAddEx(null)}
      />
    </div>
  );
}

function EmptyRoutines({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="card p-8 text-center">
      <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-tier-esmeralda/10 text-tier-esmeralda">
        <Calendar size={28} />
      </div>
      <h3 className="font-display text-xl font-bold mb-1">Empieza tu rutina</h3>
      <p className="text-sm text-fg-muted mb-5 max-w-xs mx-auto">
        Crea workouts propios con tus ejercicios favoritos. Asígnalos a días de la semana. Lleva el conteo de cuántos entrenas.
      </p>
      <Button variant="tier" onClick={onCreate} className="mx-auto">
        <Plus size={14} strokeWidth={2.5} />
        Crear primer workout
      </Button>
    </div>
  );
}

function RoutineCard({
  routine,
  expanded,
  onToggle,
  onDelete,
  onAddExercise,
  onUpdateDays,
}: {
  routine: Routine;
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onAddExercise: () => void;
  onDeleteRoutine: () => void;
  onUpdateDays: (days: WeekDay[]) => void;
}) {
  const rs = useRoutineStore();
  const [exercises, setExercises] = useState<(RoutineExercise & { exercise?: Exercise })[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const loadExercises = async () => {
    const exs = await rs.getExercises(routine.id!);
    const enriched = await Promise.all(
      exs.sort((a, b) => a.order - b.order).map(async (re) => ({
        ...re,
        exercise: await db.exercises.get(re.exerciseId),
      })),
    );
    setExercises(enriched);
  };

  useEffect(() => {
    if (expanded) void loadExercises();
  }, [expanded, routine.id]);

  const toggleDay = (day: WeekDay) => {
    const next = routine.days.includes(day)
      ? routine.days.filter((d) => d !== day)
      : [...routine.days, day].sort();
    onUpdateDays(next);
  };

  return (
    <motion.div
      layout
      variants={enterItem}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="card overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-surface-2/50"
      >
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-lg"
          style={{
            background: "color-mix(in oklab, var(--color-tier-esmeralda) 12%, transparent)",
            color: "var(--color-tier-esmeralda)",
          }}
        >
          <Dumbbell size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display text-base font-bold truncate">{routine.name}</div>
          <div className="mt-1 flex flex-wrap items-center gap-1">
            {routine.days.length === 0 ? (
              <span className="eyebrow !text-[10px] text-fg-dim">Sin días asignados</span>
            ) : (
              routine.days.map((d) => (
                <span
                  key={d}
                  className="rounded px-1.5 py-0.5 text-[10px] font-mono font-semibold"
                  style={{
                    background: "color-mix(in oklab, var(--color-tier-esmeralda) 20%, transparent)",
                    color: "var(--color-tier-esmeralda)",
                  }}
                >
                  {WEEK_DAY_LABELS[d]}
                </span>
              ))
            )}
          </div>
        </div>
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} className="text-fg-muted" />
        </motion.div>
      </button>

      {/* Expanded */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={springUI}
            className="overflow-hidden border-t border-border-subtle"
          >
            <div className="space-y-4 p-4">
              {/* Day selector */}
              <div>
                <div className="eyebrow mb-2">Días de la semana</div>
                <div className="flex flex-wrap gap-1.5">
                  {([1, 2, 3, 4, 5, 6, 0] as WeekDay[]).map((d) => {
                    const active = routine.days.includes(d);
                    return (
                      <button
                        key={d}
                        onClick={() => toggleDay(d)}
                        className={`min-w-12 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                          active ? "text-tier-esmeralda" : "text-fg-muted hover:bg-surface-2"
                        }`}
                        style={
                          active
                            ? {
                                background: "color-mix(in oklab, var(--color-tier-esmeralda) 18%, transparent)",
                                border: "1px solid color-mix(in oklab, var(--color-tier-esmeralda) 40%, transparent)",
                              }
                            : {
                                background: "var(--color-surface-2)",
                                border: "1px solid var(--color-border-subtle)",
                              }
                        }
                      >
                        {WEEK_DAY_LABELS[d]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Exercises list */}
              <div>
                <div className="eyebrow mb-2 flex items-center justify-between">
                  <span>{exercises.length} ejercicios</span>
                  <Button variant="ghost" size="sm" onClick={onAddExercise}>
                    <Plus size={12} />
                    Añadir
                  </Button>
                </div>
                {exercises.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border-subtle p-4 text-center text-xs text-fg-dim">
                    Sin ejercicios. Añade el primero.
                  </div>
                ) : (
                  <ul className="space-y-1">
                    {exercises.map((e, i) => (
                      <li
                        key={e.id}
                        className="flex items-center gap-2 rounded-md bg-surface-2/40 px-3 py-2 text-sm"
                      >
                        <span className="font-mono text-xs text-fg-dim w-5 text-right">{i + 1}</span>
                        <span className="font-display flex-1 truncate text-sm font-semibold">
                          {e.exercise?.name ?? "?"}
                        </span>
                        {e.targetSets && (
                          <span className="rounded bg-surface-3 px-1.5 py-0.5 text-[10px] font-mono">
                            {e.targetSets}×{e.targetReps ?? "?"}
                          </span>
                        )}
                        {e.targetWeight && (
                          <span className="rounded bg-surface-3 px-1.5 py-0.5 text-[10px] font-mono text-tier-oro">
                            {e.targetWeight}kg
                          </span>
                        )}
                        <button
                          onClick={() => rs.removeExercise(e.id!)}
                          className="tap-target text-fg-muted hover:text-red-400"
                          aria-label={`Borrar ${e.exercise?.name}`}
                        >
                          <Trash2 size={12} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Delete */}
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="text-xs text-fg-dim hover:text-red-400"
                >
                  Eliminar workout
                </button>
              ) : (
                <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/5 p-2">
                  <span className="text-xs text-fg-muted flex-1">¿Seguro?</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmDelete(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={onDelete}
                    className="bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 h-8"
                  >
                    <Trash2 size={12} />
                    Sí, borrar
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function CreateRoutineSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const rs = useRoutineStore();
  const [name, setName] = useState("");
  const [days, setDays] = useState<WeekDay[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName("");
      setDays([]);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const toggleDay = (d: WeekDay) => {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()));
  };

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    await rs.create(trimmed, days);
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Nuevo workout">
      <div className="space-y-4">
        <div>
          <div className="eyebrow mb-1.5">Nombre</div>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder="Ej: Push day, Pierna, Full body..."
            className="w-full rounded-xl border border-border-subtle bg-surface-2 px-4 py-3 text-base text-fg outline-none placeholder:text-fg-dim focus:border-(--tier-border)"
          />
        </div>

        <div>
          <div className="eyebrow mb-1.5">Días de la semana (opcional)</div>
          <div className="flex flex-wrap gap-1.5">
            {([1, 2, 3, 4, 5, 6, 0] as WeekDay[]).map((d) => {
              const active = days.includes(d);
              return (
                <button
                  key={d}
                  onClick={() => toggleDay(d)}
                  className={`min-w-12 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                    active ? "text-tier-esmeralda" : "text-fg-muted hover:bg-surface-2"
                  }`}
                  style={
                    active
                      ? {
                          background: "color-mix(in oklab, var(--color-tier-esmeralda) 18%, transparent)",
                          border: "1px solid color-mix(in oklab, var(--color-tier-esmeralda) 40%, transparent)",
                        }
                      : {
                          background: "var(--color-surface-2)",
                          border: "1px solid var(--color-border-subtle)",
                        }
                  }
                >
                  {WEEK_DAY_LABELS[d]}
                </button>
              );
            })}
          </div>
        </div>

        <Button
          variant="cta"
          onClick={handleCreate}
          disabled={!name.trim()}
          className="w-full"
        >
          <Plus size={16} strokeWidth={2.5} />
          Crear workout
        </Button>
      </div>
    </BottomSheet>
  );
}

function AddExerciseSheet({
  routineId,
  onClose,
}: {
  routineId: number | null;
  onClose: () => void;
}) {
  const rs = useRoutineStore();
  const [exs, setExs] = useState<Exercise[]>([]);
  const [search, setSearch] = useState("");
  const [muscle, setMuscle] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [exTargetSets, setExTargetSets] = useState<Record<number, { sets: number; reps: string; weight: string; rest: string }>>({});

  useEffect(() => {
    if (routineId == null) return;
    setLoading(true);
    db.exercises.toArray().then((all) => {
      setExs(all);
      setLoading(false);
    });
  }, [routineId]);

  const open = routineId != null;
  const muscles = Array.from(new Set(exs.map((e) => e.musclePrimary))).sort();
  const filtered = exs.filter(
    (e) =>
      (muscle === "all" || e.musclePrimary === muscle) &&
      (!search || e.name.toLowerCase().includes(search.toLowerCase())),
  );

  const handleAdd = async (ex: Exercise) => {
    if (routineId == null) return;
    const exs = await rs.getExercises(routineId);
    const order = exs.length;
    const t = exTargetSets[ex.id!] ?? { sets: 3, reps: "8-12", weight: "", rest: "" };
    await rs.addExercise(routineId, ex.id!, order, {
      targetSets: t.sets,
      targetReps: t.reps,
      targetWeight: t.weight ? Number(t.weight) : undefined,
      targetRest: t.rest ? Number(t.rest) : undefined,
    });
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Añadir ejercicio">
      <div className="space-y-3">
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-fg-dim" />
          <input
            type="search"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border-subtle bg-surface-2 py-2 pl-9 pr-3 text-sm outline-none focus:border-(--tier-border)"
          />
        </div>

        <AnimatedTabs
          layoutId="add-ex-muscle"
          scrollable
          tabs={[{ value: "all", label: `Todos (${exs.length})` }, ...muscles.map((m) => ({ value: m, label: m }))]}
          value={muscle}
          onChange={setMuscle}
        />

        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-14" />
            ))}
          </div>
        ) : (
          <ul className="max-h-[50vh] space-y-1 overflow-y-auto pr-1">
            {filtered.slice(0, 30).map((ex) => {
              const t = exTargetSets[ex.id!] ?? { sets: 3, reps: "8-12", weight: "", rest: "" };
              return (
                <li
                  key={ex.id}
                  className="rounded-lg border border-border-subtle bg-surface-2/40 p-2"
                >
                  <div className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-display truncate text-sm font-semibold">
                        {ex.name}
                      </div>
                      <div className="text-[10px] text-fg-muted">
                        {ex.musclePrimary} · {ex.equipment}
                      </div>
                    </div>
                    <Button size="sm" onClick={() => handleAdd(ex)}>
                      <Plus size={12} />
                      Añadir
                    </Button>
                  </div>
                  {/* Mini-form para targets */}
                  <div className="mt-1.5 grid grid-cols-4 gap-1.5">
                    <input
                      type="number"
                      placeholder="Sets"
                      value={t.sets}
                      onChange={(e) =>
                        setExTargetSets((prev) => ({
                          ...prev,
                          [ex.id!]: { ...t, sets: Number(e.target.value) },
                        }))
                      }
                      className="rounded border border-border-subtle bg-surface-1 px-1.5 py-1 text-center font-mono text-[11px] outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Reps"
                      value={t.reps}
                      onChange={(e) =>
                        setExTargetSets((prev) => ({
                          ...prev,
                          [ex.id!]: { ...t, reps: e.target.value },
                        }))
                      }
                      className="rounded border border-border-subtle bg-surface-1 px-1.5 py-1 text-center font-mono text-[11px] outline-none"
                    />
                    <input
                      type="number"
                      placeholder="kg"
                      value={t.weight}
                      onChange={(e) =>
                        setExTargetSets((prev) => ({
                          ...prev,
                          [ex.id!]: { ...t, weight: e.target.value },
                        }))
                      }
                      className="rounded border border-border-subtle bg-surface-1 px-1.5 py-1 text-center font-mono text-[11px] outline-none"
                    />
                    <input
                      type="number"
                      placeholder="s"
                      value={t.rest}
                      onChange={(e) =>
                        setExTargetSets((prev) => ({
                          ...prev,
                          [ex.id!]: { ...t, rest: e.target.value },
                        }))
                      }
                      className="rounded border border-border-subtle bg-surface-1 px-1.5 py-1 text-center font-mono text-[11px] outline-none"
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </BottomSheet>
  );
}
