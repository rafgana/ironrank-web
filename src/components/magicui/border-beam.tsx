"use client";

import { cn } from "@/lib/utils";

interface BorderBeamProps {
  className?: string;
  size?: number;
  duration?: number;
  delay?: number;
  colorFrom?: string;
  colorTo?: string;
  borderWidth?: number;
  reverse?: boolean;
}

export function BorderBeam({
  className,
  size = 120,
  duration = 8,
  delay = 0,
  colorFrom = "#ffaa40",
  colorTo = "#9c40ff",
  borderWidth = 1.5,
  reverse = false,
}: BorderBeamProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit]",
        className,
      )}
      style={
        {
          "--beam-size": `${size}%`,
          "--beam-duration": `${duration}s`,
          "--beam-delay": `${delay}s`,
          "--beam-color-from": colorFrom,
          "--beam-color-to": colorTo,
          "--beam-border-width": `${borderWidth}px`,
        } as React.CSSProperties
      }
    >
      <div
        className={cn(
          "absolute inset-[0]",
          "rounded-[inherit]",
          "[mask:linear-gradient(white,white)_content-box,linear-gradient(white,white)]",
          "[-webkit-mask-composite:xor]",
          "[mask-composite:exclude]",
          "p-[var(--beam-border-width)]",
        )}
      >
        <div
          className={cn(
            "absolute inset-0",
            "rounded-[inherit]",
            "bg-[conic-gradient(from_calc(45deg*var(--beam-angle,0)),var(--beam-color-from)_0deg,transparent_60deg,transparent_300deg,var(--beam-color-to)_360deg)]",
            "opacity-60",
          )}
          style={{
            animation: `border-beam-spin var(--beam-duration) linear infinite ${reverse ? "reverse" : ""}`,
            animationDelay: `var(--beam-delay)`,
          }}
        />
      </div>
      <style>{`
        @property --beam-angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }
        @keyframes border-beam-spin {
          to { --beam-angle: 360deg; }
        }
      `}</style>
    </div>
  );
}
