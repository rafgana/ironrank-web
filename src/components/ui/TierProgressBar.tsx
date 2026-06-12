"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { springUI } from "@/lib/motionTokens";
import { TIER_VARS, TIER_VARS_DEEP, tierAlpha, type Tier } from "@/models/types";
import { cn } from "@/lib/utils";

interface TierProgressBarProps {
  /** 0–100 */
  value: number;
  /** Colorea con un tier concreto; sin él usa el acento ambiental */
  tier?: Tier;
  className?: string;
}

/**
 * LA barra con glow de la app. Gradiente del tier, anchura con spring
 * y un destello que solo se dispara cuando el valor sube.
 */
export function TierProgressBar({ value, tier, className }: TierProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const prev = useRef(clamped);
  const [shineKey, setShineKey] = useState(0);

  useEffect(() => {
    if (clamped > prev.current) setShineKey((k) => k + 1);
    prev.current = clamped;
  }, [clamped]);

  const fill = tier
    ? `linear-gradient(90deg, ${TIER_VARS_DEEP[tier]}, ${TIER_VARS[tier]})`
    : "linear-gradient(90deg, var(--tier-deep), var(--tier))";
  const glow = tier ? `0 0 12px ${tierAlpha(tier, 40)}` : "0 0 12px var(--tier-glow)";

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("h-2 overflow-hidden rounded-full bg-surface-2", className)}
    >
      <motion.div
        className="relative h-full rounded-full"
        style={{ background: fill, boxShadow: glow }}
        initial={false}
        animate={{ width: `${clamped}%` }}
        transition={springUI}
      >
        <AnimatePresence>
          {shineKey > 0 && (
            <motion.span
              key={shineKey}
              className="absolute inset-y-0 w-8"
              style={{
                background:
                  "linear-gradient(90deg, transparent, oklch(1 0 0 / 0.5), transparent)",
              }}
              initial={{ left: "-15%", opacity: 1 }}
              animate={{ left: "105%" }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
