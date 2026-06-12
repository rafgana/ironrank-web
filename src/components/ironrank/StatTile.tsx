import { NumberTicker } from "@/components/magicui/number-ticker";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatTileProps {
  icon: LucideIcon;
  label: string;
  value?: number;
  valueStr?: string;
  suffix?: string;
  /** Color CSS del acento; por defecto el tier ambiental */
  accent?: string;
  decimalPlaces?: number;
  className?: string;
}

/** Tile de estadística unificado (antes había 3 StatCard duplicados) */
export function StatTile({
  icon: Icon,
  label,
  value,
  valueStr,
  suffix,
  accent = "var(--tier)",
  decimalPlaces = 0,
  className,
}: StatTileProps) {
  return (
    <div
      className={cn(
        "card p-4 md:p-5 transition-[transform,box-shadow] duration-200 md:hover:-translate-y-0.5 md:hover:shadow-(--shadow-card-hover)",
        className,
      )}
    >
      <div
        className="mb-3 flex size-9 items-center justify-center rounded-lg"
        style={{
          background: `color-mix(in oklab, ${accent} 12%, transparent)`,
          color: accent,
        }}
      >
        <Icon size={18} />
      </div>
      {valueStr !== undefined ? (
        <div
          className="font-display text-2xl font-bold tracking-tight"
          style={{ color: accent }}
        >
          {valueStr}
        </div>
      ) : (
        <div className="font-display text-3xl font-bold tracking-tight tabular-nums">
          <NumberTicker value={value ?? 0} decimalPlaces={decimalPlaces} />
          {suffix && (
            <span className="ml-1 text-sm font-normal text-fg-muted">
              {suffix}
            </span>
          )}
        </div>
      )}
      <div className="mt-1 text-sm text-fg-muted">{label}</div>
    </div>
  );
}
