import { useEffect, useState } from 'react'
import { useProfileStore } from '../store/profileStore'
import { db } from '../db/database'
import { bestSetForExercise } from '../db/queries'
import { estimatedMax, relativeStrength } from '../utils/estimators'
import { tierFor, nextMilestone } from '../services/rankingService'
import { TierCard } from '../components/TierCard'
import type { Tier, Exercise } from '../models/types'
import { TIERS, TIER_ICONS } from '../models/types'

export function Ranking() {
  const profile = useProfileStore(s => s.profile)
  const [exercises, setExercises] = useState<(Exercise & { tier: Tier; nextInfo: string | null })[]>([])
  const [overallTier, setOverallTier] = useState<Tier>('Bronze')

  useEffect(() => {
    loadData()
  }, [profile])

  const loadData = async () => {
    if (!profile) return
    const exs = await db.exercises.filter(e => ['Press Banca', 'Sentadilla', 'Peso Muerto', 'Press Militar', 'Remo Barra', 'Dominadas'].includes(e.name)).toArray()
    const data = await Promise.all(exs.map(async (e): Promise<typeof exercises[number] | null> => {
      const best = await bestSetForExercise(e.id!)
      if (!best) return null
      const rm = estimatedMax(best.weight, best.reps, best.rir)
      const t = tierFor(rm, profile.bodyweight, profile.gender, profile.age, e.name)
      const milestone = nextMilestone(rm, profile.bodyweight, profile.gender, profile.age, e.name)
      return { ...e, tier: t, nextInfo: milestone ? `${TIER_ICONS[milestone.nextTier]} +${milestone.weightNeeded}kg` : 'Maximo' }
    }))
    setExercises(data.filter(Boolean) as any)
  }

  return (
    <div className="px-4 pt-4 pb-24 space-y-4 overflow-auto">
      <TierCard tier={overallTier} large />
      <div className="text-xs text-gray-500 text-center">Rango General</div>
      <div className="space-y-2">
        {exercises.map(e => (
          <div key={e.id} className="bg-white/5 rounded-xl p-3 flex items-center justify-between">
            <span className="font-medium text-sm">{e.name}</span>
            <div className="flex items-center gap-2">
              <span>{TIER_ICONS[e.tier]}</span>
              <span className="text-xs text-gray-400">{e.tier}</span>
              {e.nextInfo && <span className="text-xs text-orange-400">{e.nextInfo}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
