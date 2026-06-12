"use client";

import { motion } from "motion/react";
import { TIER_BADGES } from "./tier-badges";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { TIERS, TIER_COLORS, TIER_COLORS_2, type Tier } from "@/models/types";
import type { TierBadgeProps } from "./tier-badges";

export type TierSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

const SIZE_MAP: Record<TierSize, number> = {
  xs: 32,
  sm: 48,
  md: 72,
  lg: 96,
  xl: 128,
  "2xl": 192,
};

const LABEL_SIZE_MAP: Record<TierSize, string> = {
  xs: "text-[8px]",
  sm: "text-[10px]",
  md: "text-xs",
  lg: "text-sm",
  xl: "text-base",
  "2xl": "text-xl",
};

interface TierBadgeProps2 extends Omit<TierBadgeProps, "size"> {
  tier: Tier;
  size?: TierSize;
  withLabel?: boolean;
  withSublabel?: boolean;
  progress?: { current: number; needed: number };
  animated?: boolean;
  className?: string;
}

export function TierBadge({
  tier,
  size = "md",
  withLabel = false,
  withSublabel = false,
  progress,
  animated = false,
  className,
  ...badgeProps
}: TierBadgeProps2) {
  const Badge = TIER_BADGES[tier];
  const px = SIZE_MAP[size];
  const idx = TIERS.indexOf(tier);
  const nextTier = idx >= 0 && idx < TIERS.length - 1 ? TIERS[idx + 1] : null;

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <motion.div
        initial={false}
        animate={animated ? { rotate: [0, -2, 2, -1, 1, 0] } : {}}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{ width: px, height: px }}
      >
        <Badge
          size={px}
          glow={size !== "xs" && size !== "sm"}
          showIcon={size !== "xs"}
          {...badgeProps}
        />
      </motion.div>

      {withLabel && (
        <div className="text-center">
          <div
            className={cn(
              "font-condensed tracking-widest",
              LABEL_SIZE_MAP[size],
            )}
            style={{
              color: TIER_COLORS[tier],
              textShadow: `0 0 20px ${TIER_COLORS_2[tier]}66`,
            }}
          >
            {tier.toUpperCase()}
          </div>
          {withSublabel && nextTier && (
            <div className="text-[10px] text-[var(--color-fg-muted)] mt-0.5">
              siguiente: {nextTier}
            </div>
          )}
        </div>
      )}

      {progress && (
        <div className="w-full max-w-[180px] space-y-1">
          <div className="flex justify-between text-[10px] text-[var(--color-fg-muted)]">
            <span>
              {progress.current} / {progress.needed}
            </span>
            <span>{Math.round((progress.current / progress.needed) * 100)}%</span>
          </div>
          <Progress
            value={(progress.current / progress.needed) * 100}
            className="h-1.5"
            indicatorClassName="bg-gradient-to-r from-[var(--color-brand-500)] to-[var(--color-brand-300)]"
          />
        </div>
      )}
    </div>
  );
}

export { TIERS, TIER_COLORS };
