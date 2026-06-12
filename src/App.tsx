import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Home,
  Dumbbell,
  Trophy,
  BarChart3,
  BookOpen,
  User,
  Zap,
  Settings,
} from "lucide-react";
import { Dashboard } from "./pages/Dashboard";
import { ActiveWorkout } from "./pages/ActiveWorkout";
import { WorkoutList } from "./pages/Workout";
import { Ranking } from "./pages/Ranking";
import { Progress } from "./pages/Progress";
import { Library } from "./pages/Library";
import { Profile } from "./pages/Profile";
import { TierDemo } from "./pages/TierDemo";
import { useWorkoutStore } from "./store/workoutStore";
import { useProfileStore } from "./store/profileStore";
import { useOverallTier } from "./hooks/useOverallTier";
import { setTierAccent } from "./lib/tierAccent";
import { Logo } from "./components/ironrank/Logo";
import { TierEmblem } from "./components/ironrank/TierEmblem";
import { TierProgressBar } from "./components/ui/TierProgressBar";
import { OfflineBanner } from "./hooks/useServiceWorker";
import {
  Onboarding,
  shouldShowOnboarding,
} from "./components/onboarding/Onboarding";
import { isSyncEnabled } from "./services/syncService";
import { springFast, springUI } from "./lib/motionTokens";
import { cn } from "./lib/utils";
import type { LucideIcon } from "lucide-react";

type Tab = "home" | "workout" | "ranked" | "progress" | "library" | "profile";

const tabs: { key: Tab; icon: LucideIcon; label: string }[] = [
  { key: "home", icon: Home, label: "Inicio" },
  { key: "workout", icon: Dumbbell, label: "Entreno" },
  { key: "ranked", icon: Trophy, label: "Ranked" },
  { key: "progress", icon: BarChart3, label: "Progreso" },
  { key: "library", icon: BookOpen, label: "Biblioteca" },
  { key: "profile", icon: User, label: "Perfil" },
];

const TAB_ORDER: Tab[] = [
  "home",
  "workout",
  "ranked",
  "progress",
  "library",
  "profile",
];

