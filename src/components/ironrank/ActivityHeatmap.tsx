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

      {/* Heatmap */}
      <div className="overflow-x-auto -mx-2 px-2 pb-2">
        <div className="inline-block">
          {/* Month labels */}
          <div className="flex mb-1 ml-6">
            {monthMarkers.map((m) => (
              <div
                key={m.week}
                className="text-[11px] text-[var(--color-fg-dim)]"
                style={{
                  width: 13,
                  position: "relative",
                  left: m.week === 0 ? 0 : m.week * 13 - (monthMarkers.findIndex((x) => x.week === m.week) * 0),
                }}
              >
                {MONTH_LABELS[m.month]}
              </div>
            ))}
          </div>

          <div className="flex">
            {/* Day labels */}
            <div className="flex flex-col justify-between mr-1.5 text-[10px] text-[var(--color-fg-dim)] py-[1px]">
              {DAY_LABELS.map((d, i) => (
                <div
                  key={d}
                  style={{
                    height: 11,
                    lineHeight: "11px",
                    opacity: i % 2 === 1 ? 1 : 0,
                  }}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Grid */}
            <div className="flex gap-[2px]">
              {grid.map((col, ci) => (
                <div key={ci} className="flex flex-col gap-[2px]">
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
                        className="size-[11px] rounded-sm cursor-pointer"
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
