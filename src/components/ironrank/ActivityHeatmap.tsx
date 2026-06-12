"use client";

import { useMemo } from "react";
import { motion } from "motion/react";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeatmapProps {
  data: { date: Date; count: number; volume: number }[];
  weeks?: number;
  className?: string;
}

const MONTH_LABELS = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];
const DAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"];

export function ActivityHeatmap({ data, weeks = 26, className }: HeatmapProps) {
  const { grid, totalWorkouts, longestStreak, currentStreak } =
    useMemo(() => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find the start: `weeks` weeks ago, aligned to Sunday
      const start = new Date(today);
      start.setDate(today.getDate() - today.getDay() - (weeks - 1) * 7);
      start.setHours(0, 0, 0, 0);

      // Build grid: array of columns (weeks), each with 7 days (Sun-Sat)
      const dataMap = new Map<string, { count: number; volume: number }>();
      for (const d of data) {
        const k = new Date(d.date).toISOString().slice(0, 10);
        const cur = dataMap.get(k) ?? { count: 0, volume: 0 };
        dataMap.set(k, { count: cur.count + 1, volume: cur.volume + d.volume });
      }

      const cols: { date: Date; count: number; volume: number }[][] = [];
      for (let w = 0; w < weeks; w++) {
        const col: { date: Date; count: number; volume: number }[] = [];
        for (let d = 0; d < 7; d++) {
          const day = new Date(start);
          day.setDate(start.getDate() + w * 7 + d);
          if (day > today) {
            col.push({ date: day, count: -1, volume: 0 });
          } else {
            const k = day.toISOString().slice(0, 10);
            const d2 = dataMap.get(k);
            col.push({
              date: day,
              count: d2?.count ?? 0,
              volume: d2?.volume ?? 0,
            });
          }
        }
        cols.push(col);
      }

      // Total workouts & streaks
      let total = 0;
      let longest = 0;
      let current = 0;
      let run = 0;
      // Flatten chronological for streak calc
      const flat: { date: Date; count: number }[] = [];
      for (const col of cols) {
        for (const d of col) {
          if (d.count >= 0) flat.push(d);
        }
      }
      for (const d of flat) {
        if (d.count > 0) {
          total++;
          run++;
          longest = Math.max(longest, run);
        } else {
          run = 0;
        }
      }
      // Current streak: count back from today
      for (let i = flat.length - 1; i >= 0; i--) {
        if (flat[i].count > 0) current++;
        else if (flat[i].date.getTime() === today.getTime()) continue;
        else break;
      }

      return {
        grid: cols,
        totalWorkouts: total,
        longestStreak: longest,
        currentStreak: current,
      };
    }, [data, weeks]);

  const monthMarkers: { week: number; month: number }[] = [];
  let lastMonth = -1;
  grid.forEach((col, i) => {
    const m = col[0].date.getMonth();
    if (m !== lastMonth) {
      monthMarkers.push({ week: i, month: m });
      lastMonth = m;
    }
  });

  return (
    <div className={cn("w-full", className)}>
      {/* Stats bar */}
      <div className="flex items-center justify-between mb-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="text-[var(--color-fg-muted)]">
            <span className="font-display font-bold text-[var(--color-fg)] text-base tabular-nums">
              {totalWorkouts}
            </span>{" "}
            workouts en {weeks} semanas
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1 text-[var(--color-fg-muted)]">
            <Flame size={11} style={{ color: "var(--tier)" }} />
            <span className="text-[var(--color-fg)] font-bold tabular-nums">
              {currentStreak}
            </span>{" "}
            racha actual
          </span>
          <span className="text-[var(--color-fg-dim)]">·</span>
          <span className="text-[var(--color-fg-muted)]">
            <span className="text-[var(--color-fg)] font-bold tabular-nums">
              {longestStreak}
            </span>{" "}
            mejor
          </span>
        </div>
      </div>

      {/* Heatmap fluido: llena el ancho del contenedor */}
      <div className="pb-1">
        <div>
          {/* Month labels (posicionadas por porcentaje) */}
          <div className="relative mb-1 ml-6 h-4">
            {monthMarkers.map((m) => (
              <span
                key={m.week}
                className="absolute text-[11px] text-[var(--color-fg-dim)]"
                style={{ left: `${(m.week / weeks) * 100}%` }}
              >
                {MONTH_LABELS[m.month]}
              </span>
            ))}
          </div>

          <div className="flex">
            {/* Day labels */}
            <div
              className="mr-1.5 grid w-4.5 shrink-0 text-[10px] text-[var(--color-fg-dim)]"
              style={{ gridTemplateRows: "repeat(7, 1fr)", gap: 2 }}
            >
              {DAY_LABELS.map((d, i) => (
                <div
                  key={d}
                  className="flex items-center"
                  style={{ opacity: i % 2 === 1 ? 1 : 0 }}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Grid */}
            <div
              className="grid min-w-0 flex-1"
              style={{
                gridTemplateColumns: `repeat(${weeks}, minmax(0, 1fr))`,
                gap: 2,
              }}
            >
              {grid.map((col, ci) => (
                <div
                  key={ci}
                  className="grid"
                  style={{ gridTemplateRows: "repeat(7, 1fr)", gap: 2 }}
                >
                  {col.map((cell, di) => {
                    const intensity =
                      cell.count < 0
                        ? -1
                        : cell.count === 0
                          ? 0
                          : Math.min(4, Math.ceil((cell.count / Math.max(1, 4)) * 4));
                    const colors = [
                      "var(--color-surface-2)",
                      "color-mix(in oklab, var(--tier) 30%, var(--color-surface-2))",
                      "color-mix(in oklab, var(--tier) 55%, var(--color-surface-2))",
                      "color-mix(in oklab, var(--tier) 80%, var(--color-surface-2))",
                      "var(--tier)",
                    ];
                    return (
                      <motion.div
                        key={di}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{
                          delay: 0.005 * ci + 0.001 * di,
                          duration: 0.2,
                        }}
                        title={`${cell.date.toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                        })} · ${cell.count} workout${cell.count !== 1 ? "s" : ""}${cell.volume > 0 ? ` · ${cell.volume}kg` : ""}`}
                        className="aspect-square w-full cursor-pointer rounded-sm"
                        style={{
                          background:
                            intensity < 0
                              ? "transparent"
                              : colors[intensity],
                          border:
                            intensity > 0
                              ? "1px solid var(--color-border-subtle)"
                              : "1px solid transparent",
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1.5 mt-2 text-[11px] text-[var(--color-fg-dim)]">
        <span>Menos</span>
        <div className="flex gap-[2px]">
          {[
            "var(--color-surface-2)",
            "color-mix(in oklab, var(--tier) 30%, var(--color-surface-2))",
            "color-mix(in oklab, var(--tier) 55%, var(--color-surface-2))",
            "color-mix(in oklab, var(--tier) 80%, var(--color-surface-2))",
            "var(--tier)",
          ].map((c) => (
            <div
              key={c}
              className="size-[11px] rounded-sm"
              style={{ background: c }}
            />
          ))}
        </div>
        <span>Más</span>
      </div>
    </div>
  );
}
