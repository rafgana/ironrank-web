"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, Pause, RotateCcw, Plus, X, Timer as TimerIcon } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";

interface RestTimerProps {
  startTime: number;       // Date.now() cuando empezó
  duration: number;        // Duración total en segundos
  onComplete: () => void;
  onSkip: () => void;
  onAddTime?: (seconds: number) => void;
}

/**
 * Pill de descanso flotante — anclada en bottom-center, NO modal.
 * El usuario sigue viendo su workout mientras descansa.
 *
 * IMPORTANTE: el timer se calcula desde `startTime` (timestamp absoluto),
 * no desde un contador incremental. Esto hace que sobreviva a:
 *  - Cierre de pestaña / navegador
 *  - Tab en background (que throttlea setInterval)
 *  - Sleep del sistema
 */
export function RestTimer({
  startTime,
  duration,
  onComplete,
  onSkip,
  onAddTime,
}: RestTimerProps) {
  const [paused, setPaused] = useState(false);
  const [pausedAt, setPausedAt] = useState<number | null>(null);
  const [pausedAccum, setPausedAccum] = useState(0); // ms acumulados en pausa
  const [expanded, setExpanded] = useState(false);
  // Forzar re-render cada 500ms para que el countdown se actualice
  const [, setTick] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  useEffect(() => {
    if (startTime <= 0) return;
    setPaused(false);
    setPausedAt(null);
    setPausedAccum(0);
    completedRef.current = false;
  }, [startTime]);

  // Cuando pausamos/reanudamos, ajustamos el accum
  function togglePause() {
    if (paused) {
      // Reanudar: añadir el tiempo de pausa al accum
      if (pausedAt) {
        setPausedAccum((a) => a + (Date.now() - pausedAt));
        setPausedAt(null);
      }
      setPaused(false);
    } else {
      setPausedAt(Date.now());
      setPaused(true);
    }
  }

  useEffect(() => {
    if (startTime <= 0) return;
    intervalRef.current = setInterval(() => setTick((t) => t + 1), 500);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startTime]);

  // Calcular tiempo restante desde timestamp (no desde state)
  // Si está pausado, congelar el tiempo en el momento de la pausa
  const effectiveNow = paused && pausedAt
    ? pausedAt - pausedAccum
    : Date.now() - pausedAccum;
  const elapsed = startTime > 0
    ? Math.max(0, Math.floor((effectiveNow - startTime) / 1000))
    : 0;
  const remaining = Math.max(0, duration - elapsed);
  const time = elapsed;

  // Si llegamos al final y no se ha completado todavía, completar
  useEffect(() => {
    if (remaining === 0 && duration > 0 && startTime > 0 && !completedRef.current) {
      completedRef.current = true;
      onComplete();
      // Vibración
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try { navigator.vibrate([200, 100, 200, 100, 400]); } catch {}
      }
      // Sonido
      if (typeof window !== "undefined") {
        try {
          const Ctx = (window.AudioContext || (window as any).webkitAudioContext);
          if (Ctx) {
            const ctx = new Ctx();
            const now = ctx.currentTime;
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.frequency.value = 880;
            o.type = "sine";
            g.gain.setValueAtTime(0, now);
            g.gain.linearRampToValueAtTime(0.2, now + 0.01);
            g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
            o.connect(g).connect(ctx.destination);
            o.start(now);
            o.stop(now + 0.5);
            const o2 = ctx.createOscillator();
            const g2 = ctx.createGain();
            o2.frequency.value = 1320;
            o2.type = "sine";
            g2.gain.setValueAtTime(0, now + 0.2);
            g2.gain.linearRampToValueAtTime(0.15, now + 0.21);
            g2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
            o2.connect(g2).connect(ctx.destination);
            o2.start(now + 0.2);
            o2.stop(now + 0.8);
          }
        } catch {}
      }
      // Notificación del sistema (funciona incluso si la pestaña está en background)
      if ("Notification" in window && Notification.permission === "granted") {
        try {
          new Notification("IronRank · Descanso terminado", {
            body: "Vuelve al workout 💪",
            icon: "/ironrank/favicon.png",
            tag: "rest-timer-done",
            silent: false,
          });
        } catch {}
      }
    }
  }, [remaining, duration, startTime, onComplete]);

  const mm = Math.floor(remaining / 60);
  const ss = remaining % 60;
  const progress = duration > 0 ? time / duration : 0;
  const isDone = remaining === 0 && duration > 0;
  const isFinal = !isDone && remaining <= 5;

  // Tamaño del círculo: pequeño (40) o grande (90) según expandido
  const radius = expanded ? 90 : 40;
  const svgSize = expanded ? 200 : 88;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <AnimatePresence>
      <motion.div
        key="rest-pill"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="fixed bottom-20 right-3 z-40 md:bottom-6 md:right-6"
        role="timer"
        aria-live="polite"
        aria-label={
          isDone
            ? "Descanso completado"
            : `Descanso restante: ${mm} minutos ${ss} segundos`
        }
      >
        <div
          className={cn(
            "card bg-noise relative flex flex-col items-center gap-2",
            isDone && "border-tier-esmeralda tier-glow",
            expanded ? "p-4 md:p-5" : "px-3 py-2",
          )}
        >
          {/* Header: label + tiempo + expand */}
          <div className="flex w-full items-center gap-2.5">
            {/* Mini círculo (colapsado) o grande (expandido) */}
            <div
              className="relative shrink-0"
              style={{ width: expanded ? svgSize : 56, height: expanded ? svgSize : 56 }}
            >
              <svg
                width={expanded ? svgSize : 56}
                height={expanded ? svgSize : 56}
                className="absolute inset-0 -rotate-90"
              >
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
                        isDone
                          ? "var(--color-tier-esmeralda)"
                          : "var(--tier-deep)"
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
                  cx={expanded ? svgSize / 2 : 28}
                  cy={expanded ? svgSize / 2 : 28}
                  r={radius}
                  fill="none"
                  stroke="var(--color-surface-2)"
                  strokeWidth="4"
                />
                <motion.circle
                  cx={expanded ? svgSize / 2 : 28}
                  cy={expanded ? svgSize / 2 : 28}
                  r={radius}
                  fill="none"
                  stroke="url(#timer-gradient)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  style={{
                    strokeDasharray: circumference,
                    filter: `drop-shadow(0 0 6px ${
                      isDone
                        ? "color-mix(in oklab, var(--color-tier-esmeralda) 60%, transparent)"
                        : "var(--tier-glow)"
                    })`,
                  }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1, ease: "linear" }}
                />
              </svg>
              {expanded && (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div
                    className={cn(
                      "font-mono leading-none font-bold tabular-nums",
                      expanded ? "text-4xl" : "text-base",
                      isDone ? "text-tier-esmeralda" : "text-fg",
                    )}
                  >
                    {mm}:{String(ss).padStart(2, "0")}
                  </div>
                </div>
              )}
            </div>

            {/* Texto inline cuando colapsado */}
            {!expanded && (
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <TimerIcon size={11} className="text-fg-dim" />
                  <span className="eyebrow !text-[10px]">Descanso</span>
                </div>
                <div
                  className={cn(
                    "font-mono text-xl font-bold tabular-nums leading-none mt-0.5",
                    isDone && "text-tier-esmeralda",
                    isFinal && !isDone && "animate-pulse",
                  )}
                >
                  {mm}:{String(ss).padStart(2, "0")}
                </div>
                {isDone && (
                  <span className="eyebrow !text-[9px] text-tier-esmeralda mt-0.5">
                    Listo →
                  </span>
                )}
              </div>
            )}

            {/* Expand/collapse toggle */}
            <button
              onClick={() => setExpanded((v) => !v)}
              className={cn(
                "tap-target shrink-0 flex items-center justify-center rounded-md text-fg-muted hover:bg-surface-2",
                expanded ? "self-end" : "self-center",
              )}
              aria-label={expanded ? "Contraer timer" : "Expandir timer"}
            >
              <span className="text-xs">{expanded ? "▾" : "▴"}</span>
            </button>

            {/* Skip (X) — solo cuando expandido */}
            {expanded && (
              <button
                onClick={onSkip}
                className="tap-target shrink-0 flex items-center justify-center rounded-md text-fg-muted hover:bg-surface-2"
                aria-label="Saltar descanso"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Controles expandidos */}
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.2 }}
              className="flex w-full items-center justify-center gap-1.5 pt-1"
            >
              <Button
                variant="outline"
                size="sm"
                onClick={togglePause}
                className="h-8 px-2.5 text-xs"
              >
                {paused ? <Play size={12} /> : <Pause size={12} />}
                {paused ? "Reanudar" : "Pausar"}
              </Button>
              {onAddTime && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAddTime(30)}
                  className="h-8 px-2.5 text-xs"
                >
                  <Plus size={12} /> 30s
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Reset: ajustar el startTime al momento actual
                  // Hack: forzamos re-render con un event
                  completedRef.current = false;
                  setPaused(false);
                  setPausedAt(null);
                  setPausedAccum(0);
                }}
                className="h-8 px-2.5 text-xs"
                aria-label="Reiniciar timer"
              >
                <RotateCcw size={12} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onSkip}
                className="h-8 px-2.5 text-xs"
              >
                Saltar
              </Button>
            </motion.div>
          )}

          {/* Mensaje "listo" cuando termina (solo expandido) */}
          {expanded && isDone && (
            <div className="text-center text-xs font-semibold text-tier-esmeralda">
              ¡Descanso completado! Siguiente serie →
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
