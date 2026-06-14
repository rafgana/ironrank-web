"use client";

import { motion } from "motion/react";
import { Check, X } from "lucide-react";
import type { SetEntry } from "../models/types";
import { estimatedMax } from "../utils/estimators";
import { fmt } from "../utils/format";
import { cn } from "../lib/utils";

interface SetRowProps {
  set: SetEntry;
  index: number;
  onToggle: () => void;
  onRemove?: () => void;
  /** Si este set es un PR (nuevo e1RM histórico para el ejercicio). */
  isPR?: boolean;
  /** Delta del PR (kg sobre el mejor histórico). */
  prDelta?: number;
}

const RIR_LABELS: Record<number, { label: string; color: string }> = {
  0: { label: "F", color: "#EF4444" },
  1: { label: "1", color: "#F97316" },
  2: { label: "2", color: "#EAB308" },
  3: { label: "3", color: "#84CC16" },
  4: { label: "4+", color: "#10B981" },
};

export function SetRow({ set, index, onToggle, onRemove, isPR, prDelta }: SetRowProps) {
  const isDone = set.completed;
  const rirInfo = set.rir != null ? RIR_LABELS[set.rir] : null;
  const e1rm = estimatedMax(set.weight, set.reps, set.rir);

  return (
    <motion.div
      layout
      initial={false}
      animate={{
        opacity: isDone ? 0.6 : 1,
        scale: isDone ? [1, 1.015, 0.99] : 1,
      }}
      transition={{ duration: 0.25 }}
      className={cn(
        "group relative flex items-center gap-2 rounded-lg py-1.5 pr-3 pl-1 text-sm transition-colors",
        isDone ? "bg-surface-2" : "hover:bg-surface-2",
      )}
    >
      {/* Hit area 44px; círculo visual 28px */}
      <button
        onClick={onToggle}
        className="tap-target flex shrink-0 items-center justify-center"
        aria-label={isDone ? "Desmarcar serie" : "Completar serie"}
      >
        <span
          className={cn(
            "flex size-7 items-center justify-center rounded-md border-2 transition-colors",
            isDone
              ? "border-tier-esmeralda bg-tier-esmeralda"
              : "border-fg-dim",
          )}
        >
          {isDone && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <Check size={16} strokeWidth={3} className="text-white" />
            </motion.span>
          )}
        </span>
      </button>

      <span className="w-5 shrink-0 text-center font-mono text-xs tabular-nums text-fg-dim">
        {index + 1}
      </span>

      <div
        className={cn(
          "font-display flex flex-1 items-center gap-2 tabular-nums",
          isDone && "line-through",
        )}
      >
        <span
          className={cn(
            "text-lg font-bold",
            isDone ? "text-fg-muted" : "text-fg",
          )}
        >
          {fmt.kg(set.weight)}
          <span className="ml-0.5 text-xs font-normal text-fg-muted">kg</span>
        </span>
        <span className="font-normal text-fg-dim">×</span>
        <span
          className={cn(
            "text-lg font-bold",
            isDone ? "text-fg-muted" : "text-fg",
          )}
        >
          {set.reps}
        </span>
        {rirInfo && (
          <span
            className="rounded px-1.5 py-0.5 text-[11px] font-bold"
            style={{
              background: `${rirInfo.color}20`,
              color: rirInfo.color,
            }}
          >
            RIR {rirInfo.label}
          </span>
        )}
        {set.isDropSet && (
          <span className="rounded bg-[color-mix(in_oklab,var(--color-tier-retador)_15%,transparent)] px-1.5 py-0.5 text-[11px] font-bold text-tier-retador">
            DROP
          </span>
        )}
        {isPR && (
          <span
            className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider animate-pulse"
            style={{
              background: "color-mix(in oklab, var(--tier) 18%, transparent)",
              color: "var(--tier)",
              border: "1px solid color-mix(in oklab, var(--tier) 40%, transparent)",
            }}
          >
            PR {prDelta ? `+${prDelta.toFixed(1)}kg` : ""}
          </span>
        )}
      </div>

      <div className="shrink-0 text-right">
        <div className="text-[11px] text-fg-dim">e1RM</div>
        <div
          className={cn(
            "font-mono text-xs font-semibold tabular-nums",
            isDone ? "text-fg-muted" : "text-(--tier)",
          )}
        >
          {e1rm.toFixed(1)}
        </div>
      </div>
      {onRemove && (
        <button
          onClick={onRemove}
          className="tap-target flex shrink-0 items-center justify-center text-fg-dim opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
          aria-label="Eliminar serie"
          title="Eliminar serie"
        >
          <X size={14} />
        </button>
      )}
    </motion.div>
  );
}
