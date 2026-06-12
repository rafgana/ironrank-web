import { useEffect, useState } from 'react'
import { useProfileStore } from '../store/profileStore'
import { db } from '../db/database'
import { bestSetForExercise } from '../db/queries'
import { estimatedMax } from '../utils/estimators'
import { tierFor, nextMilestone } from '../services/rankingService'
import { TierCard } from '../components/TierCard'
import type { Tier, Exercise } from '../models/types'
import { TIER_ICONS } from '../models/types'

export function Ranking() {
  const profile = useProfileStore(s => s.profile)
  const [exercises, setExercises] = useState<(Exercise & { tier: Tier; nextInfo: string | null })[]>([])
  const [overallTier] = useState<Tier>('Bronze')

  useEffect(() => { if (profile) loadData() }, [profile])

  const loadData = async () => {
    if (!profile) return
    const names = ['Press Banca', 'Sentadilla', 'Peso Muerto', 'Press Militar', 'Remo Barra', 'Dominadas']
    const exs = await db.exercises.filter(e => names.includes(e.name)).toArray()
    const data = await Promise.all(exs.map(async e => {
      const best = await bestSetForExercise(e.id!)
      if (!best) return { ...e, tier: 'Bronze' as Tier, nextInfo: 'Sin datos' } as const
      const rm = estimatedMax(best.weight, best.reps, best.rir)
      const t = tierFor(rm, profile.bodyweight, profile.gender, profile.age, e.name)
      const m = nextMilestone(rm, profile.bodyweight, profile.gender, profile.age, e.name)
      return { ...e, tier: t, nextInfo: m ? `${TIER_ICONS[m.nextTier]} +${m.weightNeeded}kg` : 'Maximo' }
    }))
    setExercises(data)
  }

  return (
    <div className="px-4 md:px-6 pt-4 md:pt-8 pb-4 space-y-4">
      <div className="text-center max-w-sm mx-auto">
        <TierCard tier={overallTier} large />
        <div className="text-xs text-gray-500 mt-1">Rango General</div>
      </div>

      <h2 className="text-lg font-bold md:text-2xl">Tus Ejercicios</h2>
      <div className="space-y-2">
        {exercises.map(e => (
          <div key={e.id} className="bg-white/5 rounded-xl p-3 flex items-center justify-between hover:bg-white/10 transition-colors">
            <span className="font-medium text-sm md:text-base">{e.name}</span>
            <div className="flex items-center gap-2">
              <span className="text-lg">{TIER_ICONS[e.tier]}</span>
              <span className="text-xs md:text-sm text-gray-400">{e.tier}</span>
              {e.nextInfo && (
                <span className="text-xs text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full">{e.nextInfo}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
