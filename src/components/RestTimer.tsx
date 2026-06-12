"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, Pause, RotateCcw, Plus, X, Timer as TimerIcon } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";

interface RestTimerProps {
  startTime: number;
  duration: number;
  onComplete: () => void;
  onSkip: () => void;
  onAddTime?: (seconds: number) => void;
}

export function RestTimer({
  startTime,
  duration,
  onComplete,
  onSkip,
  onAddTime,
}: RestTimerProps) {
  const [time, setTime] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (startTime <= 0) return;
    setTime(0);
    setPaused(false);
  }, [startTime]);

  useEffect(() => {
    if (startTime <= 0 || paused) return;
    const interval = window.setInterval(() => {
      setTime((t) => {
        const next = t + 1;
        if (next >= duration) {
          clearInterval(interval);
          onComplete();
          return duration;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, paused, duration, onComplete]);

  const remaining = Math.max(0, duration - time);
  const mm = Math.floor(remaining / 60);
  const ss = remaining % 60;
  const progress = duration > 0 ? time / duration : 0;
  const isDone = remaining === 0 && duration > 0;
  const isFinal = !isDone && remaining <= 5;

  const radius = 110;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <AnimatePresence>
      <motion.div
        key="rest-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
      >
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 280, damping: 22 }}
          className={cn(
            "card bg-noise relative w-full max-w-sm p-6 md:p-8",
            isDone &&
              "border-tier-esmeralda shadow-[0_0_40px_color-mix(in_oklab,var(--color-tier-esmeralda)_50%,transparent)]",
          )}
        >
          <button
            onClick={onSkip}
            className="tap-target absolute top-1 right-1 flex items-center justify-center rounded-md text-fg-muted hover:bg-surface-2"
            aria-label="Saltar descanso"
          >
            <X size={18} />
          </button>

          <div className="mb-2 text-center">
            <div className="eyebrow inline-flex items-center gap-1.5">
              <TimerIcon size={11} />
              Descanso
            </div>
          </div>

          <div className="relative mx-auto my-2 h-60 w-60">
            <svg width="240" height="240" className="absolute inset-0 -rotate-90">
              <defs>
                <linearGradient
                  id="timer-gradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop
                    offset="0%"
                    stopColor={
                      isDone ? "var(--color-tier-esmeralda)" : "var(--tier-deep)"
                    }
                  />
                  <stop
                    offset="100%"
                    stopColor={
                      isDone ? "var(--color-tier-esmeralda)" : "var(--tier)"
                    }
                  />
                </linearGradient>
              </defs>
              <circle
                cx="120"
                cy="120"
                r={radius}
                fill="none"
                stroke="var(--color-surface-2)"
                strokeWidth="10"
              />
              <motion.circle
                cx="120"
                cy="120"
                r={radius}
                fill="none"
                stroke="url(#timer-gradient)"
                strokeWidth="10"
                strokeLinecap="round"
                style={{
                  strokeDasharray: circumference,
                  filter: `drop-shadow(0 0 8px ${
                    isDone
                      ? "color-mix(in oklab, var(--color-tier-esmeralda) 60%, transparent)"
                      : "var(--tier-glow)"
                  })`,
                }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1, ease: "linear" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.div
                className={cn(
                  "font-mono text-6xl leading-none font-bold tabular-nums",
                  isDone ? "text-tier-esmeralda" : "text-fg",
                )}
                animate={isFinal ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                transition={
                  isFinal ? { duration: 1, repeat: Infinity } : undefined
                }
              >
                {mm}:{String(ss).padStart(2, "0")}
              </motion.div>
              <div className="eyebrow mt-2">
                {isDone ? "¡Descanso completado!" : "Restante"}
              </div>
              {isDone && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="mt-2 text-xs font-semibold text-tier-esmeralda"
                >
                  Siguiente serie →
                </motion.div>
              )}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => setPaused((v) => !v)}
            >
              {paused ? <Play size={14} /> : <Pause size={14} />}
              {paused ? "Reanudar" : "Pausar"}
            </Button>
            {onAddTime && (
              <Button variant="outline" size="md" onClick={() => onAddTime(30)}>
                <Plus size={14} /> 30s
              </Button>
            )}
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                setTime(0);
                setPaused(false);
              }}
            >
              <RotateCcw size={14} />
              Reset
            </Button>
          </div>

          <div className="mt-3 text-center">
            <Button variant="ghost" size="md" onClick={onSkip} className="w-full">
              Saltar descanso
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
