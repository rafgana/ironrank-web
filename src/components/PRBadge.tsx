"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trophy, TrendingUp, Zap, X } from "lucide-react";
import type { PRType } from "../models/types";
import { celebratePR } from "../lib/confetti";
import { Button } from "./ui/button";
import { BorderBeam } from "../components/magicui/border-beam";

interface PRBadgeProps {
  pr: PRType;
  onDismiss: () => void;
}

const TITLES: Record<PRType["kind"], string> = {
  "1rm": "¡NUEVO 1RM!",
  reps: "¡REP PR!",
  volume: "¡VOLUME PR!",
};

const ICONS: Record<PRType["kind"], typeof Trophy> = {
  "1rm": Trophy,
  reps: TrendingUp,
  volume: Zap,
};

export function PRBadge({ pr, onDismiss }: PRBadgeProps) {
  const title = TITLES[pr.kind];
  const Icon = ICONS[pr.kind];
  const detail =
    pr.kind === "1rm"
      ? `${pr.old.toFixed(1)} → ${pr.new.toFixed(1)} kg`
      : pr.kind === "reps"
        ? `${pr.weight}kg · ${pr.old} → ${pr.new} reps`
        : `${pr.old.toFixed(0)} → ${pr.new.toFixed(0)} kg`;

  useEffect(() => {
    celebratePR();
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        key="pr-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{
          background: "rgba(0,0,0,0.85)",
          backdropFilter: "blur(12px)",
        }}
        onClick={onDismiss}
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0, y: 40, rotate: -8 }}
          animate={{ scale: 1, opacity: 1, y: 0, rotate: 0 }}
          exit={{ scale: 0.7, opacity: 0, y: 40 }}
          transition={{ type: "spring", stiffness: 220, damping: 18 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-sm rounded-3xl p-8 text-center overflow-hidden"
          style={{
            background: "var(--color-surface-1)",
            border: "2px solid var(--color-brand-500)",
          }}
        >
          <BorderBeam
            duration={3}
            colorFrom="#FFB36B"
            colorTo="#FF2E63"
            size={150}
          />

          <button
            onClick={onDismiss}
            className="absolute top-3 right-3 p-1.5 rounded-md text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-2)] z-10"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>

          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              delay: 0.2,
              type: "spring",
              stiffness: 200,
              damping: 12,
            }}
            className="size-20 mx-auto rounded-full flex items-center justify-center mb-5 relative"
            style={{
              background:
                "radial-gradient(circle, var(--color-brand-500), var(--color-brand-700))",
              boxShadow: "0 0 40px var(--color-brand-500)",
            }}
          >
            <Icon size={40} strokeWidth={2.5} className="text-black" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-2"
          >
            <div className="text-[10px] font-condensed tracking-widest text-[var(--color-brand-500)]">
              RÉCORD PERSONAL
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight">
              {title}
            </h2>
            <div
              className="font-mono text-2xl md:text-3xl font-bold tabular-nums"
              style={{ color: "var(--color-brand-500)" }}
            >
              {detail}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-8"
          >
            <Button
              onClick={onDismiss}
              className="w-full"
              size="lg"
              variant="default"
            >
              Continuar
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
