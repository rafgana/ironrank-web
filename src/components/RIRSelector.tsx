"use client";

import { motion } from "motion/react";
import { cn } from "../lib/utils";

interface RIRSelectorProps {
  selected: number | null;
  onChange: (rir: number | null) => void;
}

const options: { value: number; label: string; sublabel: string; color: string }[] = [
  { value: 0, label: "F", sublabel: "Fallo", color: "#EF4444" },
  { value: 1, label: "1", sublabel: "Difícil", color: "#F97316" },
  { value: 2, label: "2", sublabel: "Medio", color: "#EAB308" },
  { value: 3, label: "3", sublabel: "OK", color: "#84CC16" },
  { value: 4, label: "4+", sublabel: "Fácil", color: "#10B981" },
];

export function RIRSelector({ selected, onChange }: RIRSelectorProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-condensed tracking-widest text-[var(--color-fg-muted)]">
          RIR · REPS IN RESERVE
        </span>
        <span className="text-[10px] text-[var(--color-fg-dim)]">
          {selected == null ? "toca para elegir" : "toca para quitar"}
        </span>
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {options.map((opt) => {
          const isSelected = selected === opt.value;
          return (
            <motion.button
              key={opt.value}
              whileTap={{ scale: 0.94 }}
              onClick={() => onChange(isSelected ? null : opt.value)}
              className={cn(
                "relative flex flex-col items-center justify-center py-2.5 rounded-lg transition-colors",
                "border",
              )}
              style={{
                background: isSelected
                  ? `${opt.color}25`
                  : "var(--color-surface-2)",
                borderColor: isSelected ? opt.color : "var(--color-border-subtle)",
              }}
            >
              {isSelected && (
                <motion.div
                  layoutId="rir-glow"
                  className="absolute inset-0 rounded-lg"
                  style={{
                    boxShadow: `0 0 16px ${opt.color}66`,
                    pointerEvents: "none",
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span
                className="font-display text-lg font-bold tabular-nums leading-none"
                style={{ color: isSelected ? opt.color : "var(--color-fg)" }}
              >
                {opt.label}
              </span>
              <span
                className="text-[9px] font-condensed tracking-widest mt-0.5"
                style={{
                  color: isSelected ? opt.color : "var(--color-fg-dim)",
                  opacity: isSelected ? 1 : 0.7,
                }}
              >
                {opt.sublabel}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
