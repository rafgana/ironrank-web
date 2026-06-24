import { useMemo } from "react";
import { useWorkoutStore } from "../store/workoutStore";

export interface Streak {
  /** Días consecutivos con al menos 1 workout. */
  current: number;
  /** Récord histórico de racha. */
  best: number;
  /** Si la racha está activa (último workout fue hoy o ayer). */
  active: boolean;
  /** Días restantes antes de perder la racha. 0 = estás en el último día posible. */
  hoursUntilBreak: number;
}

/**
 * Calcula la racha de días consecutivos con workout.
 *
 * Reglas:
 * - "Día" = día natural en zona horaria local (00:00 a 23:59)
 * - Un día cuenta si tiene al menos 1 workout guardado
 * - La racha está activa si el último workout fue hoy o ayer
 * - Si no entrenas 2 días seguidos, la racha se rompe
 *
 * Se calcula en cliente desde el store de workouts (lectura reactiva).
 */
export function useStreak(): Streak {
  const workouts = useWorkoutStore((s) => s.workouts);

  return useMemo(() => {
    if (workouts.length === 0) {
      return { current: 0, best: 0, active: false, hoursUntilBreak: 0 };
    }

    const days = new Set(
      workouts.map((w) => {
        const d = new Date(w.date);
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      }),
    );

    const sortedDays = [...days]
      .map((k) => {
        const [y, m, d] = k.split("-").map(Number);
        return new Date(y, m, d).getTime();
      })
      .sort((a, b) => b - a);

    const today = new Date();
    const todayKey = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const yesterdayKey = todayKey - 24 * 60 * 60 * 1000;

    const lastDay = sortedDays[0];
    const active = lastDay === todayKey || lastDay === yesterdayKey;

    let current = 0;
    if (active) {
      let cursor = lastDay;
      while (days.has(formatKey(new Date(cursor)))) {
        current++;
        cursor -= 24 * 60 * 60 * 1000;
      }
    }

    let best = current;
    let run = 1;
    for (let i = 1; i < sortedDays.length; i++) {
      const expected = sortedDays[i - 1] - 24 * 60 * 60 * 1000;
      if (sortedDays[i] === expected) {
        run++;
        if (run > best) best = run;
      } else {
        run = 1;
      }
    }

    const hoursUntilBreak = active
      ? Math.max(0, Math.round(((lastDay + 48 * 60 * 60 * 1000 - Date.now()) / (60 * 60 * 1000)) * 10) / 10)
      : 0;

    return { current, best, active, hoursUntilBreak };
  }, [workouts]);
}

function formatKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}
