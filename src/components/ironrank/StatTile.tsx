import { NumberTicker } from "@/components/magicui/number-ticker";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatTileProps {
  icon: LucideIcon;
  label: string;
  value?: number;
  valueStr?: string;
  suffix?: string;
  hint?: string;
  /** Color CSS del acento; por defecto el tier ambiental */
  accent?: string;
  decimalPlaces?: number;
  className?: string;
}

/** Tile de estadística — look cyber HUD con grid lines y micro-detalles técnicos */
export function StatTile({
  icon: Icon,
  label,
  value,
  valueStr,
  suffix,
  hint,
  accent = "var(--tier)",
  decimalPlaces = 0,
  className,
}: StatTileProps) {
  return (
    <div
      className={cn(
        "card card-hover relative p-4 md:p-5 overflow-hidden",
        className,
      )}
    >
      {/* Esquina HUD con tick marks */}
      <span
        aria-hidden
        className="absolute top-2 right-2 h-3 w-3 border-t border-r"
        style={{ borderColor: "var(--tier-border)" }}
      />
      <span
        aria-hidden
        className="absolute bottom-2 left-2 h-3 w-3 border-b border-l"
        style={{ borderColor: "var(--tier-border)" }}
      />

      <div className="flex items-start justify-between gap-2 mb-3">
        <div
          className="flex size-9 items-center justify-center rounded-md"
          style={{
            background: `color-mix(in oklab, ${accent} 14%, transparent)`,
            color: accent,
            boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${accent} 30%, transparent)`,
          }}
        >
          <Icon size={17} strokeWidth={2.4} />
        </div>
        <div
          className="font-mono text-[9px] uppercase tracking-[0.18em]"
          style={{ color: "var(--color-fg-dim)" }}
        >
          ID·{label.slice(0, 3).toUpperCase()}
        </div>
      </div>

      {valueStr !== undefined ? (
        <div
          className="display text-[2rem] leading-none tabular-nums"
          style={{ color: accent, textShadow: `0 0 24px color-mix(in oklab, ${accent} 35%, transparent)` }}
        >
          {valueStr}
        </div>
      ) : (
        <div
          className="display text-[2.5rem] leading-none tabular-nums"
          style={{ color: accent, textShadow: `0 0 24px color-mix(in oklab, ${accent} 35%, transparent)` }}
        >
          <NumberTicker value={value ?? 0} decimalPlaces={decimalPlaces} />
          {suffix && (
            <span
              className="ml-1.5 align-top text-[0.875rem] font-mono font-medium tracking-wider"
              style={{ color: "var(--color-fg-muted)" }}
            >
              {suffix}
            </span>
          )}
        </div>
      )}

      <div
        className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em]"
        style={{ color: "var(--color-fg-muted)" }}
      >
        {label}
        {hint && (
          <>
            <span className="mx-1.5 opacity-50">·</span>
            <span className="text-fg-dim normal-case tracking-normal">{hint}</span>
          </>
        )}
      </div>
    </div>
  );
}
