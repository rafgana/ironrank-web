interface TooltipEntry {
  name?: string;
  value?: number | string;
  color?: string;
  unit?: string;
}

interface ChartTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: TooltipEntry[];
  /** Formatea el valor (p.ej. añadir "kg") */
  formatter?: (value: number | string, name?: string) => string;
}

/** Tooltip unificado para Recharts: content={<ChartTooltip />} */
export function ChartTooltip({
  active,
  label,
  payload,
  formatter,
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card min-w-28 px-3 py-2 text-sm shadow-lg">
      {label !== undefined && (
        <div className="mb-1 text-xs text-fg-muted">{label}</div>
      )}
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 text-fg-muted">
            <span
              className="size-2 rounded-full"
              style={{ background: entry.color ?? "var(--tier)" }}
            />
            {entry.name}
          </span>
          <span className="font-mono font-semibold tabular-nums">
            {formatter
              ? formatter(entry.value ?? "", entry.name)
              : `${entry.value}${entry.unit ?? ""}`}
          </span>
        </div>
      ))}
    </div>
  );
}
