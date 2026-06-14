"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Dumbbell,
  TrendingUp,
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { TierEmblem } from "@/components/ironrank/TierEmblem";
import { Logo } from "@/components/ironrank/Logo";
import { BlurFade } from "@/components/magicui/blur-fade";
import { NumberTicker } from "@/components/magicui/number-ticker";
import { springFast, springUI } from "@/lib/motionTokens";
import { useProfileStore } from "../../store/profileStore";
import { TIERS, TIER_VARS, type Tier } from "../../models/types";
import { track } from "../../services/analytics";
import { logAction } from "../../services/actionLog";
import { setOnboardingStatus, db } from "../../db/database";

interface OnboardingData {
  age: number;
  gender: "male" | "female";
  bodyweight: number;
  height: number;
  restTimerDefault: number;
  useKg: boolean;
  goal: "strength" | "muscle" | "general" | "performance";
}

const DEFAULT_DATA: OnboardingData = {
  age: 25,
  gender: "male",
  bodyweight: 75,
  height: 175,
  restTimerDefault: 90,
  useKg: true,
  goal: "general",
};

const GOAL_OPTIONS: {
  value: OnboardingData["goal"];
  label: string;
  desc: string;
  icon: typeof Trophy;
}[] = [
  { value: "strength", label: "Fuerza", desc: "Maximizar 1RM en tus levantamientos", icon: Trophy },
  { value: "muscle", label: "Músculo", desc: "Hipertrofia y volumen", icon: Dumbbell },
  { value: "general", label: "General", desc: "Salud y composición", icon: Sparkles },
  { value: "performance", label: "Rendimiento", desc: "Deporte específico", icon: TrendingUp },
];

interface OnboardingProps {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const profile = useProfileStore();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>(DEFAULT_DATA);
  const [exitX, setExitX] = useState(0);

  useEffect(() => {
    if (profile.profile) {
      setData((d) => ({
        ...d,
        age: profile.profile!.age,
        gender: profile.profile!.gender,
        bodyweight: profile.profile!.bodyweight,
        height: profile.profile!.height,
        restTimerDefault: profile.profile!.restTimerDefault,
        useKg: profile.profile!.useKg,
        goal: profile.profile!.goal ?? d.goal,
      }));
    }
  }, [profile.profile]);

  const steps = [
    { title: "Bienvenido", component: <WelcomeStep /> },
    { title: "Sobre ti", component: <ProfileStep data={data} onChange={setData} /> },
    { title: "Tu objetivo", component: <GoalStep data={data} onChange={setData} /> },
    { title: "Listo", component: <ReadyStep data={data} /> },
  ];

  async function handleFinish() {
    await profile.update({
      age: data.age,
      gender: data.gender,
      bodyweight: data.bodyweight,
      height: data.height,
      restTimerDefault: data.restTimerDefault,
      useKg: data.useKg,
      goal: data.goal,
    });
    await setOnboardingStatus("completed");
    track("onboarding_completed");
    logAction("onboarding_completed", {
      goal: data.goal,
      gender: data.gender,
      bodyweight: data.bodyweight,
    });
    onComplete();
  }

