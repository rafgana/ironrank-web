"use client";

import { motion } from "motion/react";
import { TIERS, TIER_VARS, tierAlpha, type Tier } from "@/models/types";
import { TIER_BADGES } from "./tier-badges";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { cn } from "@/lib/utils";
import { Check, Lock } from "lucide-react";

interface TierProgressionProps {
  currentTier: Tier;
  onTierClick?: (tier: Tier) => void;
  /** vertical = escalera (Retador arriba), para el rail de desktop */
  orientation?: "horizontal" | "vertical";
  className?: string;
}

export function TierProgression({
  currentTier,
  onTierClick,
  orientation = "horizontal",
  className,
}: TierProgressionProps) {
  const currentIdx = TIERS.indexOf(currentTier);
  /* Hexágonos más pequeños en pantallas estrechas: 7 badges fijos no caben en 360px */
  const wide = useIsDesktop(480);

  if (orientation === "vertical") {
    const ladder = [...TIERS].reverse();
    return (
      <div className={cn("relative", className)}>
        {/* Conector que se rellena hasta el tier actual */}
        <div className="absolute inset-y-3 left-[23px] w-0.5 rounded-full bg-surface-2">
          <motion.div
            className="absolute bottom-0 w-full rounded-full"
            style={{
              background: `linear-gradient(0deg, ${TIER_VARS.Bronce}, ${TIER_VARS[currentTier]})`,
              boxShadow: `0 0 8px ${tierAlpha(currentTier, 40)}`,
            }}
            initial={{ height: 0 }}
            animate={{ height: `${(currentIdx / (TIERS.length - 1)) * 100}%` }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </div>
        <ul className="relative space-y-1.5">
          {ladder.map((tier) => {
            const idx = TIERS.indexOf(tier);
            const status =
              idx < currentIdx
                ? "past"
                : idx === currentIdx
                  ? "current"
                  : "future";
            return (
              <li key={tier}>
                <button
                  onClick={() => onTierClick?.(tier)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-1 py-1 transition-colors",
                    status === "current" && "bg-(--tier-softer)",
                  )}
                >
                  <TierNode tier={tier} status={status} size={48} />
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      status === "current"
                        ? "text-base"
                        : status === "past"
                          ? "text-fg-muted"
                          : "text-fg-dim",
                    )}
                    style={
                      status === "current"
                        ? { color: TIER_VARS[tier] }
                        : undefined
                    }
                  >
                    {tier}
                  </span>
                  {status === "current" && (
                    <span className="eyebrow ml-auto text-(--tier)">Tú</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between gap-1 md:gap-2">
        {TIERS.map((tier, idx) => {
          const status =
            idx < currentIdx
              ? "past"
              : idx === currentIdx
                ? "current"
                : "future";
          const isCurrent = status === "current";
          return (
            <button
              key={tier}
              onClick={() => onTierClick?.(tier)}
              className="group flex min-w-0 flex-1 flex-col items-center gap-1.5 md:gap-2"
              title={tier}
            >
              <TierNode
                tier={tier}
                status={status}
                size={isCurrent ? (wide ? 64 : 44) : wide ? 48 : 30}
              />
              <div
                className={cn(
                  "eyebrow w-full text-center !text-[9px] md:!text-[11px] transition-colors hidden sm:block",
                  status === "future" && "sm:hidden",
                )}
                style={
                  isCurrent ? { color: TIER_VARS[tier] } : undefined
                }
              >
                {tier}
              </div>
            </button>
          );
        })}
      </div>
      <div className="mt-3 h-0.5 overflow-hidden rounded-full bg-surface-2 md:mt-4">
        <motion.div
          className="h-full"
          style={{
            background: `linear-gradient(90deg, ${TIER_VARS.Bronce}, ${TIER_VARS[currentTier]})`,
            boxShadow: `0 0 12px ${tierAlpha(currentTier, 40)}`,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${(currentIdx / (TIERS.length - 1)) * 100}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function TierNode({
  tier,
  status,
  size,
}: {
  tier: Tier;
  status: "past" | "current" | "future";
  size: number;
}) {
  const Badge = TIER_BADGES[tier];
  const isCurrent = status === "current";
  const isPast = status === "past";
  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      data-tier={tier.toLowerCase()}
    >
      {isCurrent && (
        <motion.div
          className="absolute inset-0 rounded-full tier-glow"
          style={{ background: `radial-gradient(circle, var(--tier-soft), transparent 70%)` }}
          animate={{ scale: [1, 1.5, 1], opacity: [0.7, 0.2, 0.7] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      <div
        className={cn(
          "relative transition-transform",
          isCurrent && "scale-110",
          isPast && "opacity-60 saturate-50",
          status === "future" && "opacity-40 saturate-30",
        )}
      >
        <Badge size={size} showIcon glow={isCurrent} />
        {isPast && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Check size={size * 0.36} className="text-white drop-shadow-[0_0_4px_rgba(0,0,0,0.8)]" strokeWidth={3.5} />
          </div>
        )}
        {status === "future" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Lock size={size * 0.28} className="text-fg-dim drop-shadow-[0_0_4px_rgba(0,0,0,0.8)]" strokeWidth={2.5} />
          </div>
        )}
      </div>
    </div>
  );
}
