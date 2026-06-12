"use client";

import { motion } from "motion/react";
import { springFast } from "@/lib/motionTokens";
import { cn } from "@/lib/utils";

export interface AnimatedTab<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

interface AnimatedTabsProps<T extends string> {
  tabs: AnimatedTab<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Único por instancia (motion layoutId) */
  layoutId: string;
  /** Fila scrollable con fade en bordes (filtros largos) */
  scrollable?: boolean;
  className?: string;
}

/** Segmented control con indicador de píldora animado */
export function AnimatedTabs<T extends string>({
  tabs,
  value,
  onChange,
  layoutId,
  scrollable = false,
  className,
}: AnimatedTabsProps<T>) {
  return (
    <div
      role="tablist"
      className={cn(
        "flex gap-1 rounded-xl bg-surface-1 p-1",
        scrollable
          ? "scroll-fade-x w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          : "w-fit",
        className,
      )}
    >
      {tabs.map((t) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.value)}
            className={cn(
              "relative flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3.5 text-sm font-medium whitespace-nowrap transition-colors",
              active ? "text-fg" : "text-fg-muted hover:text-fg",
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-lg bg-surface-3 shadow-[inset_0_1px_0_0_oklch(1_0_0/0.06)]"
                transition={springFast}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {t.icon}
              {t.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
