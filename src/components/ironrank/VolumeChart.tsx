"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip } from "./charts/ChartTooltip";
import { AXIS_TICK, CURSOR_FILL, GRID_STROKE } from "./charts/chartTheme";

interface VolumePoint {
  week: string;
  volume: number;
  workouts: number;
}

export function VolumeChart({ data }: { data: VolumePoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        data={data}
        margin={{ top: 10, right: 0, left: -10, bottom: 0 }}
        barCategoryGap="22%"
      >
        <defs>
          <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--tier)" stopOpacity={1} />
            <stop offset="100%" stopColor="var(--tier-deep)" stopOpacity={0.55} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="week"
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => v.slice(5)}
        />
        <YAxis
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip
          cursor={{ fill: CURSOR_FILL }}
          content={
            <ChartTooltip
              formatter={(v) => `${Number(v).toLocaleString("es-ES")} kg`}
            />
          }
        />
        <Bar
          dataKey="volume"
          name="Volumen"
          fill="url(#volGrad)"
          radius={[6, 6, 0, 0]}
          isAnimationActive
          animationDuration={1200}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
