"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip } from "./charts/ChartTooltip";
import { AXIS_TICK, GRID_STROKE } from "./charts/chartTheme";

interface OneRMPoint {
  date: string;
  [exercise: string]: number | string;
}

export function OneRMChart({
  data,
  exercise,
}: {
  data: OneRMPoint[];
  exercise: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="rmLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--tier-deep)" />
            <stop offset="100%" stopColor="var(--tier)" />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="date"
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => {
            const d = new Date(v);
            return `${d.getDate()}/${d.getMonth() + 1}`;
          }}
        />
        <YAxis
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          domain={["dataMin - 5", "dataMax + 5"]}
        />
        <Tooltip
          content={
            <ChartTooltip
              formatter={(v) => `${v} kg`}
            />
          }
        />
        <Line
          type="monotone"
          dataKey={exercise}
          stroke="url(#rmLine)"
          strokeWidth={3}
          dot={{ fill: "var(--tier)", r: 4, strokeWidth: 0 }}
          activeDot={{
            r: 6,
            fill: "var(--tier)",
            strokeWidth: 2,
            stroke: "var(--color-surface-0)",
          }}
          isAnimationActive
          animationDuration={1500}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
