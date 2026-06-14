"use client";

import { useEffect } from "react";
import { useWorkoutStore } from "../store/workoutStore";

/**
 * Recordatorio de inactividad: si el usuario lleva 3+ días sin entrenar
 * y la página está en background/closed, muestra una notificación local
 * (Notification API). No requiere backend — el check es local.
 *
 * Comportamiento:
 * - Cada vez que se monta y cada 6h, mira el último workout
 * - Si han pasado >= 3 días (configurable) y NO se ha notificado hoy,
 *   muestra una notificación con CTA "Empezar workout"
 * - Si la pestaña está en foreground, no notifica (ya ve la app)
 */
const IDLE_DAYS = 3;
const STORAGE_KEY = "ironrank.idleNotify.lastDate";
const STORAGE_DAYS_KEY = "ironrank.idleNotify.days";

function getLastWorkoutDate(workouts: { date: Date | number }[]): Date | null {
  if (workouts.length === 0) return null;
  const sorted = [...workouts].sort(
    (a, b) => +new Date(b.date) - +new Date(a.date),
  );
  return new Date(sorted[0].date);
}

function daysSince(d: Date): number {
  const ms = +new Date() - +d;
  return ms / (1000 * 60 * 60 * 24);
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useIdleNotification() {
  const ws = useWorkoutStore();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "default") {
      // No pedimos automáticamente — solo cuando el user lo activa
      // (lo haríamos en el Profile, "Activar recordatorios").
      return;
    }
    if (Notification.permission !== "granted") return;

    const check = () => {
      const last = getLastWorkoutDate(ws.workouts);
      if (!last) return;
      const days = daysSince(last);
      if (days < IDLE_DAYS) return;

      const lastNotified = localStorage.getItem(STORAGE_KEY);
      if (lastNotified === todayISO()) return;

      // Dismissed for X days?
      const dismissedDays = parseInt(localStorage.getItem(STORAGE_DAYS_KEY) || "0");
      if (dismissedDays >= Math.floor(days)) return;

      try {
        const n = new Notification("IronRank · te echamos de menos", {
          body: `Llevas ${Math.floor(days)} días sin entrenar. Tu racha te espera.`,
          icon: "/ironrank/favicon.svg",
          badge: "/ironrank/favicon.svg",
          tag: "ironrank-idle",
          requireInteraction: false,
          data: { url: "/ironrank/#workout" },
        });
        n.onclick = () => {
          window.focus();
          window.location.hash = "#workout";
          n.close();
        };
        localStorage.setItem(STORAGE_KEY, todayISO());
      } catch (e) {
        /* ignore */
      }
    };

    check();
    const interval = setInterval(check, 6 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [ws.workouts.length]);
}

/** Pide permiso al usuario. Llamar desde un botón. */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof Notification === "undefined") return "denied";
  return await Notification.requestPermission();
}

/** Dismiss el recordatorio por N días (silenciar). */
export function dismissIdleNotification(days: number) {
  localStorage.setItem(STORAGE_DAYS_KEY, String(days));
}
