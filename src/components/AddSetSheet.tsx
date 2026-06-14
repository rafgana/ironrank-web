"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Zap, History, Lightbulb, Plus, Minus } from "lucide-react";
import { BottomSheet } from "./ui/BottomSheet";
import { Button } from "./ui/button";
import { RIRSelector } from "./RIRSelector";
import { PlateCalc } from "./PlateCalc";

interface AddSetSheetProps {
  open: boolean;
  history?: string;
  suggestion?: string | null;
  /** Último set del ejercicio (si existe). Se usa como smart default. */
  prefill?: { weight: number; reps: number; rir: number | null } | null;
  defaultRest?: number;
  barWeight?: number;
  availablePlates?: number[];
  onAdd: (weight: number, reps: number, rir: number | null) => void;
  onClose: () => void;
}

export function AddSetSheet({
  open,
  history,
  suggestion,
  prefill = null,
  defaultRest = 90,
  barWeight = 20,
  availablePlates = [25, 20, 15, 10, 5, 2.5, 1.25],
  onAdd,
  onClose,
}: AddSetSheetProps) {
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [rir, setRIR] = useState<number | null>(null);
  const [justAdded, setJustAdded] = useState(false);
  const w = parseFloat(weight);
  const r = parseInt(reps);
  const canAdd = !isNaN(w) && !isNaN(r) && w > 0 && r > 0;

  useEffect(() => {
    if (!open) {
      setWeight("");
      setReps("");
      setRIR(null);
      setJustAdded(false);
    } else if (prefill) {
      // Pre-rellenar con el último set del mismo ejercicio (smart default)
      setWeight(String(prefill.weight));
      setReps(String(prefill.reps));
      setRIR(prefill.rir);
    }
  }, [open, prefill?.weight, prefill?.reps, prefill?.rir]);

  const adjust = (field: "weight" | "reps", delta: number) => {
    if (field === "weight") {
      setWeight((prev) => {
        const next = Math.max(0, (parseFloat(prev) || 0) + delta);
        return String(Math.round(next * 100) / 100);
      });
    } else {
      setReps((prev) => String(Math.max(0, (parseInt(prev) || 0) + delta)));
    }
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Nueva serie">
      <div className="space-y-4">
        {history && (
          <div className="flex items-center gap-1.5 rounded-md bg-surface-2 px-3 py-1.5 text-xs text-fg-muted">
            <History size={12} />
            <span>Última vez: {history}</span>
          </div>
        )}

        {suggestion && (
          <div className="flex items-center gap-1.5 rounded-md bg-[color-mix(in_oklab,var(--color-tier-esmeralda)_12%,transparent)] px-3 py-1.5 text-xs text-tier-esmeralda">
            <Lightbulb size={12} />
            <span>{suggestion}</span>
          </div>
        )}

        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-3">
          <NumberField
            label="Peso"
            value={weight}
            onChange={setWeight}
            onAdjust={(d) => adjust("weight", d)}
            step={2.5}
            unit="kg"
          />
          <div className="font-display mb-3.5 text-2xl font-bold text-fg-dim">
            ×
          </div>
          <NumberField
            label="Reps"
            value={reps}
            onChange={setReps}
            onAdjust={(d) => adjust("reps", d)}
            step={1}
            unit=""
          />
        </div>

        <RIRSelector selected={rir} onChange={setRIR} />

        {!isNaN(w) && w > barWeight && (
          <PlateCalc
            weight={w}
            barWeight={barWeight}
            availablePlates={availablePlates}
          />
        )}

        <motion.div
          animate={justAdded ? { scale: [1, 1.04, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          <Button
            disabled={!canAdd}
            onClick={() => {
              if (!canAdd) return;
              onAdd(w, r, rir);
              setJustAdded(true);
              onClose();
            }}
            variant="cta"
            className="w-full"
          >
            <Zap size={18} strokeWidth={2.5} />
            Añadir serie
          </Button>
        </motion.div>
      </div>
    </BottomSheet>
  );
}

interface NumberFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onAdjust: (delta: number) => void;
  step: number;
  unit: string;
}

function NumberField({
  label,
  value,
  onChange,
  onAdjust,
  step,
  unit,
}: NumberFieldProps) {
  return (
    <div className="min-w-0">
      <div className="eyebrow mb-1.5 text-center">{label}</div>
      <div className="flex min-w-0 items-center overflow-hidden rounded-xl border border-border-subtle bg-surface-2">
        <Stepper
          dir={-1}
          step={step}
          onAdjust={onAdjust}
          ariaLabel={`Decrementar ${label.toLowerCase()}`}
        />
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0"
          size={1}
          className="font-display w-full min-w-0 flex-1 bg-transparent text-center text-2xl font-bold text-fg tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        {unit && (
          <span className="eyebrow pr-1 !text-[11px] text-fg-dim">{unit}</span>
        )}
        <Stepper
          dir={1}
          step={step}
          onAdjust={onAdjust}
          ariaLabel={`Incrementar ${label.toLowerCase()}`}
        />
      </div>
    </div>
  );
}

/** Stepper 44×44 con repetición al mantener pulsado */
function Stepper({
  dir,
  step,
  onAdjust,
  ariaLabel,
}: {
  dir: 1 | -1;
  step: number;
  onAdjust: (delta: number) => void;
  ariaLabel: string;
}) {
  const holdTimer = useRef<number | null>(null);
  const repeatTimer = useRef<number | null>(null);

  const stop = () => {
    if (holdTimer.current) window.clearTimeout(holdTimer.current);
    if (repeatTimer.current) window.clearInterval(repeatTimer.current);
    holdTimer.current = null;
    repeatTimer.current = null;
  };

  useEffect(() => stop, []);

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.88 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      onClick={() => onAdjust(dir * step)}
      onPointerDown={() => {
        holdTimer.current = window.setTimeout(() => {
          repeatTimer.current = window.setInterval(
            () => onAdjust(dir * step),
            120,
          );
        }, 400);
      }}
      onPointerUp={stop}
      onPointerLeave={stop}
      onContextMenu={(e) => e.preventDefault()}
      className="tap-target flex items-center justify-center text-fg-muted transition-colors hover:text-fg"
      aria-label={ariaLabel}
    >
      {dir === 1 ? <Plus size={16} /> : <Minus size={16} />}
    </motion.button>
  );
}
