import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Home, Dumbbell, Trophy, BarChart3, BookOpen, User, Zap, Search, Command, Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { springFast } from "../lib/motionTokens";

type Tab = "home" | "workout" | "ranked" | "progress" | "library" | "profile";

interface CommandItem {
  id: string;
  label: string;
  icon: LucideIcon;
  hint?: string;
  shortcut?: string;
  onSelect: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onSelectTab: (t: Tab) => void;
  onStartWorkout: () => void;
}

export function CommandPalette({
  open, onClose, onSelectTab, onStartWorkout,
}: CommandPaletteProps) {
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
                        <Icon size={15} className="text-fg-muted group-hover:text-tier transition-colors" />
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
