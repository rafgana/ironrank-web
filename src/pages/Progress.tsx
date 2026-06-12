"use client";

import { useEffect, useState, lazy, Suspense } from "react";
import { motion } from "motion/react";
import {
  Trophy,
  TrendingUp,
  Calendar,
  Activity,
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  CalendarDays,
} from "lucide-react";
import { useWorkoutStore } from "../store/workoutStore";
import { db } from "../db/database";
import { estimatedMax } from "../utils/estimators";
import { StatTile } from "../components/ironrank/StatTile";
import { SectionHeader } from "../components/ui/SectionHeader";
import { AnimatedTabs } from "../components/ui/AnimatedTabs";
import { EmptyState } from "../components/ui/EmptyState";
import { useIsDesktop } from "../hooks/useIsDesktop";
import { enterItem, enterStagger } from "../lib/motionTokens";

const VolumeChart = lazy(() =>
  import("../components/ironrank/VolumeChart").then((m) => ({
    default: m.VolumeChart,
  })),
);
const OneRMChart = lazy(() =>
  import("../components/ironrank/OneRMChart").then((m) => ({
    default: m.OneRMChart,
  })),
);
const MuscleRadar = lazy(() =>
  import("../components/ironrank/MuscleRadar").then((m) => ({
    default: m.MuscleRadar,
  })),
);
const ActivityHeatmap = lazy(() =>
  import("../components/ironrank/ActivityHeatmap").then((m) => ({
    default: m.ActivityHeatmap,
  })),
);

interface VolumePoint {
  week: string;
  volume: number;
  workouts: number;
}

interface OneRMPoint {
  date: string;
  [exercise: string]: number | string;
}

interface PRRecord {
  id: string;
  exercise: string;
  kind: "1rm" | "reps" | "volume";
  value: string;
  detail: string;
  date: Date;
}

interface MusclePoint {
  muscle: string;
  volume: number;
}

type PanelKey = "volume" | "1rm" | "prs" | "muscle" | "calendar";

