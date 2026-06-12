"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import type { Tier } from "@/models/types";
import { TIERS, TIER_VARS } from "@/models/types";
import { ChartTooltip } from "./charts/ChartTooltip";
import { AXIS_TICK } from "./charts/chartTheme";

interface BellCurveProps {
  currentTier: Tier;
  userPosition: number;
  className?: string;
}

export function BellCurve({
  currentTier,
  userPosition,
  className,
}: BellCurveProps) {
  const data = useMemo(() => {
    const points: { x: number; y: number; tier?: string; isUser?: boolean }[] =
      [];
    const tierCount = TIERS.length;
    const tierWidth = 100 / tierCount;
    for (let i = 0; i <= 200; i++) {
      const x = (i / 200) * 100;
      const tierIdx = Math.min(
        tierCount - 1,
        Math.max(0, Math.floor(x / tierWidth)),
      );
      const mean = 50;
      const stdDev = 16;
      const y =
        100 *
        Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2)) /
        Math.exp(0);
      points.push({
        x: Math.round(x * 10) / 10,
        y: Math.round(y * 100) / 100,
        tier: TIERS[tierIdx],
        isUser: Math.abs(x - userPosition) < 1.5,
      });
    }
    return points;
  }, [userPosition]);

  const currentIdx = TIERS.indexOf(currentTier);
  const userX = ((currentIdx + 0.5) / TIERS.length) * 100;

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart
          data={data}
          margin={{ top: 20, right: 10, left: 10, bottom: 0 }}
        >
          <defs>
            <linearGradient id="bellFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={TIER_VARS[currentTier]} stopOpacity={0.6} />
              <stop offset="100%" stopColor={TIER_VARS[currentTier]} stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="bellFillPast" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#10B981" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="x"
            type="number"
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tickFormatter={(v) => {
              const idx = Math.min(
                TIERS.length - 1,
                Math.max(0, Math.floor((v / 100) * TIERS.length)),
              );
              return TIERS[idx].slice(0, 4);
            }}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
          />
          <YAxis hide domain={[0, "dataMax + 10"]} />
          <Tooltip
            cursor={{ stroke: TIER_VARS[currentTier], strokeWidth: 1, strokeDasharray: "3 3" }}
            content={<ChartTooltip formatter={(v) => Number(v).toFixed(1)} />}
          />
          <Area
            type="monotone"
            dataKey="y"
            stroke={TIER_VARS[currentTier]}
            strokeWidth={2}
            fill="url(#bellFill)"
            isAnimationActive={true}
            animationDuration={1200}
          />
          <ReferenceLine
            x={userX}
            stroke={TIER_VARS[currentTier]}
            strokeWidth={2}
            strokeDasharray="4 4"
            label={{
              value: "TÚ",
              position: "top",
              fill: TIER_VARS[currentTier],
              fontSize: 10,
              fontWeight: "bold",
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="eyebrow mt-1 flex justify-between px-2 !text-[11px] !text-fg-dim">
        {TIERS.map((t) => (
          <span key={t} style={{ color: t === currentTier ? TIER_VARS[currentTier] : undefined }}>
            {t.slice(0, 4).toUpperCase()}
          </span>
        ))}
      </div>
    </div>
  );
}
