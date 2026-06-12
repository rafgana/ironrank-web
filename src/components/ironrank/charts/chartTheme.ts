// Constantes de estilo compartidas por todos los charts de Recharts.
// IMPORTANTE: este módulo NO debe importar recharts — los charts se cargan
// lazy y un import aquí rompería el code-splitting.

export const AXIS_TICK = {
  fill: "var(--color-fg-dim)",
  fontSize: 11,
  fontFamily: "var(--font-sans)",
} as const;

/** Grid horizontal sutil; nunca usar grid vertical */
export const GRID_STROKE = "color-mix(in oklab, white 5%, transparent)";

export const CURSOR_FILL = "var(--tier-softer)";

export const TIER_STROKE = "var(--tier)";
export const TIER_FILL_SOFT = "var(--tier-soft)";

export const CHART_MARGIN = { top: 8, right: 8, bottom: 0, left: -16 } as const;
