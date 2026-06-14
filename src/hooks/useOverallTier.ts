import { useEffect, useRef, useState } from "react";
import { bestSetPerExercise } from "../db/queries";
import { rankedScore, tierFromScore, loadStandards, type Gender } from "../services/rankingService";
import { estimatedMax } from "../utils/estimators";
import { useWorkoutStore } from "../store/workoutStore";
import { useProfileStore } from "../store/profileStore";
import { TIERS, type Tier, type UserProfile } from "../models/types";
import { track } from "../services/analytics";
import { logAction } from "../services/actionLog";

export interface OverallTier {
  tier: Tier;
  nextTier: Tier | null;
  /** Score 0–100 (porcentaje hacia el máximo = Retador en todos los ejercicios) */
  score: number;
  hasData: boolean;
  /** Cuántos ejercicios contribuyen al score */
  exerciseCount: number;
}

/**
 * Cálculo puro del tier — reutilizable fuera de React (actionLog, sync, etc.).
 * Devuelve null si no hay perfil o standards.
 */
export async function computeOverallTier(profile: UserProfile | null): Promise<{
  tier: Tier;
  score: number;
  hasData: boolean;
  exerciseCount: number;
} | null> {
  if (!profile) return null;
  let standards;
  try {
    standards = await loadStandards();
  } catch {
    return null;
  }
  const gender: Gender = profile.gender === 'female' ? 'mujer' : 'hombre';
  const bests = await bestSetPerExercise();
  const exercises = bests
    .map((b) => ({
      rm: estimatedMax(b.set.weight, b.set.reps, b.set.rir),
      name: b.exerciseName,
    }))
    .filter((e) => e.rm > 0);
  const score = rankedScore(exercises, profile.bodyweight, gender, profile.age, standards);
  return {
    tier: tierFromScore(score),
    score: Math.round(score * 100),
    hasData: exercises.length > 0,
    exerciseCount: exercises.length,
  };
}

/**
 * Tier global del usuario = promedio de TODOS los ejercicios con data.
 *
 * No hay "big three" hardcoded. Si haces press banca y sentadilla, esos promedian.
 * Si haces 8 ejercicios diferentes, esos 8 promedian. Honesto con cada perfil.
 */
export function useOverallTier(): OverallTier {
  const ws = useWorkoutStore();
  const ps = useProfileStore();
  const prevTier = useRef<Tier | null>(null);
  const [state, setState] = useState<OverallTier>({
    tier: "Bronce",
    nextTier: "Plata",
    score: 0,
    hasData: false,
    exerciseCount: 0,
  });

  useEffect(() => {
    if (!ps.profile) return;
    let cancelled = false;
    (async () => {
      const result = await computeOverallTier(ps.profile);
      if (cancelled || !result) return;
      const { tier, score, hasData, exerciseCount } = result;
      const idx = TIERS.indexOf(tier);
      setState({
        tier,
        nextTier: idx < TIERS.length - 1 ? TIERS[idx + 1] : null,
        score,
        hasData,
        exerciseCount,
      });
      /* Detect tier-up */
      if (prevTier.current && prevTier.current !== tier) {
        const before = TIERS.indexOf(prevTier.current);
        if (idx > before) {
          track("tier_up", { from: prevTier.current, to: tier, score, exercises: exerciseCount });
          logAction("tier_up", {
            from: prevTier.current,
            to: tier,
            score,
            exercises: exerciseCount,
          });
        }
      }
      prevTier.current = tier;
    })();
    return () => {
      cancelled = true;
    };
  }, [ws.workouts, ps.profile]);

  return state;
}
