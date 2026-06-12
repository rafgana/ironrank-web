"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Disc3, Flame } from "lucide-react";
import { platesFor, warmupSets } from "../services/plateCalculator";
import { cn } from "../lib/utils";

interface PlateCalcProps {
  weight: number;
  barWeight: number;
  availablePlates: number[];
}

const PLATE_COLORS: Record<number, string> = {
  25: "#DC2626",
  20: "#2563EB",
  15: "#FCD34D",
  10: "#10B981",
  5: "#FFFFFF",
  2.5: "#6B7280",
  1.25: "#374151",
};

export function PlateCalc({ weight, barWeight, availablePlates }: PlateCalcProps) {
  const [open, setOpen] = useState(false);

  if (weight <= barWeight) return null;

  const plates = platesFor(weight, barWeight, availablePlates);
  const warmup = warmupSets(weight, barWeight);

  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={`${open ? "Ocultar" : "Mostrar"} distribución de discos`}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs"
        style={{
          background: "var(--color-surface-2)",
          border: "1px solid var(--color-border-subtle)",
        }}
      >
        <span className="flex items-center gap-1.5 text-[var(--color-fg-muted)]">
          <Disc3 size={12} />
          {plates.length
            ? `${plates.length} discos c/lado`
            : "Solo barra"}
        </span>
        <ChevronDown
          size={14}
          className={cn(
            "transition-transform text-[var(--color-fg-muted)]",
            open && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              className="mt-2 p-3 rounded-lg space-y-3"
              style={{
                background: "var(--color-surface-2)",
                border: "1px solid var(--color-border-subtle)",
              }}
            >
              {/* Visual plates on bar */}
              <div>
                <div className="text-[10px] font-condensed tracking-widest text-[var(--color-fg-muted)] mb-2">
                  DISTRIBUCIÓN VISUAL
                </div>
                <div className="flex items-center justify-center gap-1 py-3">
                  <div
                    className="h-2 rounded-l"
                    style={{
                      width: 40,
                      background:
                        "linear-gradient(90deg, var(--color-surface-3), var(--color-fg-dim))",
                    }}
                  />
                  {plates
                    .slice()
                    .reverse()
                    .map((p, i) => (
                      <div
                        key={`${p}-${i}`}
                        className="rounded-sm"
                        style={{
                          width: Math.max(6, p * 1.2),
                          height: Math.max(20, p * 1.5),
                          background: PLATE_COLORS[p] || "#6B7280",
                          border: "1px solid rgba(0,0,0,0.3)",
                        }}
                        title={`${p}kg`}
                      />
                    ))}
                  <div
                    className="size-2 rounded-full"
                    style={{ background: "var(--color-fg-dim)" }}
                  />
                  {plates.map((p, i) => (
                    <div
                      key={`r-${p}-${i}`}
                      className="rounded-sm"
                      style={{
                        width: Math.max(6, p * 1.2),
                        height: Math.max(20, p * 1.5),
                        background: PLATE_COLORS[p] || "#6B7280",
                        border: "1px solid rgba(0,0,0,0.3)",
                      }}
                      title={`${p}kg`}
                    />
                  ))}
                  <div
                    className="h-2 rounded-r"
                    style={{
                      width: 40,
                      background:
                        "linear-gradient(270deg, var(--color-surface-3), var(--color-fg-dim))",
                    }}
                  />
                </div>
              </div>

              {/* Plate list */}
              <div className="flex flex-wrap gap-1.5">
                {plates
                  .reduce((acc: { plate: number; count: number }[], p) => {
                    const existing = acc.find((x) => x.plate === p);
                    if (existing) existing.count++
                    else acc.push({ plate: p, count: 1 })
                    return acc
                  }, [])
                  .map(({ plate, count }) => (
                    <div
                      key={plate}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs"
                      style={{
                        background: `${PLATE_COLORS[plate] || "#6B7280"}20`,
                        border: `1px solid ${PLATE_COLORS[plate] || "#6B7280"}50`,
                      }}
                    >
                      <span
                        className="size-3 rounded-sm"
                        style={{ background: PLATE_COLORS[plate] || "#6B7280" }}
                      />
                      <span className="font-mono tabular-nums font-semibold text-[var(--color-fg)]">
                        {count}×{plate}kg
                      </span>
                    </div>
                  ))}
              </div>

              {/* Warmup */}
              {warmup.length > 1 && (
                <div>
                  <div className="text-[10px] font-condensed tracking-widest text-[var(--color-fg-muted)] mb-2 flex items-center gap-1.5">
                    <Flame size={11} />
                    CALENTAMIENTO
                  </div>
                  <div className="space-y-1">
                    {warmup.map((w, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-xs py-1"
                      >
                        <span
                          className="font-mono tabular-nums"
                          style={{ color: "var(--color-fg)" }}
                        >
                          {w.label}
                        </span>
                        {i < warmup.length - 1 && (
                          <span
                            className="text-[10px] text-[var(--color-fg-dim)]"
                          >
                            →
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
