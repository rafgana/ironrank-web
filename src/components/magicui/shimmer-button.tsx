"use client";

import { cn } from "@/lib/utils";
import React from "react";

interface ShimmerButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  background?: string;
  shimmerColor?: string;
}

export function ShimmerButton({
  background = "linear-gradient(110deg, var(--color-brand-500) 45%, var(--color-brand-300) 55%, var(--color-brand-500))",
  className,
  children,
  ...props
}: ShimmerButtonProps) {
  return (
    <button
      className={cn(
        "group relative z-0 flex cursor-pointer items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-lg px-4 text-sm font-semibold transition-transform active:translate-y-px",
        "border border-white/10 [border-radius:var(--radius-button)]",
        className,
      )}
      style={{ background }}
      {...props}
    >
      <span
        className="pointer-events-none absolute inset-0 [border-radius:inherit] bg-[length:300%_300%] bg-[linear-gradient(110deg,transparent_35%,rgba(255,255,255,0.35)_50%,transparent_65%)] animate-[shimmer_2.6s_linear_infinite]"
        aria-hidden
      />
      {children && (
        <span className="relative z-10 flex items-center gap-2">{children}</span>
      )}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </button>
  );
}