export default function App() {
  const [tab, setTabState] = useState<Tab>("home");
  const [showWorkout, setShowWorkout] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const direction = useRef(1);
  const ws = useWorkoutStore();
  const ps = useProfileStore();
  const overall = useOverallTier();

  const setTab = (next: Tab) => {
    direction.current =
      TAB_ORDER.indexOf(next) >= TAB_ORDER.indexOf(tab) ? 1 : -1;
    setTabState(next);
  };

  useEffect(() => {
    ws.loadWorkouts();
    ws.loadProfile();
    ps.load();
    const params = new URLSearchParams(window.location.search);
    setShowDemo(params.get("demo") === "1");
    setShowOnboarding(params.get("demo") !== "1" && shouldShowOnboarding());
  }, []);

  useEffect(() => {
    setTierAccent(overall.tier);
  }, [overall.tier]);

  const startWorkout = async () => {
    await ws.startWorkout();
    setShowWorkout(true);
  };

  if (showOnboarding) {
    return <Onboarding onComplete={() => setShowOnboarding(false)} />;
  }

  if (showDemo) return <TierDemo />;

  if (showWorkout && ws.activeWorkout) {
    return (
      <ActiveWorkout
        onComplete={() => {
          setShowWorkout(false);
          ws.loadWorkouts();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-surface-0 md:grid md:grid-cols-[276px_1fr] md:items-start">
      {/* SIDEBAR DESKTOP */}
      <aside className="hidden border-r border-[color-mix(in_oklab,white_6%,transparent)] bg-[linear-gradient(180deg,color-mix(in_oklab,var(--tier)_3%,var(--sidebar)),var(--sidebar)_30%)] md:sticky md:top-0 md:z-20 md:flex md:h-screen md:flex-col md:self-start">
        {/* Marca */}
        <div className="relative flex h-20 items-center gap-3.5 px-6">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(140%_120%_at_50%_-20%,var(--tier-softer),transparent_70%)]"
          />
          <Logo size={38} />
          <div className="relative">
            <div className="font-display text-xl leading-none font-bold tracking-tight">
              IronRank
            </div>
            <div className="eyebrow mt-1 !text-[11px] text-(--tier)">
              Gym · Ranked
            </div>
          </div>
        </div>
        <div className="mx-6 h-px bg-[linear-gradient(90deg,var(--tier-border),transparent)]" />

        {/* Navegación */}
        <nav className="flex-1 overflow-y-auto px-4 py-5">
          <div className="eyebrow mb-3 px-2 !text-fg-dim">Menú</div>
          <div className="space-y-1.5">
            {tabs.map((t) => {
              const active = tab === t.key;
              const Icon = t.icon;
              return (
                <motion.button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  aria-current={active ? "page" : undefined}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition-all duration-200",
                    active
                      ? "text-fg"
                      : "text-fg-muted hover:translate-x-0.5 hover:text-fg",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      transition={springFast}
                      className="absolute inset-0 rounded-xl border border-(--tier-border) bg-[linear-gradient(90deg,var(--tier-soft),transparent_75%)] shadow-[inset_0_1px_0_0_oklch(1_0_0/0.05)]"
                    />
                  )}
                  {active && (
                    <motion.span
                      layoutId="nav-rail"
                      className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-(--tier) shadow-[0_0_8px_var(--tier-glow)]"
                      transition={springFast}
                    />
                  )}
                  <span
                    className={cn(
                      "relative z-10 flex size-9 items-center justify-center rounded-lg transition-colors",
                      active
                        ? "bg-(--tier-soft) text-(--tier)"
                        : "bg-surface-2 text-fg-muted group-hover:text-fg",
                    )}
                  >
                    <Icon size={17} strokeWidth={active ? 2.5 : 2} />
                  </span>
                  <span className="relative z-10">{t.label}</span>
                </motion.button>
              );
            })}
          </div>
        </nav>

        {/* Tarjeta de jugador: rango + progreso */}
        <div className="px-4 pb-4">
          <div className="card-accent relative overflow-hidden p-4">
            <div className="flex items-center gap-3">
              <TierEmblem tier={overall.tier} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="eyebrow !text-[11px]">Rango actual</div>
                <div
                  className="font-display truncate text-lg leading-tight font-bold"
                  style={{ color: "var(--tier)" }}
                >
                  {overall.tier}
                </div>
              </div>
              <span className="font-mono text-sm tabular-nums text-fg-muted">
                {overall.score}%
              </span>
            </div>
            <TierProgressBar value={overall.score} className="mt-3 h-1.5" />
          </div>
          <motion.button
            onClick={startWorkout}
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.97 }}
            className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-(image:--tier-gradient) text-sm font-bold text-(--tier-contrast) shadow-(--shadow-glow-tier) transition-[filter] hover:brightness-110"
          >
            <Zap size={15} strokeWidth={2.5} />
            Nuevo workout
          </motion.button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="relative min-w-0 flex-1">
        {/* Top bar desktop */}
        <header className="sticky top-0 z-10 hidden h-16 items-center justify-between border-b border-border-subtle bg-[color-mix(in_oklab,var(--color-surface-0)_75%,transparent)] px-8 backdrop-blur-xl md:flex lg:px-10">
          <div className="absolute inset-x-0 bottom-0 h-px bg-[linear-gradient(90deg,transparent,var(--tier-border),transparent)]" />
          <div>
            <div className="eyebrow !text-[11px] !text-fg-dim">
              IronRank · Temporada 2026
            </div>
            <h1 className="font-display text-xl leading-tight font-bold tracking-tight">
              {tabs.find((t) => t.key === tab)?.label}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-2 rounded-full border border-[color-mix(in_oklab,white_8%,transparent)] bg-surface-1 px-3.5 py-1.5 text-sm text-fg-muted capitalize lg:flex">
              {new Date().toLocaleDateString("es-ES", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </span>
            {isSyncEnabled() && (
              <span
                title="Sincronización en la nube activa"
                className="flex items-center gap-1.5 rounded-full border border-(--tier-border) bg-(--tier-soft) px-2.5 py-1.5"
              >
                <span className="size-1.5 rounded-full bg-(--tier)" />
                <span className="eyebrow !text-[11px] text-(--tier)">Sync</span>
              </span>
            )}
            <button
              onClick={() => setTab("profile")}
              aria-label="Configuración"
              className="flex size-9 items-center justify-center rounded-full border border-[color-mix(in_oklab,white_8%,transparent)] bg-surface-1 text-fg-muted transition-colors hover:border-(--tier-border) hover:text-fg"
            >
              <Settings size={15} />
            </button>
          </div>
        </header>

        {/* Top bar móvil */}
        <header className="flex h-14 items-center justify-between border-b border-border-subtle bg-surface-1 px-4 md:hidden">
          <button
            onClick={() => setTab("home")}
            className="flex items-center gap-2"
          >
            <Logo size={26} />
            <span className="font-display text-base font-bold tracking-tight">
              IronRank
            </span>
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setTab("library")}
              aria-label="Biblioteca"
              aria-current={tab === "library" ? "page" : undefined}
              className={cn(
                "tap-target flex items-center justify-center rounded-full transition-colors",
                tab === "library" ? "text-(--tier)" : "text-fg-muted",
              )}
            >
              <BookOpen size={18} />
            </button>
            <button
              onClick={() => setTab("profile")}
              aria-label="Perfil"
              aria-current={tab === "profile" ? "page" : undefined}
              className={cn(
                "tap-target flex items-center justify-center rounded-full transition-colors",
                tab === "profile" ? "text-(--tier)" : "text-fg-muted",
              )}
            >
              <span className="flex size-9 items-center justify-center rounded-full border-2 border-(--tier-border) bg-surface-2">
                <User size={16} />
              </span>
            </button>
          </div>
        </header>

        <div className="px-4 py-6 pb-32 md:px-8 md:py-8 md:pb-14 lg:px-10 lg:py-9">
          <div className="mx-auto max-w-[1600px]">
            <AnimatePresence mode="wait" initial={false} custom={direction.current}>
              <motion.div
                key={tab}
                custom={direction.current}
                initial="enter"
                animate="center"
                exit="exit"
                variants={{
                  enter: (d: number) => ({ opacity: 0, x: 24 * d }),
                  center: { opacity: 1, x: 0 },
                  exit: (d: number) => ({ opacity: 0, x: -16 * d }),
                }}
                transition={springUI}
              >
                {tab === "home" && <Dashboard onStartWorkout={startWorkout} />}
                {tab === "workout" && <WorkoutList onStart={startWorkout} />}
                {tab === "ranked" && <Ranking />}
                {tab === "progress" && <Progress />}
                {tab === "library" && <Library />}
                {tab === "profile" && <Profile />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* NAV MÓVIL: 4 tabs + FAB central */}
      <OfflineBanner />
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-border-subtle bg-[color-mix(in_oklab,var(--color-surface-0)_82%,transparent)] px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] backdrop-blur-xl md:hidden">
        <MobileTab t={tabs[0]} active={tab === "home"} onSelect={setTab} />
        <MobileTab t={tabs[1]} active={tab === "workout"} onSelect={setTab} />

        {/* FAB Nuevo workout */}
        <motion.button
          onClick={startWorkout}
          aria-label="Nuevo workout"
          whileTap={{ scale: 0.9 }}
          transition={springFast}
          className="-mt-7 flex size-14 items-center justify-center rounded-full border border-(--tier-border) bg-(image:--tier-gradient) text-(--tier-contrast) shadow-[0_8px_24px_-6px_var(--tier-glow),inset_0_1px_0_0_oklch(1_0_0/0.25)]"
        >
          <Zap size={24} strokeWidth={2.5} />
        </motion.button>

        <MobileTab t={tabs[2]} active={tab === "ranked"} onSelect={setTab} />
        <MobileTab t={tabs[3]} active={tab === "progress"} onSelect={setTab} />
      </nav>
    </div>
  );
}

function MobileTab({
  t,
  active,
  onSelect,
}: {
  t: { key: Tab; icon: LucideIcon; label: string };
  active: boolean;
  onSelect: (tab: Tab) => void;
}) {
  const Icon = t.icon;
  return (
    <button
      onClick={() => onSelect(t.key)}
      aria-current={active ? "page" : undefined}
      aria-label={t.label}
      className={cn(
        "tap-target relative flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 transition-colors",
        active ? "text-(--tier)" : "text-fg-muted",
      )}
    >
      {active && (
        <motion.span
          layoutId="mobile-nav-dot"
          className="absolute -top-1.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-(--tier)"
          transition={springFast}
        />
      )}
      <Icon size={20} strokeWidth={active ? 2.5 : 2} />
      <span className="text-[11px] font-semibold tracking-wide">{t.label}</span>
    </button>
  );
}
