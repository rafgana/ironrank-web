/**
 * Theme toggle: dark (default) ↔ light.
 * Light mode es un experimento: cambia las variables de surface y fg.
 * Los acentos cyan/tier se mantienen porque son el "branding" — solo el chrome cambia.
 */
export type ThemeMode = "dark" | "light";

const STORAGE_KEY = "ironrank.theme";

export function getInitialTheme(): ThemeMode {
  if (typeof window === "undefined") return "dark";
  const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
  if (stored === "light" || stored === "dark") return stored;
  return "dark";
}

export function applyTheme(mode: ThemeMode): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = mode;
  localStorage.setItem(STORAGE_KEY, mode);
}

export function toggleTheme(): ThemeMode {
  const current = getInitialTheme();
  const next: ThemeMode = current === "dark" ? "light" : "dark";
  applyTheme(next);
  return next;
}
