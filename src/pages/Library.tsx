import { useEffect, useState } from 'react'
import { db } from '../db/database'
import { bestSetForExercise } from '../db/queries'
import { estimatedMax } from '../utils/estimators'
import { tierFor } from '../services/rankingService'
import { useProfileStore } from '../store/profileStore'
import { TIER_ICONS, type Tier } from '../models/types'
import type { Exercise } from '../models/types'

export function Library() {
  const [exercises, setExercises] = useState<(Exercise & { tier?: Tier })[]>([])
  const [search, setSearch] = useState('')
  const [muscle, setMuscle] = useState<string | null>(null)
  const profile = useProfileStore(s => s.profile)

  useEffect(() => { if (profile) loadExercises() }, [profile])

  const loadExercises = async () => {
    const exs = await db.exercises.toArray()
    const withTiers = await Promise.all(exs.map(async e => {
      if (!profile) return e
      const best = await bestSetForExercise(e.id!)
      if (!best) return e
      const rm = estimatedMax(best.weight, best.reps, best.rir)
      const t = tierFor(rm, profile.bodyweight, profile.gender, profile.age, e.name)
      return { ...e, tier: t }
    }))
    setExercises(withTiers)
  }

  const muscles = [...new Set(exercises.map(e => e.musclePrimary))].sort()
  const filtered = exercises.filter(e =>
    (!muscle || e.musclePrimary === muscle) &&
    (!search || e.name.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="px-4 md:px-6 pt-4 md:pt-8 pb-4">
      <h2 className="text-lg font-bold md:text-2xl mb-3">Ejercicios</h2>

      <input type="text" placeholder="Buscar..." value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full mb-3 text-sm" />

      <div className="flex gap-1 mb-4 overflow-x-auto pb-2">
        <button onClick={() => setMuscle(null)}
          className={`text-xs px-3 py-1 rounded-full whitespace-nowrap ${!muscle ? 'bg-orange-500 text-white' : 'bg-white/5 text-gray-400'}`}>
          Todos
        </button>
        {muscles.map(m => (
          <button key={m} onClick={() => setMuscle(muscle === m ? null : m)}
            className={`text-xs px-3 py-1 rounded-full whitespace-nowrap ${muscle === m ? 'bg-orange-500 text-white' : 'bg-white/5 text-gray-400'}`}>
            {m}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
        {filtered.map(e => (
          <div key={e.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 transition-colors">
            <div>
              <div className="text-sm font-medium">{e.name}</div>
              <div className="text-xs text-gray-500">{e.musclePrimary} · {e.equipment}</div>
            </div>
            {e.tier && <span>{TIER_ICONS[e.tier]}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
