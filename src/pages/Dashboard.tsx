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
  const [loading, setLoading] = useState(true)

  useEffect(() => { ws.loadWorkouts(); ws.loadProfile() }, [])
  useEffect(() => { if (ws.profile) calcTier().then(() => setLoading(false)) }, [ws.workouts, ws.profile])

  const calcTier = async () => {
    const p = ws.profile!
    const bench = await bestSetForName('Press Banca')
    const squat = await bestSetForName('Sentadilla')
    const dl = await bestSetForName('Peso Muerto')
    setTier(tierFromScore(rankedScore(
      bench ? estimatedMax(bench.weight, bench.reps, bench.rir) : 0,
      squat ? estimatedMax(squat.weight, squat.reps, squat.rir) : 0,
      dl ? estimatedMax(dl.weight, dl.reps, dl.rir) : 0,
      p.bodyweight
    )))
  }

  const bestSetForName = async (name: string) => {
    const e = await db.exercises.filter(x => x.name.toLowerCase().includes(name.toLowerCase())).first()
    return e ? bestSetForExercise(e.id!) : null
  }

  const last = ws.workouts[0]

  return (
    <div className="space-y-8 animate-in">
      {/* Tier display - full width with bg color */}
      <div className="text-center py-8 px-4 rounded-2xl" style={{
        background: `linear-gradient(135deg, ${TIER_COLORS[tier]}18, ${TIER_COLORS[tier]}08)`,
        border: `1px solid ${TIER_COLORS[tier]}22`,
      }}>
        <div className="text-7xl mb-3 drop-shadow-lg">{TIER_ICONS[tier]}</div>
        <div className="text-3xl font-extrabold tracking-tight mb-1" style={{ color: TIER_COLORS[tier] }}>{tier}</div>
        <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Rango General</div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard value={String(ws.workouts.length)} label="Entrenos" icon="🏋️" />
        <StatCard value="-" label="Racha" icon="🔥" />
        <StatCard value="-" label="Vol Sem." icon="📈" />
      </div>

      {/* Last workout */}
      {last && (
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Ultimo entreno</div>
              <div className="text-sm font-semibold mt-1">
                {new Date(last.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })} · {new Date(last.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <div className="text-sm tabular-nums" style={{ color: 'var(--muted-foreground)' }}>
              {Math.floor(last.duration / 60)}m
            </div>
          </div>
        </div>
      )}

      {/* CTA button */}
      {!last && (
        <div className="text-center py-12" style={{ color: 'var(--muted-foreground)' }}>
          <div className="text-5xl mb-4">💪</div>
          <p className="text-sm mb-6">Aun no tienes entrenos. Empieza tu primer workout.</p>
        </div>
      )}

      <button onClick={onStartWorkout}
        className="w-full py-3.5 rounded-xl text-base font-bold transition-all hover:shadow-xl active:scale-[0.98]"
        style={{
          background: 'var(--primary)',
          color: 'var(--primary-foreground)',
          boxShadow: '0 4px 14px 0 rgba(249, 115, 22, 0.3)',
        }}>
        {'Nuevo Workout'}
      </button>
    </div>
  )
}

function StatCard({ value, label, icon }: { value: string; label: string; icon: string }) {
  return (
    <div className="card p-4 text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-extrabold tabular-nums">{value}</div>
      <div className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{label}</div>
    </div>
  )
}
