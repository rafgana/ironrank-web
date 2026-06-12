import { useEffect, useState } from "react";
import { db } from "../db/database";
import { bestSetForExercise } from "../db/queries";
import { rankedScore, tierFromScore } from "../services/rankingService";
import { estimatedMax } from "../utils/estimators";
import { useWorkoutStore } from "../store/workoutStore";
import { TIERS, type Tier } from "../models/types";

export interface OverallTier {
  tier: Tier;
  nextTier: Tier | null;
  /** Score 0–100 (porcentaje hacia el máximo) */
  score: number;
  hasData: boolean;
}

async function bestSetForName(name: string) {
  const e = await db.exercises
    .filter((x) => x.name.toLowerCase().includes(name.toLowerCase()))
    .first();
  return e ? bestSetForExercise(e.id!) : null;
}

/**
 * Tier global del usuario (S/B/D ponderados por peso corporal).
 * Misma lógica que tenían duplicada Dashboard y Profile, calculada una vez.
 */
export function useOverallTier(): OverallTier {
  const ws = useWorkoutStore();
  const [state, setState] = useState<OverallTier>({
    tier: "Bronce",
    nextTier: "Plata",
    score: 0,
    hasData: false,
  });

  useEffect(() => {
    if (!ws.profile) return;
    let cancelled = false;
    (async () => {
      const p = ws.profile!;
      const bench = await bestSetForName("Press Banca");
      const squat = await bestSetForName("Sentadilla");
      const dl = await bestSetForName("Peso Muerto");
      const score = rankedScore(
        bench ? estimatedMax(bench.weight, bench.reps, bench.rir) : 0,
        squat ? estimatedMax(squat.weight, squat.reps, squat.rir) : 0,
        dl ? estimatedMax(dl.weight, dl.reps, dl.rir) : 0,
        p.bodyweight,
      );
      if (cancelled) return;
      const tier = tierFromScore(score);
      const idx = TIERS.indexOf(tier);
      setState({
        tier,
        nextTier: idx < TIERS.length - 1 ? TIERS[idx + 1] : null,
        score: Math.round(score * 100),
        hasData: !!(bench || squat || dl),
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [ws.workouts, ws.profile]);

  return state;
}
