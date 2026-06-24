"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Ruler,
  Plus,
  Trash2,
  Scale,
  TrendingDown,
  TrendingUp,
  Minus,
  X,
  Check,
} from "lucide-react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  AXIS_TICK,
  CURSOR_FILL,
  GRID_STROKE,
} from "./charts/chartTheme";
import { useBodyMeasurementsStore } from "../../store/bodyMeasurementsStore";
import type { BodyMeasurement } from "../../models/types";
import { springFast } from "../../lib/motionTokens";
import { cn } from "../../lib/utils";

type MetricKey = "bodyweight" | "bodyFatPct" | "waistCm" | "chestCm" | "armCm" | "thighCm";

const METRIC_LABELS: Record<MetricKey, { label: string; unit: string; placeholder: string }> = {
  bodyweight: { label: "Peso", unit: "kg", placeholder: "75.5" },
  bodyFatPct: { label: "Grasa", unit: "%", placeholder: "15.0" },
  waistCm: { label: "Cintura", unit: "cm", placeholder: "82" },
  chestCm: { label: "Pecho", unit: "cm", placeholder: "100" },
  armCm: { label: "Brazo", unit: "cm", placeholder: "38" },
  thighCm: { label: "Muslo", unit: "cm", placeholder: "58" },
};

function formatDate(d: Date): string {
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

function Delta({ current, previous, unit }: { current: number; previous: number; unit: string }) {
  if (!current || !previous) return <span className="text-fg-dim text-xs font-mono">—</span>;
  const diff = current - previous;
  const abs = Math.abs(diff);
  const Icon = diff > 0.05 ? TrendingUp : diff < -0.05 ? TrendingDown : Minus;
  const color =
    diff > 0.05 ? "text-orange-400" : diff < -0.05 ? "text-emerald-400" : "text-fg-dim";
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-xs font-mono", color)}>
      <Icon size={11} />
      {abs.toFixed(1)} {unit}
    </span>
  );
}

