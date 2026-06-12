import { useEffect, useState } from 'react'
import { useWorkoutStore } from '../store/workoutStore'
import { db } from '../db/database'
import { tierFromScore, rankedScore } from '../services/rankingService'
import { bestSetForExercise } from '../db/queries'
import { estimatedMax } from '../utils/estimators'
import { TierCard } from '../components/TierCard'
import { fmt } from '../utils/format'
import type { Tier } from '../models/types'

export function Dashboard({ onStartWorkout }: { onStartWorkout: () => void }) {
  const store = useWorkoutStore()
  const [tier, setTier] = useState<Tier>('Bronze')
  const [streak, setStreak] = useState(0)

  useEffect(() => { store.loadWorkouts(); store.loadProfile() }, [])

  useEffect(() => {
    if (!store.workouts.length || !store.profile) return
    calcTier()
    calcStreak()
  }, [store.workouts, store.profile])

  const calcTier = async () => {
    const p = store.profile!
    const bench = await bestSetForName('Press Banca')
    const squat = await bestSetForName('Sentadilla')
    const dl = await bestSetForName('Peso Muerto')
    const score = rankedScore(
      bench ? estimatedMax(bench.weight, bench.reps, bench.rir) : 0,
      squat ? estimatedMax(squat.weight, squat.reps, squat.rir) : 0,
      dl ? estimatedMax(dl.weight, dl.reps, dl.rir) : 0,
      p.bodyweight
    )
    setTier(tierFromScore(score))
  }

  const bestSetForName = async (name: string) => {
    const exercises = await db.exercises.filter(e => e.name.toLowerCase().includes(name.toLowerCase())).toArray()
    if (!exercises.length) return null
    return bestSetForExercise(exercises[0].id!)
  }

  const calcStreak = () => {
    const sorted = [...store.workouts].sort((a, b) => +b.date - +a.date)
    let s = 0
    let current = new Date()
    for (const w of sorted) {
      const d = new Date(w.date)
      if (d.toDateString() === current.toDateString()) { s++; current = new Date(current.getTime() - 86400000) }
      else if (d < new Date(current.getTime() - 86400000)) break
    }
    setStreak(s)
  }

  const lastWorkout = store.workouts[0]

  return (
    <div className="px-4 md:px-6 pt-4 md:pt-8 pb-4 space-y-5">
      <div className="text-center max-w-sm mx-auto">
        <TierCard tier={tier} large />
        <div className="text-xs text-gray-500 mt-1">Rango General</div>
      </div>

      {lastWorkout && (
        <div className="bg-white/5 rounded-xl p-4 max-w-sm mx-auto">
          <div className="text-xs text-gray-400 mb-1">Ultimo Entreno</div>
          <div className="flex justify-between">
            <span className="font-medium">{fmt.date(lastWorkout.date)} {fmt.time(lastWorkout.date)}</span>
            <span className="text-sm text-gray-400">{fmt.duration(lastWorkout.duration)}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
        <StatBox value={String(store.workouts.length)} label="Entrenos" />
        <StatBox value={String(streak)} label="Racha" />
        <StatBox value="—" label="Vol. Sem." />
      </div>

      <div className="max-w-sm mx-auto">
        <button onClick={onStartWorkout}
          className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold text-lg hover:bg-orange-600 transition-colors">
          Nuevo Workout
        </button>
      </div>
    </div>
  )
}

function StatBox({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-white/5 rounded-xl p-3 text-center">
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  )
}
