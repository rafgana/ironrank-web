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
  Command,
  Search,
  Plus,
  Settings,
  Sparkles,
  Calendar,
} from "lucide-react";
import { Dashboard } from "./pages/Dashboard";
import { ActiveWorkout } from "./pages/ActiveWorkout";
import { WorkoutList } from "./pages/Workout";
import { Ranking } from "./pages/Ranking";
import { Progress } from "./pages/Progress";
import { Library } from "./pages/Library";
import { Profile } from "./pages/Profile";
import { useWorkoutStore } from "./store/workoutStore";
import { useProfileStore } from "./store/profileStore";
import { useOverallTier } from "./hooks/useOverallTier";
import { setTierAccent } from "./lib/tierAccent";
import { Logo } from "./components/ironrank/Logo";
import { OfflineBanner } from "./hooks/useServiceWorker";
import { isSyncEnabled } from "./services/sync/config";
import { usePlausibleInit, track } from "./services/analytics";
import { logAction } from "./services/actionLog";
import { useStandardsStore } from "./store/standardsStore";
import { useIdleNotification } from "./hooks/useIdleNotification";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AuthGuard } from "./components/auth/AuthGuard";
import { useAuthStore } from "./services/auth/authStore";
import { startAutoBackupScheduler, runAutoBackup } from "./services/backup";
import { springFast, springUI, enterItem, enterStagger } from "./lib/motionTokens";
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
  usePlausibleInit();
  useIdleNotification();
  const [tab, setTabState] = useState<Tab>("home");
  const [showWorkout, setShowWorkout] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const direction = useRef(1);
  const lastLoadedUserRef = useRef<string | null>(null);
  const ws = useWorkoutStore();
  const ps = useProfileStore();
  const std = useStandardsStore();
  const auth = useAuthStore();
  const overall = useOverallTier();

  const setTab = (next: Tab) => {
    direction.current =
      TAB_ORDER.indexOf(next) >= TAB_ORDER.indexOf(tab) ? 1 : -1;
    setTabState(next);
    if (next !== tab) {
      track("tab_changed", { tab: next });
    }
  };

  useEffect(() => {
    // Schema version check — si hay upgrade pendiente, las migraciones de Dexie
    // ya se ejecutaron automáticamente al abrir la BD. Aquí solo actualizamos
    // el flag para tracking.
    (async () => {
      const { CURRENT_SCHEMA_VERSION, getCurrentSchemaVersion, setCurrentSchemaVersion } = await import("./db/database");
      const current = await getCurrentSchemaVersion();
      if (current < CURRENT_SCHEMA_VERSION) {
        logAction("schema_migrated", { from: current, to: CURRENT_SCHEMA_VERSION });
        await setCurrentSchemaVersion(CURRENT_SCHEMA_VERSION);
      }
    })();

    // Backup automático: cada 24h si hay sesión
    startAutoBackupScheduler();
    if (auth.session?.user?.id) {
      void runAutoBackup();
    }

    // Auth-aware load: cuando cambia el user, recargar perfil y workouts
    let cancelled = false;
    if (auth.session?.user?.id) {
      const userId = auth.session.user.id;
      // Solo cargar si cambió el user (no en cada render)
      if (userId !== lastLoadedUserRef.current) {
        lastLoadedUserRef.current = userId;
        ps.load();
        ws.loadProfile();
        ws.loadWorkouts();
      }
    }
    ws.loadActiveWorkout().then((restored) => {
      if (!cancelled && restored) setShowWorkout(true);
    });
    std.load();
    return () => { cancelled = true; };
  }, [auth.session?.user?.id]);

  useEffect(() => {
    setTierAccent(overall.tier);
  }, [overall.tier]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandOpen((o) => !o);
      }
      if (e.key === "Escape") {
        setCommandOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    // Captura global de errores — los loguea para diagnóstico sin romper UX
    const onError = (ev: ErrorEvent) => {
      const source = ev.filename ? String(ev.filename).split("/").slice(-2).join("/") : undefined;
      const category = source?.includes("supabase") ? "supabase"
        : source?.includes("dexie") || source?.includes("idb") ? "indexeddb"
        : source?.includes("react") ? "react"
        : "unknown";
      logAction("error_caught", {
        message: String(ev.message || "unknown").slice(0, 200),
        source,
        line: ev.lineno,
        col: ev.colno,
        category,
      }, "window.onerror");
    };
    const onRejection = (ev: PromiseRejectionEvent) => {
      const reason = ev.reason;
      const msg = reason instanceof Error ? reason.message : String(reason);
      logAction("error_caught", {
        message: msg.slice(0, 200),
        type: "unhandledrejection",
      }, "unhandledrejection");
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  const startWorkout = async () => {
    await ws.startWorkout();
    track("workout_started");
    setShowWorkout(true);
  };

  const repeatLastWorkout = async (workoutId: number) => {
    await ws.startWorkout(undefined, workoutId);
    track("workout_started");
    setShowWorkout(true);
  };

  // Auth es obligatorio: el onboarding local ya no se muestra.
  // El primer login via OAuth crea el perfil automáticamente (handle_new_user trigger).
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
    <ErrorBoundary>
      <AuthGuard>
      <div className="min-h-screen bg-transparent text-fg">
      {/* TOP NAV — single line, 72px max, glass + tier gradient bottom edge */}
      <header
        className="sticky top-0 z-(--z-sticky) backdrop-blur-xl"
        style={{
          background: "color-mix(in oklab, var(--color-surface-0) 65%, transparent)",
          borderBottom: "1px solid color-mix(in oklab, var(--color-border-subtle) 70%, transparent)",
        }}
      >
        <div
          className="absolute inset-x-0 bottom-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, var(--tier) 30%, var(--tier) 70%, transparent)",
            opacity: 0.5,
          }}
          aria-hidden
        />
        <div className="mx-auto flex h-[64px] md:h-[68px] max-w-[1440px] items-center gap-3 md:gap-6 px-4 md:px-8">
          {/* Brand */}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setTab("home");
            }}
            className="flex items-center gap-2.5 shrink-0"
            aria-label="IronRank, ir a inicio"
          >
            <Logo size={76} className="md:hidden" />
            <Logo size={88} className="hidden md:block" />
          </a>

          {/* Nav items (desktop) — single horizontal line */}
          <nav className="hidden lg:flex items-center gap-0.5 flex-1" aria-label="Navegación principal">
            {tabs.map((t) => {
              const active = tab === t.key;
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative px-3.5 h-9 rounded-lg text-sm font-medium transition-colors",
                    "flex items-center gap-2",
                    active
                      ? "text-fg"
                      : "text-fg-muted hover:text-fg",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="topnav-pill"
                      transition={springFast}
                      className="absolute inset-0 rounded-lg bg-(--color-surface-elevated) border border-(--color-border-subtle)"
                    />
                  )}
                  {active && (
                    <span
                      className="absolute left-3.5 right-3.5 -bottom-[19px] h-0.5 rounded-full"
                      style={{ background: "var(--tier)" }}
                      aria-hidden
                    />
                  )}
                  <Icon
                    size={15}
                    strokeWidth={active ? 2.5 : 2}
                    className="relative z-10"
                  />
                  <span className="relative z-10">{t.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="flex-1 lg:hidden" />

          {/* Right cluster: command trigger + tier pill + new workout */}
          <div className="flex items-center gap-2 ml-auto shrink-0">
            {/* Command palette trigger (desktop) */}
            <button
              onClick={() => {
                track("command_palette_opened");
                logAction("command_palette_opened");
                setCommandOpen(true);
              }}
              className="hidden md:flex items-center gap-2 h-9 px-3 rounded-lg border border-border-subtle text-fg-muted hover:text-fg hover:border-border-strong transition-colors text-sm"
              aria-label="Abrir paleta de comandos"
            >
              <Search size={14} />
              <span className="text-xs">Buscar…</span>
              <kbd className="hidden xl:inline-flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded border border-border-subtle bg-surface-2 text-fg-dim">
                ⌘K
              </kbd>
            </button>

            {/* Tier pill */}
            <div
              className="hidden md:flex items-center gap-2 h-9 px-3 rounded-full text-sm"
              style={{
                background: "var(--tier-soft)",
                border: "1px solid var(--tier-border)",
              }}
            >
              <span
                className="size-1.5 rounded-full"
                style={{ background: "var(--tier)" }}
              />
              <span
                className="font-condensed tracking-widest text-[11px]"
                style={{ color: "var(--tier)" }}
              >
                {overall.tier.toUpperCase()}
              </span>
            </div>

            {/* Saludo personalizado (desktop) */}
            {auth.user && (auth.user.user_metadata?.full_name || auth.user.email) && (
              <div className="hidden lg:flex items-center gap-2 text-sm">
                <span className="text-fg-muted">Hola,</span>
                <span className="font-semibold text-fg">
                  {(auth.user.user_metadata?.full_name as string | undefined)?.split(" ")[0] ||
                    auth.user.email?.split("@")[0]}
                </span>
              </div>
            )}

            {/* New workout CTA */}
            <motion.button
              onClick={startWorkout}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={springFast}
              className="flex items-center gap-2 h-9 px-3.5 rounded-lg text-sm font-semibold text-(length:--tier-contrast) glow-tier"
              style={{
                background: "var(--tier-gradient)",
              }}
            >
              <Zap size={14} strokeWidth={2.5} fill="currentColor" />
              <span className="hidden sm:inline">Nuevo workout</span>
              <span className="sm:hidden">Nuevo</span>
            </motion.button>

            {/* Settings (desktop) */}
            <button
              onClick={() => setTab("profile")}
              aria-label="Ir a perfil"
              className="hidden md:flex tap-target items-center justify-center rounded-lg text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors"
            >
              <Settings size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT — wide container, generous padding */}
      <main className="mx-auto max-w-[1440px] px-5 md:px-8 py-8 md:py-10 pb-32 md:pb-16">
        <AnimatePresence mode="wait" initial={false} custom={direction.current}>
          <motion.div
            key={tab}
            custom={direction.current}
            initial="enter"
            animate="center"
            exit="exit"
            variants={{
              enter: (d: number) => ({ opacity: 0, x: 20 * d, y: 4 }),
              center: { opacity: 1, x: 0, y: 0 },
              exit: (d: number) => ({ opacity: 0, x: -16 * d, y: 0 }),
            }}
            transition={springUI}
          >
            {tab === "home" && <Dashboard onStartWorkout={startWorkout} />}
            {tab === "workout" && <WorkoutList onStart={startWorkout} onRepeatLast={repeatLastWorkout} />}
            {tab === "ranked" && <Ranking />}
            {tab === "progress" && <Progress />}
            {tab === "library" && <Library />}
            {tab === "profile" && <Profile />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* MOBILE BOTTOM NAV — 4 items + central FAB */}
      <OfflineBanner />
      <nav
        className="fixed bottom-0 inset-x-0 z-40 md:hidden"
        aria-label="Navegación inferior"
        style={{
          background: "color-mix(in oklab, var(--color-surface-0) 92%, transparent)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <div className="border-t border-border-subtle flex items-end justify-around pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
          {tabs.slice(0, 2).map((t) => (
            <MobileTab
              key={t.key}
              t={t}
              active={tab === t.key}
              onSelect={setTab}
            />
          ))}

          <motion.button
            onClick={startWorkout}
            whileTap={{ scale: 0.9 }}
            transition={springFast}
            aria-label="Nuevo workout"
            className="-mt-6 flex size-14 items-center justify-center rounded-full glow-tier"
            style={{ background: "var(--tier-gradient)" }}
          >
            <Zap size={22} strokeWidth={2.5} fill="currentColor" />
          </motion.button>

          {tabs.slice(2, 4).map((t) => (
            <MobileTab
              key={t.key}
              t={t}
              active={tab === t.key}
              onSelect={setTab}
            />
          ))}
        </div>
      </nav>

      {/* COMMAND PALETTE */}
      <CommandPalette
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
        onSelectTab={(t) => {
          setTab(t);
          setCommandOpen(false);
        }}
        onStartWorkout={() => {
          startWorkout();
          setCommandOpen(false);
        }}
      />
      </div>
      </AuthGuard>
    </ErrorBoundary>
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
        "tap-target relative flex flex-col items-center gap-0.5 px-3 py-1.5 transition-colors",
        active ? "text-tier" : "text-fg-muted",
      )}
      style={active ? { color: "var(--tier)" } : undefined}
    >
      <Icon size={20} strokeWidth={active ? 2.5 : 2} />
      <span className="text-[10px] font-medium tracking-wide">{t.label}</span>
    </button>
  );
}

