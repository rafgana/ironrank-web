import { useEffect, useState } from 'react'
import { useProfileStore } from '../store/profileStore'
import { db } from '../db/database'
import { bestSetForExercise } from '../db/queries'
import { estimatedMax } from '../utils/estimators'
import { tierFor, nextMilestone, tierFromScore, rankedScore } from '../services/rankingService'
import { TIER_ICONS, TIER_COLORS, TIERS, type Tier, type Exercise } from '../models/types'

export function Ranking() {
  const profile = useProfileStore(s => s.profile)
  const [exercises, setExercises] = useState<(Exercise & { tier: Tier; rm: number; next: string })[]>([])
  const [overall, setOverall] = useState<Tier>('Bronze')

  useEffect(() => { if (profile) load() }, [profile])

  const load = async () => {
    const p = profile!
    const names = ['Press Banca', 'Sentadilla', 'Peso Muerto', 'Press Militar', 'Remo Barra', 'Dominadas']
    const exs = await db.exercises.filter(e => names.includes(e.name)).toArray()
    let benchR = 0, squatR = 0, deadR = 0

    const data = await Promise.all(exs.map(async e => {
      const best = await bestSetForExercise(e.id!)
      if (!best) return { ...e, tier: 'Bronze' as Tier, rm: 0, next: 'Sin datos' }
      const rm = estimatedMax(best.weight, best.reps, best.rir)
      const t = tierFor(rm, p.bodyweight, p.gender, p.age, e.name)
      const m = nextMilestone(rm, p.bodyweight, p.gender, p.age, e.name)
      if (e.name.includes('Press Banca')) benchR = rm
      if (e.name.includes('Sentadilla')) squatR = rm
      if (e.name.includes('Peso Muerto')) deadR = rm
      return { ...e, tier: t, rm, next: m ? `${TIER_ICONS[m.nextTier]} +${m.weightNeeded}kg` : 'Maximo' }
    }))

    setExercises(data)
    setOverall(tierFromScore(rankedScore(benchR, squatR, deadR, p.bodyweight)))
  }

  return (
    <div className="space-y-6 animate-in">
      <h1 className="text-2xl font-extrabold tracking-tight">Ranked</h1>

      {/* Overall */}
      <div className="text-center py-10 px-6 rounded-2xl" style={{
        background: `linear-gradient(135deg, ${TIER_COLORS[overall]}20, ${TIER_COLORS[overall]}06)`,
        border: `1px solid ${TIER_COLORS[overall]}22`,
      }}>
        <div className="text-7xl mb-3">{TIER_ICONS[overall]}</div>
        <div className="text-3xl font-extrabold mb-1" style={{ color: TIER_COLORS[overall] }}>{overall}</div>
        <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Rango General</div>
      </div>

      {/* Per exercise */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold px-1">Tus Ejercicios</h2>
        {exercises.map(e => (
          <div key={e.id} className="card p-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">{e.name}</div>
              {e.rm > 0 && (
                <div className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                  1RM: {e.rm.toFixed(1)}kg
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="flex items-center gap-1 justify-end">
                  <span>{TIER_ICONS[e.tier]}</span>
                  <span className="text-xs font-semibold" style={{ color: TIER_COLORS[e.tier] }}>{e.tier}</span>
                </div>
                {e.next !== 'Sin datos' && e.next !== 'Maximo' && (
                  <div className="text-[11px] mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{e.next}</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
