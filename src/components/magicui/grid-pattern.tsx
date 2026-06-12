"use client";

import { cn } from "@/lib/utils";

interface GridPatternProps {
  width?: number;
  height?: number;
  squares?: Array<[number, number]>;
  className?: string;
}

export function GridPattern({
  width = 40,
  height = 40,
  squares,
  className,
}: GridPatternProps) {
  return (
    <svg
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full",
        className,
      )}
    >
      <defs>
        <pattern
          id="grid-pattern"
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M ${width} 0 L 0 0 0 ${height}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-[var(--color-fg-dim)] opacity-30"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid-pattern)" />
      {squares && (
        <svg x="0" y="0" width="100%" height="100%">
          {squares.map(([col, row]) => (
            <rect
              key={`${col}-${row}`}
              x={col * width + 1}
              y={row * height + 1}
              width={width - 2}
              height={height - 2}
              fill="currentColor"
              className="text-[var(--color-brand-500)] opacity-40"
            />
          ))}
        </svg>
      )}
    </svg>
  );
}