export function Progress() {
  const ws = useWorkoutStore();
  const isDesktop = useIsDesktop(1024);
  const [volume, setVolume] = useState<VolumePoint[]>([]);
  const [oneRM, setOneRM] = useState<{
    data: OneRMPoint[];
    exercises: string[];
  }>({ data: [], exercises: [] });
  const [prs, setPRs] = useState<PRRecord[]>([]);
  const [muscleVolume, setMuscleVolume] = useState<MusclePoint[]>([]);
  const [heatmap, setHeatmap] = useState<
    { date: Date; count: number; volume: number }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);
  const [tab, setTab] = useState<PanelKey>("volume");
  const [selectedEx, setSelectedEx] = useState<string | null>(null);

  useEffect(() => {
    if (ws.profile) loadAll();
  }, [ws.workouts, ws.profile]);

  const loadAll = async () => {
    setLoading(true);
    const allWorkouts = await db.workouts.orderBy("date").reverse().toArray();
    if (!allWorkouts.length) {
      setLoading(false);
      setHasData(false);
      return;
    }
    setHasData(true);

    // Volume semanal
    const weeklyMap = new Map<string, { volume: number; workouts: number }>();
    for (const w of allWorkouts) {
      const date = new Date(w.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().slice(0, 10);
      const wes = await db.workoutExercises
        .where("workoutId")
        .equals(w.id!)
        .toArray();
      let vol = 0;
      for (const we of wes) {
        const sets = await db.sets
          .where("workoutExerciseId")
          .equals(we.id!)
          .filter((s) => s.completed)
          .toArray();
        vol += sets.reduce((a, s) => a + s.weight * s.reps, 0);
      }
      const current = weeklyMap.get(weekKey) ?? { volume: 0, workouts: 0 };
      weeklyMap.set(weekKey, {
        volume: current.volume + vol,
        workouts: current.workouts + 1,
      });
    }
    const volData = Array.from(weeklyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12)
      .map(([week, d]) => ({
        week: week.slice(5),
        volume: Math.round(d.volume),
        workouts: d.workouts,
      }));
    setVolume(volData);

    // 1RM por ejercicio
    const exMap = new Map<string, Map<string, number>>();
    for (const w of allWorkouts) {
      const wes = await db.workoutExercises
        .where("workoutId")
        .equals(w.id!)
        .toArray();
      for (const we of wes) {
        const exercise = await db.exercises.get(we.exerciseId);
        if (!exercise) continue;
        const sets = await db.sets
          .where("workoutExerciseId")
          .equals(we.id!)
          .filter((s) => s.completed)
          .toArray();
        if (!sets.length) continue;
        const bestRm = Math.max(
          ...sets.map((s) => estimatedMax(s.weight, s.reps, s.rir)),
        );
        const exData = exMap.get(exercise.name) ?? new Map();
        const prev = exData.get(w.date.toString()) ?? 0;
        exData.set(w.date.toString(), Math.max(prev, bestRm));
        exMap.set(exercise.name, exData);
      }
    }
    const tracked = [
      "Press Banca",
      "Sentadilla",
      "Peso Muerto",
      "Press Militar",
      "Remo Barra",
    ];
    const allDates = Array.from(
      new Set(
        allWorkouts.map((w) => new Date(w.date).toISOString().slice(0, 10)),
      ),
    ).sort();
    const rmData: OneRMPoint[] = allDates.map((d) => {
      const point: OneRMPoint = { date: d };
      for (const ex of tracked) {
        const exData = exMap.get(ex);
        if (!exData) continue;
        const dateKey = allWorkouts
          .find((w) => new Date(w.date).toISOString().slice(0, 10) === d)
          ?.date.toString();
        if (dateKey) {
          const v = exData.get(dateKey);
          if (v) point[ex] = Math.round(v * 10) / 10;
        }
      }
      return point;
    });
    setOneRM({ data: rmData, exercises: tracked });
    if (!selectedEx && tracked.length) setSelectedEx(tracked[0]);

    // PRs recientes
    const prList: PRRecord[] = [];
    for (const w of allWorkouts.slice(0, 10)) {
      const wes = await db.workoutExercises
        .where("workoutId")
        .equals(w.id!)
        .toArray();
      for (const we of wes) {
        const exercise = await db.exercises.get(we.exerciseId);
        if (!exercise) continue;
        const sets = await db.sets
          .where("workoutExerciseId")
          .equals(we.id!)
          .filter((s) => s.completed)
          .toArray();
        if (!sets.length) continue;
        const bestRm = Math.max(
          ...sets.map((s) => estimatedMax(s.weight, s.reps, s.rir)),
        );
        prList.push({
          id: `${w.id}-${we.id}`,
          exercise: exercise.name,
          kind: "1rm",
          value: `${bestRm.toFixed(1)} kg`,
          detail: "1RM estimado",
          date: new Date(w.date),
        });
      }
    }
    prList.sort((a, b) => b.date.getTime() - a.date.getTime());
    setPRs(prList.slice(0, 8));

    // Volumen por músculo
    const muscleMap = new Map<string, number>();
    for (const w of allWorkouts) {
      const wes = await db.workoutExercises
        .where("workoutId")
        .equals(w.id!)
        .toArray();
      for (const we of wes) {
        const exercise = await db.exercises.get(we.exerciseId);
        if (!exercise) continue;
        const sets = await db.sets
          .where("workoutExerciseId")
          .equals(we.id!)
          .filter((s) => s.completed)
          .toArray();
        const vol = sets.reduce((a, s) => a + s.weight * s.reps, 0);
        muscleMap.set(
          exercise.musclePrimary,
          (muscleMap.get(exercise.musclePrimary) ?? 0) + vol,
        );
      }
    }
    const muscleData = Array.from(muscleMap.entries())
      .map(([muscle, v]) => ({ muscle, volume: Math.round(v) }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 8);
    setMuscleVolume(muscleData);

    // Heatmap data
    const heatmapMap = new Map<string, { count: number; volume: number }>();
    for (const w of allWorkouts) {
      const k = new Date(w.date).toISOString().slice(0, 10);
      const cur = heatmapMap.get(k) ?? { count: 0, volume: 0 };
      const wes = await db.workoutExercises
        .where("workoutId")
        .equals(w.id!)
        .toArray();
      let vol = 0;
      for (const we of wes) {
        const sets = await db.sets
          .where("workoutExerciseId")
          .equals(we.id!)
          .filter((s) => s.completed)
          .toArray();
        vol += sets.reduce((a, s) => a + s.weight * s.reps, 0);
      }
      heatmapMap.set(k, { count: cur.count + 1, volume: cur.volume + vol });
    }
    setHeatmap(
      Array.from(heatmapMap.entries()).map(([k, v]) => ({
        date: new Date(k),
        count: v.count,
        volume: v.volume,
      })),
    );
    setLoading(false);
  };

  const totalVolume = volume.reduce((a, w) => a + w.volume, 0);
  const totalWorkouts = volume.reduce((a, w) => a + w.workouts, 0);
  const lastWeek = volume[volume.length - 1];
  const prevWeek = volume[volume.length - 2];
  const weekDelta =
    lastWeek && prevWeek && prevWeek.volume > 0
      ? Math.round(
          ((lastWeek.volume - prevWeek.volume) / prevWeek.volume) * 100,
        )
      : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-10 w-48" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-28" />
          ))}
        </div>
        <div className="skeleton h-72" />
      </div>
    );
  }

  if (!hasData) {
    return (
      <EmptyState
        icon={BarChart3}
        title="Aún no hay datos"
        body="Completa tu primer workout para empezar a ver gráficas de volumen, PRs y distribución muscular."
      />
    );
  }

  const panels: Record<PanelKey, React.ReactNode> = {
    volume: (
      <Panel
        eyebrow="Volumen semanal"
        title={`${totalVolume.toLocaleString("es-ES")} kg en 12 semanas`}
        action={
          weekDelta !== 0 ? (
            <span
              className={`font-mono text-sm font-semibold ${
                weekDelta > 0 ? "text-tier-esmeralda" : "text-red-400"
              }`}
            >
              {weekDelta > 0 ? "+" : ""}
              {weekDelta}%
            </span>
          ) : undefined
        }
      >
        <Suspense fallback={<div className="skeleton h-64" />}>
          <VolumeChart data={volume} />
        </Suspense>
      </Panel>
    ),
    muscle: (
      <Panel eyebrow="Por grupo muscular" title="Distribución">
        <Suspense fallback={<div className="skeleton h-64" />}>
          <MuscleRadar data={muscleVolume} />
        </Suspense>
      </Panel>
    ),
    "1rm": (
      <Panel eyebrow="1RM estimado" title="Evolución por ejercicio">
        <div className="mb-3">
          <AnimatedTabs
            layoutId="progress-1rm-ex"
            scrollable
            tabs={oneRM.exercises.map((ex) => ({ value: ex, label: ex }))}
            value={selectedEx ?? oneRM.exercises[0]}
            onChange={setSelectedEx}
          />
        </div>
        <Suspense fallback={<div className="skeleton h-64" />}>
          <OneRMChart
            data={oneRM.data}
            exercise={selectedEx ?? oneRM.exercises[0]}
          />
        </Suspense>
      </Panel>
    ),
    prs: (
      <Panel eyebrow="Récords" title="PRs recientes">
        {prs.length === 0 ? (
          <p className="py-6 text-center text-sm text-fg-muted">
            Completa workouts con pesos para ver tus PRs.
          </p>
        ) : (
          <div className="space-y-2">
            {prs.map((pr) => (
              <PRRow key={pr.id} pr={pr} />
            ))}
          </div>
        )}
      </Panel>
    ),
    calendar: (
      <Panel eyebrow="Consistencia" title="Mapa de actividad">
        <Suspense fallback={<div className="skeleton h-44" />}>
          <ActivityHeatmap data={heatmap} weeks={26} />
        </Suspense>
      </Panel>
    ),
  };

  return (
    <motion.div
      variants={enterStagger}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <motion.header variants={enterItem}>
        <div className="eyebrow mb-1">Últimas 12 semanas</div>
        <h1 className="font-display text-h1 font-bold">Progreso</h1>
      </motion.header>

      <motion.div
        variants={enterItem}
        className="grid grid-cols-2 gap-3 md:grid-cols-4"
      >
        <StatTile
          icon={Activity}
          label="Volumen total"
          value={totalVolume}
          suffix="kg"
        />
        <StatTile
          icon={Calendar}
          label="Workouts"
          value={totalWorkouts}
          accent="var(--color-tier-esmeralda)"
        />
        <StatTile
          icon={TrendingUp}
          label="Esta semana"
          value={lastWeek?.volume ?? 0}
          suffix="kg"
          accent="var(--color-brand-500)"
        />
        <StatTile
          icon={Trophy}
          label="PRs"
          value={prs.length}
          accent="var(--color-tier-oro)"
        />
      </motion.div>

      {isDesktop ? (
        /* Desktop: todos los paneles en grid */
        <motion.div variants={enterItem} className="grid grid-cols-12 gap-6">
          <div className="col-span-7">{panels.volume}</div>
          <div className="col-span-5">{panels.muscle}</div>
          <div className="col-span-7">{panels["1rm"]}</div>
          <div className="col-span-5">{panels.prs}</div>
          <div className="col-span-12">{panels.calendar}</div>
        </motion.div>
      ) : (
        /* Móvil: tabs */
        <motion.div variants={enterItem} className="space-y-4">
          <AnimatedTabs
            layoutId="progress-tabs"
            scrollable
            tabs={[
              {
                value: "volume",
                label: "Volumen",
                icon: <BarChart3 size={13} />,
              },
              {
                value: "calendar",
                label: "Actividad",
                icon: <CalendarDays size={13} />,
              },
              {
                value: "1rm",
                label: "1RM",
                icon: <LineChartIcon size={13} />,
              },
              { value: "prs", label: "PRs", icon: <Trophy size={13} /> },
              {
                value: "muscle",
                label: "Músculo",
                icon: <PieChartIcon size={13} />,
              },
            ]}
            value={tab}
            onChange={setTab}
          />
          {panels[tab]}
        </motion.div>
      )}
    </motion.div>
  );
}

function Panel({
  eyebrow,
  title,
  action,
  children,
}: {
  eyebrow: string;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="card h-full p-4 md:p-6">
      <SectionHeader eyebrow={eyebrow} title={title} action={action} />
      {children}
    </section>
  );
}

function PRRow({ pr }: { pr: PRRecord }) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-surface-2 p-3">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_oklab,var(--color-tier-oro)_12%,transparent)] text-tier-oro">
        <Trophy size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-display truncate text-sm font-bold">
          {pr.exercise}
        </div>
        <div className="text-xs text-fg-muted">
          {pr.detail} ·{" "}
          {pr.date.toLocaleDateString("es-ES", {
            day: "numeric",
            month: "short",
          })}
        </div>
      </div>
      <div className="font-display text-base font-bold tabular-nums text-tier-oro">
        {pr.value}
      </div>
    </div>
  );
}
