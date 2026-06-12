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
    <div className="min-h-screen bg-surface-0 md:grid md:grid-cols-[240px_1fr] md:items-start">
      {/* SIDEBAR DESKTOP */}
      <aside className="hidden border-r border-border-subtle bg-(--sidebar) md:sticky md:top-0 md:z-20 md:flex md:h-screen md:flex-col md:self-start">
        {/* Logo con halo del tier */}
        <div className="relative flex h-16 items-center gap-3 border-b border-border-subtle px-5">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_0%,var(--tier-softer),transparent_70%)]"
          />
          <Logo size={32} />
          <div className="relative">
            <div className="font-display text-lg leading-none font-bold tracking-tight">
              IronRank
            </div>
            <div className="eyebrow mt-0.5 !text-[11px] text-(--tier)">
              GYM · RANKED
            </div>
          </div>
        </div>

        {/* Navegación */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {tabs.map((t) => {
            const active = tab === t.key;
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-(--tier-soft) text-(--tier)"
                    : "text-fg-muted hover:bg-surface-2 hover:text-fg",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-rail"
                    className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-(--tier)"
                    transition={springFast}
                  />
                )}
                <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Identidad ranked ambiental */}
        <div className="flex items-center gap-3 border-t border-border-subtle px-5 py-3">
          <TierEmblem tier={overall.tier} size="xs" />
          <div>
            <div className="text-xs font-semibold text-(--tier)">
              {overall.tier}
            </div>
            <div className="text-[11px] text-fg-dim">rango actual</div>
          </div>
        </div>

        {/* Acción rápida */}
        <div className="border-t border-border-subtle px-3 py-2.5">
          <motion.button
            onClick={startWorkout}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-(image:--tier-gradient) text-xs font-bold text-(--tier-contrast) shadow-(--shadow-glow-tier)"
          >
            <Zap size={14} strokeWidth={2.5} />
            Nuevo workout
          </motion.button>
        </div>

        {/* Pie */}
        <div className="flex items-center justify-between border-t border-border-subtle px-5 py-3 text-[11px] text-fg-dim">
          <span className="eyebrow">v2.0</span>
          <button
            onClick={() => setTab("profile")}
            aria-label="Configuración"
            className="transition-colors hover:text-fg-muted"
          >
            <Settings size={12} />
          </button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="relative min-w-0 flex-1">
        {/* Top bar desktop */}
        <header className="sticky top-0 z-10 hidden h-16 items-center justify-between border-b border-border-subtle bg-[color-mix(in_oklab,var(--color-surface-0)_75%,transparent)] px-8 backdrop-blur md:flex">
          <div className="flex items-center gap-3">
            {(() => {
              const current = tabs.find((t) => t.key === tab);
              const Icon = current?.icon ?? Home;
              return (
                <>
                  <Icon size={18} className="text-(--tier)" />
                  <h1 className="font-display text-lg font-semibold tracking-tight">
                    {current?.label}
                  </h1>
                </>
              );
            })()}
          </div>
          {isSyncEnabled() && (
            <span
              title="Sincronización en la nube activa"
              className="flex items-center gap-1.5 rounded-full border border-(--tier-border) bg-(--tier-soft) px-2.5 py-1.5"
            >
              <span className="size-1.5 rounded-full bg-(--tier)" />
              <span className="eyebrow !text-[11px] text-(--tier)">Sync</span>
            </span>
          )}
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

        <div className="px-4 py-6 pb-32 md:px-8 md:py-8 md:pb-12 lg:px-10">
          <div className="mx-auto max-w-7xl">
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
