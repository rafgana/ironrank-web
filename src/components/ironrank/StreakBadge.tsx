"use client";

import { Flame } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useStreak } from "../../hooks/useStreak";
import { cn } from "../../lib/utils";
import { springFast } from "../../lib/motionTokens";

/**
 * Badge de racha que aparece junto al tier pill en el header.
 * - Si racha = 0: oculto
 * - Si racha = 1: gris neutro
 * - Si racha >= 2: naranja fuego, escala sutil
 * - Si racha >= 7: pulse animation
 */
export function StreakBadge({ className }: { className?: string }) {
  const streak = useStreak();
  if (streak.current === 0) return null;

  const isOnFire = streak.current >= 2;
  const isBlazing = streak.current >= 7;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={streak.current}
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={springFast}
        className={cn(
          "flex items-center gap-1.5 h-9 px-3 rounded-full text-sm font-semibold",
          isOnFire
            ? "bg-orange-500/15 text-orange-300 border border-orange-500/30"
            : "bg-surface-2 text-fg-muted border border-border-subtle",
          isBlazing && "shadow-[0_0_24px_rgba(249,115,22,0.35)]",
          className,
        )}
        aria-label={`Racha: ${streak.current} ${streak.current === 1 ? "día" : "días"} consecutivos`}
        title={
          streak.active && streak.hoursUntilBreak > 0
            ? `Pierdes la racha en ${streak.hoursUntilBreak}h si no entrenas`
            : streak.best > streak.current
              ? `Récord: ${streak.best} días`
              : `${streak.current} días seguidos`
        }
      >
        <motion.div
          animate={isBlazing ? { rotate: [-3, 3, -3] } : {}}
          transition={isBlazing ? { repeat: Infinity, duration: 0.8, ease: "easeInOut" } : {}}
        >
          <Flame
            size={14}
            strokeWidth={2.5}
            className={cn(isOnFire && "fill-orange-400 text-orange-400")}
            aria-hidden
          />
        </motion.div>
        <span className="font-condensed tracking-wide text-[13px] tabular-nums">
          {streak.current}
        </span>
        {streak.best > streak.current && streak.best >= 3 && (
          <span className="hidden xl:inline text-[10px] font-mono opacity-60 ml-0.5">
            /{streak.best}
          </span>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
