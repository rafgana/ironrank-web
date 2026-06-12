import { useState, useEffect } from 'react'
import { useWorkoutStore } from '../store/workoutStore'
import { SetRow } from '../components/SetRow'
import { RIRSelector } from '../components/RIRSelector'
import { RestTimer } from '../components/RestTimer'
import { PRBadge } from '../components/PRBadge'
import { platesDescription } from '../services/plateCalculator'

export function ActiveWorkout({ onComplete }: { onComplete: () => void }) {
  const s = useWorkoutStore()
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [rir, setRIR] = useState<number | null>(null)
  const [history, setHistory] = useState<Record<number, string>>({})
  const plates = [25, 20, 15, 10, 5, 2.5, 1.25]

  useEffect(() => {
    s.activeExercises.forEach(async e => {
      const h = await s.lastHistory(e.exercise.id!)
      setHistory(prev => ({ ...prev, [e.exercise.id!]: h }))
    })
  }, [s.activeExercises.length])

  const add = () => {
    const w = parseFloat(weight), r = parseInt(reps)
    if (isNaN(w) || isNaN(r) || w <= 0 || r <= 0) return
    s.addSet(w, r, rir); setWeight(''); setReps(''); setRIR(null)
  }

  const total = s.activeExercises.reduce((n, e) => n + e.sets.length, 0)
  const done = s.activeExercises.reduce((n, e) => n + e.sets.filter(x => x.completed).length, 0)

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <div className="flex items-center justify-between h-14 px-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <button onClick={onComplete} className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Cancelar</button>
        <span className="text-sm font-semibold">Entreno</span>
        <button onClick={() => s.completeWorkout()} className="text-sm font-bold" style={{ color: 'var(--primary)' }}>
          Completar
        </button>
      </div>

      {/* Progress bar */}
      <div className="px-4 py-3">
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--secondary)' }}>
          <div className="h-full rounded-full transition-all duration-500 ease-out"
            style={{ background: 'var(--primary)', width: total ? `${(done / total) * 100}%` : '0%' }} />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            {done}/{total} series
          </span>
        </div>
      </div>

      {/* Exercise list */}
      <div className="flex-1 overflow-auto px-3 pb-32 space-y-3">
        {s.activeExercises.map((e, i) => {
          const last = i === s.activeExercises.length - 1
          return (
            <div key={e.we.id} className="rounded-xl border p-4 animate-in" style={{
              borderColor: last ? 'var(--primary)' : 'var(--border)',
              background: last ? `linear-gradient(135deg, var(--primary-foreground), transparent)` as any : 'var(--card)',
              opacity: last ? 1 : 0.92,
            }}>
              {/* Exercise name */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-bold">{e.exercise.name}</span>
              </div>

              {/* History */}
              {history[e.exercise.id!] && (
                <div className="text-xs mb-2 px-2 py-1 rounded-md inline-block"
                  style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)' }}>
                  Ultima vez: {history[e.exercise.id!]}
                </div>
              )}

              {/* Sets */}
              <div className="space-y-0.5">
                {e.sets.map(set => (
                  <SetRow key={set.id} set={set} onToggle={() => s.toggleSet(set.id!)} />
                ))}
              </div>

              {/* Add set form (only for current exercise) */}
              {last && (
                <div className="mt-4 pt-4 border-t space-y-3" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="text-[10px] uppercase tracking-wide mb-1 block" style={{ color: 'var(--muted-foreground)' }}>
                        Peso (kg)
                      </label>
                      <input type="number" placeholder="0" value={weight} onChange={e => setWeight(e.target.value)}
                        className="w-full text-lg font-bold text-center"
                        style={{
                          background: 'var(--secondary)', color: 'var(--foreground)',
                          border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '8px',
                          width: '100%',
                        }} />
                    </div>
                    <div className="text-lg" style={{ color: 'var(--muted-foreground)', marginTop: '18px' }}>×</div>
                    <div className="flex-1">
                      <label className="text-[10px] uppercase tracking-wide mb-1 block" style={{ color: 'var(--muted-foreground)' }}>
                        Reps
                      </label>
                      <input type="number" placeholder="0" value={reps} onChange={e => setReps(e.target.value)}
                        className="w-full text-lg font-bold text-center"
                        style={{
                          background: 'var(--secondary)', color: 'var(--foreground)',
                          border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '8px',
                          width: '100%',
                        }} />
                    </div>
                  </div>

                  <RIRSelector selected={rir} onChange={setRIR} />

                  <button onClick={add} disabled={!weight || !reps}
                    className="w-full py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
                    style={{
                      background: (weight && reps) ? 'var(--primary)' : 'var(--secondary)',
                      color: (weight && reps) ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                    }}>
                    Añadir Serie
                  </button>

                  {parseFloat(weight) > 20 && (
                    <div className="text-xs text-center py-1" style={{ color: 'var(--muted-foreground)' }}>
                      {platesDescription(parseFloat(weight), 20, plates)}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Timer */}
      {s.isResting && s.restTimer > 0 && (
        <div className="fixed bottom-20 inset-x-0 px-3 z-40">
          <RestTimer startTime={s.restTimer} onComplete={() => s.stopRestTimer()} onSkip={() => s.stopRestTimer()} />
        </div>
      )}

      {s.showPR && <PRBadge pr={s.showPR} onDismiss={() => s.dismissPR()} />}
    </div>
  )
}
