/**
 * Servicio de analytics — Plausible (privacy-friendly, sin cookies, GDPR).
 *
 * Carga el script de Plausible (1KB) y expone API para trackear eventos custom.
 * Si PLAUSIBLE_DOMAIN no está configurado, el servicio degrada a no-op silencioso.
 * Así podemos dejar la integración lista sin romper nada si el usuario no se
 * ha registrado aún.
 */
import { useEffect } from "react";

const PLAUSIBLE_DOMAIN = "ironrank.rafagandia.com";
const PLAUSIBLE_HOST = "https://plausible.io";
const SCRIPT_ID = "plausible-analytics-script";

/** Tipos de eventos que trackeamos. Añadir a medida que se necesiten. */
export type AnalyticsEvent =
  /* Workout lifecycle */
  | "workout_started"
  | "workout_completed"
  | "workout_abandoned"
  | "exercise_added"
  | "set_logged"
  /* Gamification */
  | "tier_up"
  | "pr_set"
  | "streak_extended"
  /* Datos */
  | "export_data"
  | "import_data"
  | "wipe_data"
  /* PWA */
  | "app_installed"
  | "onboarding_completed"
  | "onboarding_skipped"
  | "command_palette_opened";

interface PlausibleWindow extends Window {
  plausible?: (
    event: string | { name: string; props?: Record<string, string | number> },
    options?: { callback?: () => void; props?: Record<string, string | number> }
  ) => void;
}

declare const window: PlausibleWindow;

/** Inyecta el script de Plausible en <head>. Llamar una sola vez. */
export function initPlausible(): void {
  if (typeof document === "undefined") return;
  if (document.getElementById(SCRIPT_ID)) return;
  const s = document.createElement("script");
  s.id = SCRIPT_ID;
  s.defer = true;
  s.src = `${PLAUSIBLE_HOST}/js/script.js`;
  s.setAttribute("data-domain", PLAUSIBLE_DOMAIN);
  document.head.appendChild(s);
}

/** Trackea un evento. No falla si Plausible no cargó. */
export function track(event: AnalyticsEvent | string, props?: Record<string, string | number>): void {
  if (typeof window === "undefined") return;
  if (typeof window.plausible !== "function") return;
  try {
    if (props && Object.keys(props).length > 0) {
      window.plausible(event, { props });
    } else {
      window.plausible(event);
    }
  } catch {
    /* swallow — analytics nunca debe romper la app */
  }
}

/** React hook para inicializar Plausible una vez al montar la app. */
export function usePlausibleInit(): void {
  useEffect(() => {
    initPlausible();
  }, []);
}
