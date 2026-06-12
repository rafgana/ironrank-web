"use client";

import { motion, useReducedMotion } from "motion/react";
import { TIER_BADGES } from "./tier-badges";
import { springUI } from "@/lib/motionTokens";
import { TIER_VARS, tierAlpha, type Tier } from "@/models/types";
import { cn } from "@/lib/utils";

export type EmblemSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

const SIZE_MAP: Record<EmblemSize, number> = {
  xs: 32,
  sm: 48,
  md: 72,
  lg: 96,
  xl: 128,
  "2xl": 192,
};

/* Hexágono de tier-badges como clip-path para el barrido de brillo */
const HEX_CLIP = "polygon(50% 3%, 92% 27%, 92% 73%, 50% 97%, 8% 73%, 8% 27%)";

interface TierEmblemProps {
  tier: Tier;
  size?: EmblemSize;
  /** 0–100: dibuja un arco de progreso al siguiente tier alrededor del emblema */
  ringProgress?: number;
  withLabel?: boolean;
  /** Flotación idle + barrido de brillo (centro visual de la página) */
  animated?: boolean;
  className?: string;
}

/**
 * El centro visual de la identidad ranked: emblema con glow, flotación,
 * barrido de brillo y anillo de progreso opcional.
 */
export function TierEmblem({
  tier,
  size = "md",
  ringProgress,
  withLabel = false,
  animated = false,
  className,
}: TierEmblemProps) {
  const reduced = useReducedMotion();
  const px = SIZE_MAP[size];
  const Badge = TIER_BADGES[tier];
  const hasRing = ringProgress !== undefined;
  const ringPad = hasRing ? Math.max(8, px * 0.1) : 0;
  const box = px + ringPad * 2;
  const showFx = animated && !reduced && size !== "xs" && size !== "sm";

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <motion.div
        className="relative"
        style={{ width: box, height: box }}
        initial={animated && !reduced ? { scale: 0.82, opacity: 0 } : false}
        animate={{ scale: 1, opacity: 1 }}
        transition={springUI}
      >
        {/* Glow ambiental */}
        {size !== "xs" && (
          <div
            aria-hidden
            className="absolute rounded-full"
            style={{
              inset: -px * 0.18,
              background: `radial-gradient(circle, ${tierAlpha(tier, 35)}, transparent 70%)`,
              filter: "blur(12px)",
            }}
          />
        )}

        {/* Anillo de progreso al siguiente tier */}
        {hasRing && (
          <svg
            aria-hidden
            className="absolute inset-0 -rotate-90"
            viewBox="0 0 100 100"
          >
            <circle
              cx="50"
              cy="50"
              r="47"
              fill="none"
              stroke={tierAlpha(tier, 15)}
              strokeWidth="3"
            />
            <motion.circle
              cx="50"
              cy="50"
              r="47"
              fill="none"
              stroke={TIER_VARS[tier]}
              strokeWidth="3"
              strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 4px ${tierAlpha(tier, 60)})` }}
              initial={{ pathLength: 0 }}
              animate={{
                pathLength: Math.min(100, Math.max(0, ringProgress)) / 100,
              }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
            />
          </svg>
        )}

        {/* Emblema (flotación idle vía CSS, respeta reduced-motion global) */}
        <div
          className="absolute"
          style={{
            inset: ringPad,
            animation: showFx
              ? "emblem-float 5s ease-in-out infinite"
              : undefined,
          }}
        >
          <Badge size={px} glow={size !== "xs" && size !== "sm"} showIcon={size !== "xs"} />

          {/* Barrido de brillo periódico, recortado al hexágono */}
          {showFx && (
            <motion.div
              aria-hidden
              className="absolute inset-0 overflow-hidden"
              style={{ clipPath: HEX_CLIP }}
            >
              <motion.div
                className="absolute inset-y-0 w-1/3"
                style={{
                  background:
                    "linear-gradient(105deg, transparent, oklch(1 0 0 / 0.35), transparent)",
                }}
                initial={{ x: "-150%" }}
                animate={{ x: "400%" }}
                transition={{
                  duration: 1.1,
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatDelay: 7,
                }}
              />
            </motion.div>
          )}
        </div>
      </motion.div>

      {withLabel && (
        <div
          className="eyebrow !text-sm"
          style={{
            color: TIER_VARS[tier],
            textShadow: `0 0 20px ${tierAlpha(tier, 40)}`,
          }}
        >
          {tier}
        </div>
      )}
    </div>
  );
}