/* ============== Command palette (Cmd+K) ============== */

interface CommandItem {
  id: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  shortcut?: string;
  onSelect: () => void;
}

function CommandPalette({
  open,
  onClose,
  onSelectTab,
  onStartWorkout,
}: {
  open: boolean;
  onClose: () => void;
  onSelectTab: (t: Tab) => void;
  onStartWorkout: () => void;
}) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (open) setQuery("");
  }, [open]);

  const items: CommandItem[] = [
    { id: "new", label: "Nuevo workout", hint: "Empezar sesión", icon: Zap, shortcut: "N", onSelect: onStartWorkout },
    { id: "home", label: "Ir a Inicio", icon: Home, onSelect: () => onSelectTab("home") },
    { id: "workout", label: "Ir a Entreno", icon: Dumbbell, onSelect: () => onSelectTab("workout") },
    { id: "ranked", label: "Ir a Ranked", icon: Trophy, onSelect: () => onSelectTab("ranked") },
    { id: "progress", label: "Ir a Progreso", icon: BarChart3, onSelect: () => onSelectTab("progress") },
    { id: "library", label: "Ir a Biblioteca", icon: BookOpen, onSelect: () => onSelectTab("library") },
    { id: "profile", label: "Ir a Perfil", icon: User, onSelect: () => onSelectTab("profile") },
    { id: "demo", label: "Ver galería de badges", icon: Sparkles, onSelect: () => { window.location.search = "?demo=1"; } },
  ];

  const filtered = items.filter((i) =>
    i.label.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={springFast}
            onClick={(e) => e.stopPropagation()}
            className="card w-full max-w-lg overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 h-12 border-b border-border-subtle">
              <Search size={16} className="text-fg-muted" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Busca una acción, página o comando…"
                className="flex-1 bg-transparent outline-none text-sm placeholder:text-fg-dim"
              />
              <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-border-subtle bg-surface-2 text-fg-dim">
                ESC
              </kbd>
            </div>
            <ul className="max-h-80 overflow-y-auto p-1.5">
              {filtered.length === 0 ? (
                <li className="px-3 py-6 text-center text-sm text-fg-muted">
                  Sin resultados para "{query}"
                </li>
              ) : (
                filtered.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={item.onSelect}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm hover:bg-surface-2 transition-colors group"
                      >
                        <Icon
                          size={15}
                          className="text-fg-muted group-hover:text-tier transition-colors"
                        />
                        <span className="flex-1">{item.label}</span>
                        {item.hint && (
                          <span className="text-xs text-fg-dim">{item.hint}</span>
                        )}
                        {item.shortcut && (
                          <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-border-subtle bg-surface-2 text-fg-dim">
                            {item.shortcut}
                          </kbd>
                        )}
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
            <div className="px-4 py-2 border-t border-border-subtle flex items-center gap-4 text-[10px] font-mono text-fg-dim">
              <span className="flex items-center gap-1">
                <Command size={10} />K abrir
              </span>
              <span>↑↓ navegar</span>
              <span>↵ seleccionar</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
