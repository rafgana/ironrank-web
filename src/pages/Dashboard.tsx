import { useEffect, useState } from 'react'
import { useWorkoutStore } from '../store/workoutStore'
import { db } from '../db/database'
import { tierFromScore, rankedScore } from '../services/rankingService'
import { bestSetForExercise } from '../db/queries'
import { estimatedMax } from '../utils/estimators'
import type { Tier } from '../models/types'
import { TIER_ICONS, TIER_COLORS } from '../models/types'

export function Dashboard({ onStartWorkout }: { onStartWorkout: () => void }) {
  const ws = useWorkoutStore()
  const [tier, setTier] = useState<Tier>('Bronze')

  useEffect(() => { ws.loadWorkouts(); ws.loadProfile() }, [])
  useEffect(() => { if (ws.workouts.length && ws.profile) calcTier() }, [ws.workouts, ws.profile])

  const calcTier = async () => {
    const p = ws.profile!
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

  const lastWorkout = ws.workouts[0]

  return (
    <div className="space-y-6">
      {/* Tier card */}
      <div className="rounded-xl p-6 text-center" style={{ background: TIER_COLORS[tier] + '15', border: '1px solid ' + TIER_COLORS[tier] + '30' }}>
        <div className="text-5xl mb-2">{TIER_ICONS[tier]}</div>
        <div className="text-xl font-bold" style={{ color: TIER_COLORS[tier] }}>{tier}</div>
        <div className="text-xs text-muted-foreground mt-1">Rango General</div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3">
        <StatBox value={String(ws.workouts.length)} label="Entrenos" />
        <StatBox value="-" label="Racha" />
        <StatBox value="-" label="Vol. Sem." />
      </div>

      {/* Last workout */}
      {lastWorkout && (
        <div className="rounded-lg border p-4 text-sm" style={{ borderColor: 'var(--border)' }}>
          <div className="text-xs text-muted-foreground mb-1">Ultimo entreno</div>
          <div className="flex justify-between">
            <span className="font-medium">
              {new Date(lastWorkout.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
            <span className="text-muted-foreground">
              {Math.floor(lastWorkout.duration / 60)}m {lastWorkout.duration % 60}s
            </span>
          </div>
        </div>
      )}

      {/* Start button */}
      <button
        onClick={onStartWorkout}
        className="w-full py-3 rounded-lg text-sm font-semibold transition-colors"
        style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
        Nuevo Workout
      </button>
    </div>
  )
}

function StatBox({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg border p-3 text-center text-sm" style={{ borderColor: 'var(--border)' }}>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}
