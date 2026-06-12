import { useState, useEffect } from 'react'
import { useWorkoutStore } from '../store/workoutStore'
import { SetRow } from '../components/SetRow'
import { RIRSelector } from '../components/RIRSelector'
import { RestTimer } from '../components/RestTimer'
import { PRBadge } from '../components/PRBadge'
import { platesDescription, warmupSets } from '../services/plateCalculator'

export function ActiveWorkout({ onComplete }: { onComplete: () => void }) {
  const store = useWorkoutStore()
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [rir, setRIR] = useState<number | null>(null)
  const [historyMap, setHistoryMap] = useState<Record<number, string>>({})

  const plates = [25, 20, 15, 10, 5, 2.5, 1.25]

  useEffect(() => {
    store.activeExercises.forEach(async e => {
      const h = await store.lastHistory(e.exercise.id!)
      setHistoryMap(prev => ({ ...prev, [e.exercise.id!]: h }))
    })
  }, [store.activeExercises.length])

  const handleAddSet = () => {
    const w = parseFloat(weight), r = parseInt(reps)
    if (isNaN(w) || isNaN(r) || w <= 0 || r <= 0) return
    store.addSet(w, r, rir); setWeight(''); setReps(''); setRIR(null)
  }

  const handleToggle = (setId: number) => store.toggleSet(setId)

  const totalSets = store.activeExercises.reduce((s, e) => s + e.sets.length, 0)
  const doneSets = store.activeExercises.reduce((s, e) => s + e.sets.filter(x => x.completed).length, 0)

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
        <button onClick={onComplete} className="text-sm text-muted-foreground hover:text-destructive">Cancelar</button>
        <span className="text-sm font-semibold">Entreno</span>
        <button onClick={() => store.completeWorkout()} className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>
          Completar
        </button>
      </div>

      {/* Progress */}
      <div className="px-4 py-2">
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--secondary)' }}>
          <div className="h-full rounded-full transition-all" style={{ background: 'var(--primary)', width: totalSets ? `${(doneSets / totalSets) * 100}%` : '0%' }} />
        </div>
        <div className="text-xs text-muted-foreground mt-1 text-right">{doneSets}/{totalSets}</div>
      </div>

      {/* Exercise list */}
      <div className="flex-1 overflow-auto px-3 pb-32">
        {store.activeExercises.map((e, i) => {
          const isLast = i === store.activeExercises.length - 1
          return (
            <div key={e.we.id} className="rounded-lg border p-3 mb-3" style={{
              borderColor: isLast ? 'var(--primary)' : 'var(--border)',
              background: isLast ? 'var(--accent)' : 'var(--card)',
            }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold">{e.exercise.name}</span>
              </div>

              {historyMap[e.exercise.id!] && (
                <div className="text-xs text-muted-foreground mb-2">
                  Ultima vez: {historyMap[e.exercise.id!]}
                </div>
              )}

              {e.sets.map(set => (
                <SetRow key={set.id} set={set} onToggle={() => handleToggle(set.id!)} />
              ))}

              {isLast && (
                <div className="mt-3 space-y-2 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex gap-2">
                    <input type="number" placeholder="Peso" value={weight} onChange={e => setWeight(e.target.value)}
                      className="w-20 text-sm text-right" style={{ background: 'var(--secondary)', color: 'var(--foreground)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '6px 10px' }} />
                    <span className="self-center text-xs text-muted-foreground">kg</span>
                    <input type="number" placeholder="Reps" value={reps} onChange={e => setReps(e.target.value)}
                      className="w-16 text-sm text-right" style={{ background: 'var(--secondary)', color: 'var(--foreground)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '6px 10px' }} />
                    <span className="self-center text-xs text-muted-foreground">rep</span>
                  </div>
                  <RIRSelector selected={rir} onChange={setRIR} />
                  <button onClick={handleAddSet} disabled={!weight || !reps}
                    className="w-full py-2 rounded-lg text-sm font-semibold transition-colors"
                    style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', opacity: (!weight || !reps) ? 0.5 : 1 }}>
                    Añadir Serie
                  </button>
                  {parseFloat(weight) > 20 && (
                    <details className="text-xs">
                      <summary className="text-muted-foreground cursor-pointer">Placas</summary>
                      <div className="mt-1 text-muted-foreground">
                        {platesDescription(parseFloat(weight), 20, plates)}
                      </div>
                    </details>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {!store.activeExercises.length && (
          <div className="text-center text-muted-foreground py-12">
            <div className="text-4xl mb-2">🏋️</div>
            <p className="text-sm">Anade ejercicios para empezar</p>
          </div>
        )}
      </div>

      {/* Rest timer overlay */}
      {store.isResting && store.restTimer > 0 && (
        <div className="fixed bottom-20 left-0 right-0 px-3 z-40">
          <RestTimer startTime={store.restTimer}
            onComplete={() => store.stopRestTimer()}
            onSkip={() => store.stopRestTimer()} />
        </div>
      )}

      {store.showPR && <PRBadge pr={store.showPR} onDismiss={() => store.dismissPR()} />}
    </div>
  )
}