function MeasurementsChart({ data, metric }: { data: BodyMeasurement[]; metric: MetricKey }) {
  const chartData = data
    .slice()
    .reverse()
    .filter((m) => m[metric] > 0)
    .map((m) => ({
      date: formatDate(new Date(m.date)),
      value: m[metric],
    }));

  if (chartData.length < 2) {
    return (
      <div className="h-40 flex items-center justify-center text-fg-dim text-sm font-mono">
        Mínimo 2 medidas para ver gráfico
      </div>
    );
  }

  const { unit } = METRIC_LABELS[metric];
  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="date" tick={AXIS_TICK} tickLine={false} axisLine={false} />
        <YAxis
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          domain={["dataMin - 1", "dataMax + 1"]}
        />
        <Tooltip
          cursor={{ fill: CURSOR_FILL }}
          contentStyle={{
            background: "var(--surface-1, #141416)",
            border: "1px solid var(--border-subtle, #1f1f22)",
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(v) => [`${Number(v).toFixed(1)} ${unit}`, METRIC_LABELS[metric].label]}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#ff5b3d"
          strokeWidth={2}
          dot={{ r: 3, fill: "#ff5b3d" }}
          isAnimationActive
          animationDuration={800}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function BodyMeasurementsSection() {
  const { measurements, loading, loadMeasurements, addMeasurement, deleteMeasurement } =
    useBodyMeasurementsStore();
  const [showForm, setShowForm] = useState(false);
  const [activeMetric, setActiveMetric] = useState<MetricKey>("bodyweight");

  useEffect(() => {
    loadMeasurements();
  }, [loadMeasurements]);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const parse = (k: string) => {
      const v = form.get(k);
      if (!v) return 0;
      const n = parseFloat(String(v));
      return Number.isFinite(n) && n > 0 ? n : 0;
    };
    await addMeasurement({
      date: new Date(),
      bodyweight: parse("bodyweight"),
      bodyFatPct: parse("bodyFatPct"),
      waistCm: parse("waistCm"),
      chestCm: parse("chestCm"),
      armCm: parse("armCm"),
      thighCm: parse("thighCm"),
    });
    setShowForm(false);
  };

  const latest = measurements[0];
  const previous = measurements[1];

  return (
    <section className="card space-y-4 p-5">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Ruler size={18} className="text-fg-muted" strokeWidth={2.2} />
          <h2 className="text-base font-semibold text-fg">Medidas corporales</h2>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="tap-target inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-sm font-medium bg-surface-2 text-fg hover:bg-surface-3 border border-border-subtle transition-colors"
          aria-label={showForm ? "Cancelar" : "Añadir medida"}
          aria-expanded={showForm}
        >
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? "Cancelar" : "Añadir"}
        </button>
      </header>

      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={springFast}
            onSubmit={handleAdd}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2">
              {(Object.keys(METRIC_LABELS) as MetricKey[]).map((k) => {
                const { label, unit, placeholder } = METRIC_LABELS[k];
                return (
                  <label key={k} className="space-y-1.5">
                    <span className="text-xs font-mono text-fg-muted uppercase tracking-wider">
                      {label} ({unit})
                    </span>
                    <input
                      name={k}
                      type="number"
                      step="0.1"
                      inputMode="decimal"
                      placeholder={placeholder}
                      className="w-full h-9 px-3 rounded-lg bg-surface-2 border border-border-subtle text-fg text-sm font-mono placeholder:text-fg-dim focus:border-border-strong focus:outline-none transition-colors"
                    />
                  </label>
                );
              })}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="tap-target h-9 px-4 rounded-lg text-sm text-fg-muted hover:text-fg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="tap-target inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-semibold text-(length:--tier-contrast) glow-tier"
                style={{ background: "var(--tier-gradient)" }}
              >
                <Check size={14} strokeWidth={2.5} />
                Guardar
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {loading && measurements.length === 0 ? (
        <p className="text-fg-dim text-sm font-mono text-center py-6">Cargando…</p>
      ) : measurements.length === 0 ? (
        <div className="text-center py-8 space-y-2">
          <Scale size={28} className="mx-auto text-fg-dim" strokeWidth={1.5} />
          <p className="text-fg-muted text-sm">Sin medidas aún</p>
          <p className="text-fg-dim text-xs font-mono">
            Apunta peso, grasa y perímetros para ver tu progreso
          </p>
        </div>
      ) : (
        <>
          {/* Latest snapshot */}
          {latest && (
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2.5">
              {(Object.keys(METRIC_LABELS) as MetricKey[]).map((k) => {
                const { label, unit } = METRIC_LABELS[k];
                const current = latest[k];
                if (!current) return null;
                return (
                  <div key={k} className="bg-surface-1 rounded-lg p-2.5 space-y-0.5">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-fg-dim">
                      {label}
                    </div>
                    <div className="text-base font-semibold text-fg tabular-nums">
                      {current.toFixed(1)}
                      <span className="text-xs text-fg-dim ml-0.5">{unit}</span>
                    </div>
                    {previous && <Delta current={current} previous={previous[k]} unit={unit} />}
                  </div>
                );
              })}
            </div>
          )}

          {/* Metric tabs */}
          {measurements.length >= 2 && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(METRIC_LABELS) as MetricKey[]).map((k) => {
                  const { label } = METRIC_LABELS[k];
                  const has = measurements.some((m) => m[k] > 0);
                  if (!has) return null;
                  return (
                    <button
                      key={k}
                      onClick={() => setActiveMetric(k)}
                      className={cn(
                        "px-3 h-7 rounded-full text-xs font-medium transition-colors",
                        activeMetric === k
                          ? "bg-tier-soft text-fg border border-border-strong"
                          : "bg-surface-2 text-fg-muted hover:text-fg border border-border-subtle",
                      )}
                      style={
                        activeMetric === k
                          ? {
                              background: "var(--tier-soft)",
                              borderColor: "var(--tier-border)",
                            }
                          : undefined
                      }
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <MeasurementsChart data={measurements} metric={activeMetric} />
            </div>
          )}

          {/* History */}
          {measurements.length > 1 && (
            <details className="text-sm">
              <summary className="cursor-pointer text-fg-muted hover:text-fg transition-colors font-mono text-xs uppercase tracking-wider">
                Historial ({measurements.length})
              </summary>
              <ul className="mt-3 space-y-1.5">
                {measurements.slice(0, 10).map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-surface-1 hover:bg-surface-2 transition-colors"
                  >
                    <time className="text-xs font-mono text-fg-muted">
                      {new Date(m.date).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "short",
                        year: "2-digit",
                      })}
                    </time>
                    <div className="flex items-center gap-3 text-xs font-mono tabular-nums">
                      {m.bodyweight > 0 && (
                        <span className="text-fg">{m.bodyweight.toFixed(1)}kg</span>
                      )}
                      {m.bodyFatPct > 0 && (
                        <span className="text-fg-muted">{m.bodyFatPct.toFixed(1)}%</span>
                      )}
                      {m.waistCm > 0 && <span className="text-fg-dim">{m.waistCm}c</span>}
                    </div>
                    <button
                      onClick={() => m.id && deleteMeasurement(m.id)}
                      className="tap-target p-1 rounded text-fg-dim hover:text-red-400 transition-colors"
                      aria-label="Borrar medida"
                    >
                      <Trash2 size={12} />
                    </button>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}
    </section>
  );
}
