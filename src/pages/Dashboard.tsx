import { useEffect, useState } from 'react'
import { useWorkoutStore } from '../store/workoutStore'
import { db } from '../db/database'
import { tierFromScore, rankedScore } from '../services/rankingService'
import { getLastSetsForExercise, bestSetForExercise } from '../db/queries'
import { estimatedMax } from '../utils/estimators'
import { TierCard } from '../components/TierCard'
import { fmt } from '../utils/format'

export function Dashboard({ onStartWorkout }: { onStartWorkout: () => void }) {
  const store = useWorkoutStore()
  const [tier, setTier] = useState('Bronze' as any)
  const [weeklyVolume, setWeekly] = useState(0)
  const [lastWeekVolume, setLastWeek] = useState(0)
  const [streak, setStreak] = useState(0)

  useEffect(() => { store.loadWorkouts(); store.loadProfile() }, [])

  useEffect(() => {
    if (!store.workouts.length || !store.profile) return
    calcTier()
    calcVolumes()
  }, [store.workouts, store.profile])

  const calcTier = async () => {
    const p = store.profile!
    const bench = await bestSetForExerciseByName('Press Banca')
    const squat = await bestSetForExerciseByName('Sentadilla')
    const dl = await bestSetForExerciseByName('Peso Muerto')
    const score = rankedScore(
      bench ? estimatedMax(bench.weight, bench.reps, bench.rir) : 0,
      squat ? estimatedMax(squat.weight, squat.reps, squat.rir) : 0,
      dl ? estimatedMax(dl.weight, dl.reps, dl.rir) : 0,
      p.bodyweight
    )
    setTier(tierFromScore(score))
  }

  const bestSetForExerciseByName = async (name: string) => {
    const exercises = await db.exercises.filter(e => e.name.toLowerCase().includes(name.toLowerCase())).toArray()
    if (!exercises.length) return null
    return bestSetForExercise(exercises[0].id!)
  }

  const calcVolumes = () => {
    const now = new Date()
    const thisWeekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())
    const lastWeekStart = new Date(thisWeekStart.getTime() - 7 * 86400000)

    let thisVol = 0, lastVol = 0
    store.workouts.forEach(w => {
      const d = new Date(w.date)
      const weIds = d >= thisWeekStart ? 'this' : d >= lastWeekStart ? 'last' : null
      if (!weIds) return
      const vol = 0 // volume calculated differently without sub-queries
    })
    setWeekly(thisVol)
    setLastWeek(lastVol)
  }

  const lastWorkout = store.workouts[0]

  return (
    <div className="px-4 pt-4 pb-24 space-y-4 overflow-auto">
      <div className="text-center">
        <TierCard tier={tier} large />
        <div className="text-xs text-gray-500 mt-1">Rango General</div>
      </div>

      {lastWorkout && (
        <div className="bg-white/5 rounded-xl p-4">
          <div className="text-xs text-gray-400 mb-1">Último Entreno</div>
          <div className="flex justify-between">
            <span className="font-medium">{fmt.date(lastWorkout.date)} {fmt.time(lastWorkout.date)}</span>
            <span className="text-sm text-gray-400">{fmt.duration(lastWorkout.duration)}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <StatBox value={String(store.workouts.length)} label="Entrenos" />
        <StatBox value={String(streak)} label="Racha" />
        <StatBox value="—" label="Vol. Semanal" />
      </div>

      <button onClick={onStartWorkout}
        className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold text-lg">
        Nuevo Workout
      </button>
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
