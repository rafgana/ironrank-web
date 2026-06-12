"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { ChartTooltip } from "./charts/ChartTooltip";
import { AXIS_TICK, GRID_STROKE } from "./charts/chartTheme";

interface MusclePoint {
  muscle: string;
  volume: number;
}

export function MuscleRadar({ data }: { data: MusclePoint[] }) {
  if (!data.length) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-fg-dim">
        Sin datos suficientes
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={320}>
      <RadarChart data={data}>
        <PolarGrid stroke={GRID_STROKE} />
        <PolarAngleAxis
          dataKey="muscle"
          tick={{ ...AXIS_TICK, fill: "var(--color-fg-muted)" }}
          tickLine={false}
        />
        <PolarRadiusAxis
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          angle={30}
        />
        <Tooltip
          content={
            <ChartTooltip
              formatter={(v) => `${Number(v).toLocaleString("es-ES")} kg`}
            />
          }
        />
        <Radar
          dataKey="volume"
          name="Volumen"
          stroke="var(--tier)"
          fill="var(--tier)"
          fillOpacity={0.3}
          isAnimationActive
          animationDuration={1500}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