  function handleSkip() {
    setOnboardingStatus("skipped");
    track("onboarding_skipped");
    logAction("onboarding_skipped");
    onComplete();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-surface-0 p-4">
      {/* Radial de marca + textura */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 h-96 w-96 rounded-full bg-[radial-gradient(circle,var(--color-brand-500),transparent)] opacity-20 blur-[60px]" />
        <div className="absolute -right-24 -bottom-24 h-80 w-80 rounded-full bg-[radial-gradient(circle,var(--color-tier-bronce),transparent)] opacity-15 blur-[60px]" />
      </div>

      <button
        onClick={handleSkip}
        className="tap-target absolute top-2 right-2 z-10 flex items-center justify-center rounded-full text-fg-muted hover:bg-surface-2"
        aria-label="Saltar onboarding"
      >
        <X size={18} />
      </button>

      <div className="relative w-full max-w-md">
        {/* Indicador de pasos con dot deslizante */}
        <div className="mb-6 flex items-center gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className="relative h-1 flex-1 overflow-hidden rounded-full bg-surface-2"
            >
              {i <= step && (
                <motion.div
                  layoutId={i === step ? "onboarding-dot" : undefined}
                  initial={false}
                  animate={{ width: "100%" }}
                  transition={springFast}
                  className="absolute inset-y-0 left-0 rounded-full bg-brand-500"
                  style={{ width: "100%" }}
                />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait" custom={exitX}>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: exitX * 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: exitX * -24 }}
            transition={springUI}
          >
            <div className="card bg-noise flex min-h-[420px] flex-col p-6 md:p-8">
              <div className="eyebrow mb-1">
                Paso {step + 1} de {steps.length}
              </div>
              <h2 className="font-display mb-1 text-h2 font-bold">
                {steps[step].title}
              </h2>
              <div className="mb-6 text-xs text-fg-muted">
                {step === 0 && "Vamos a configurar tu IronRank en menos de 1 minuto."}
                {step === 1 && "Estos datos calibrarán tu rango inicial."}
                {step === 2 && "Adaptamos las sugerencias a tu meta principal."}
                {step === 3 && (
                  <span>
                    Tu primer workout te está esperando.{" "}
                    <strong className="text-tier-esmeralda">Heads-up:</strong> los tiers para Press Banca, Sentadilla y Peso Muerto usan standards reales de powerlifting. El resto son ratios sintéticos calibrados a esos 3 — útiles para orientarte, pero no oficiales.
                  </span>
                )}
              </div>

              <div className="flex-1">{steps[step].component}</div>

              <div className="mt-6 flex items-center justify-between border-t border-border-subtle pt-4">
                {step > 0 ? (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setExitX(-1);
                      setStep(step - 1);
                    }}
                  >
                    <ArrowLeft size={14} />
                    Atrás
                  </Button>
                ) : (
                  <span />
                )}

                {step < steps.length - 1 ? (
                  <Button
                    onClick={() => {
                      setExitX(1);
                      setStep(step + 1);
                    }}
                  >
                    Continuar
                    <ArrowRight size={14} />
                  </Button>
                ) : (
                  <Button variant="cta" onClick={handleFinish} className="px-6">
                    <Dumbbell size={16} />
                    Empezar primer workout
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function WelcomeStep() {
  const showcase: Tier[] = ["Bronce", "Plata", "Oro", "Diamante", "Retador"];
  return (
    <div className="flex flex-col items-center gap-5 py-6 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
      >
        <Logo size={80} />
      </motion.div>
      <div>
        <h3 className="font-display text-3xl font-bold tracking-tight">
          IronRank
        </h3>
        <p className="mt-1 text-sm text-fg-muted">
          Gym tracker con sistema ranked tipo LoL
        </p>
      </div>
      <div className="flex justify-center gap-3">
        {showcase.map((t, i) => (
          <motion.div
            key={t}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i }}
          >
            <TierEmblem tier={t} size="sm" />
          </motion.div>
        ))}
      </div>
      <p className="max-w-xs text-xs text-fg-muted">
        Sube de rango con cada PR. De{" "}
        <span style={{ color: TIER_VARS.Bronce }}>Bronce</span> a{" "}
        <span style={{ color: TIER_VARS.Retador }}>Retador</span>, compites
        contigo mismo.
      </p>
    </div>
  );
}

function ProfileStep({
  data,
  onChange,
}: {
  data: OnboardingData;
  onChange: (d: OnboardingData) => void;
}) {
  const profile = useProfileStore();
  const hasExistingData = !!profile.profile;
  return (
    <div className="space-y-4">
      {hasExistingData && (
        <div className="rounded-lg border border-brand-500/30 bg-brand-500/5 p-3 text-xs text-fg-muted">
          <strong className="text-fg">Ya tienes datos.</strong> Edítalos abajo o
          pulsa Continuar para mantenerlos.
        </div>
      )}
      <Field
        label="Edad"
        value={data.age}
        unit="años"
        onChange={(v) => onChange({ ...data, age: v })}
        min={14}
        max={90}
      />
      <div>
        <label className="mb-2 block text-sm">Género</label>
        <div className="grid grid-cols-2 gap-2">
          {(["male", "female"] as const).map((g) => {
            const active = data.gender === g;
            return (
              <button
                key={g}
                onClick={() => onChange({ ...data, gender: g })}
                className={
                  active
                    ? "rounded-lg border border-brand-500 bg-brand-500 py-3 text-sm font-semibold text-black transition-colors"
                    : "rounded-lg border border-border-subtle bg-surface-2 py-3 text-sm font-semibold text-fg transition-colors"
                }
              >
                {g === "male" ? "Hombre" : "Mujer"}
              </button>
            );
          })}
        </div>
      </div>
      <Field
        label="Peso corporal"
        value={data.bodyweight}
        unit="kg"
        onChange={(v) => onChange({ ...data, bodyweight: v })}
        min={30}
        max={250}
        step={0.5}
      />
      <Field
        label="Altura"
        value={data.height}
        unit="cm"
        onChange={(v) => onChange({ ...data, height: v })}
        min={100}
        max={250}
      />
    </div>
  );
}

function GoalStep({
  data,
  onChange,
}: {
  data: OnboardingData;
  onChange: (d: OnboardingData) => void;
}) {
  const profile = useProfileStore();
  const hasExistingData = !!profile.profile;
  return (
    <div className="space-y-2">
      {hasExistingData && (
        <div className="rounded-lg border border-brand-500/30 bg-brand-500/5 p-3 text-xs text-fg-muted mb-3">
          <strong className="text-fg">Tu objetivo actual:</strong> {data.goal}
          {" "}(puedes cambiarlo abajo).
        </div>
      )}
      {GOAL_OPTIONS.map((g) => {
        const Icon = g.icon;
        const active = data.goal === g.value;
        return (
          <button
            key={g.value}
            onClick={() => onChange({ ...data, goal: g.value })}
            className={
              active
                ? "flex w-full items-center gap-3 rounded-lg border border-brand-500 bg-surface-2 p-3 text-left transition-colors"
                : "flex w-full items-center gap-3 rounded-lg border border-border-subtle p-3 text-left transition-colors hover:bg-surface-1"
            }
          >
            <div
              className={
                active
                  ? "flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-black"
                  : "flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-fg-muted"
              }
            >
              <Icon size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-display text-sm font-bold">{g.label}</div>
              <div className="text-[11px] text-fg-muted">{g.desc}</div>
            </div>
            {active && (
              <Check size={16} className="shrink-0 text-brand-500" />
            )}
          </button>
        );
      })}
      <div className="flex items-center justify-between pt-3">
        <span className="text-sm">Unidad en kg</span>
        <Switch
          checked={data.useKg}
          onCheckedChange={(v) => onChange({ ...data, useKg: v })}
        />
      </div>
    </div>
  );
}

function ReadyStep({ data }: { data: OnboardingData }) {
  return (
    <div className="flex flex-col items-center gap-5 py-4 text-center">
      {/* El emblema Bronce materializándose: primer contacto con la identidad ranked */}
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.1 }}
      >
        <TierEmblem tier="Bronce" size="lg" animated />
      </motion.div>
      <div>
        <h3 className="font-display text-2xl font-bold tracking-tight">
          Tu rango inicial:{" "}
          <span style={{ color: TIER_VARS.Bronce }}>Bronce</span>
        </h3>
        <p className="mt-1 text-sm text-fg-muted">
          Basado en {data.bodyweight}kg · {data.age} años ·{" "}
          {data.gender === "male" ? "hombre" : "mujer"}
        </p>
      </div>
      <div className="grid w-full grid-cols-3 gap-3">
        {[
          { delay: 0.1, label: "PRs", value: 0 },
          { delay: 0.2, label: "Workouts", value: 0 },
          { delay: 0.3, label: "Tiers", value: TIERS.length },
        ].map((s) => (
          <BlurFade key={s.label} delay={s.delay}>
            <div className="card p-3 text-center">
              <div className="eyebrow !text-[11px]">{s.label}</div>
              <div className="font-display mt-1 text-xl font-bold">
                <NumberTicker value={s.value} />
              </div>
            </div>
          </BlurFade>
        ))}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  unit,
  onChange,
  min,
  max,
  step = 1,
}: {
  label: string;
  value: number;
  unit: string;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
}) {
  return (
    <div>
      <label className="eyebrow mb-1.5 block">{label}</label>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(min, value - step))}
          className="tap-target flex items-center justify-center rounded-md bg-surface-2 text-fg-muted transition-transform active:scale-90"
          aria-label={`Decrementar ${label}`}
        >
          −
        </button>
        <div className="flex-1 rounded-md border border-border-subtle bg-surface-2 px-3 py-2 text-center font-mono text-base font-bold tabular-nums text-brand-500">
          {value}
          <span className="ml-1 text-xs font-normal text-fg-muted">{unit}</span>
        </div>
        <button
          onClick={() => onChange(Math.min(max, value + step))}
          className="tap-target flex items-center justify-center rounded-md bg-surface-2 text-fg-muted transition-transform active:scale-90"
          aria-label={`Incrementar ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

/**
 * Determina si se debe mostrar el onboarding.
 * Consulta IndexedDB. Es async — debe llamarse en useEffect.
 */
export async function shouldShowOnboarding(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const { getOnboardingStatus } = await import("../../db/database");
    const status = await getOnboardingStatus();
    return status === "pending";
  } catch {
    return false;
  }
}
