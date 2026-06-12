import { useState, useEffect } from 'react'
import { useWorkoutStore } from '../store/workoutStore'
import { useProfileStore } from '../store/profileStore'
import type { Exercise, SetEntry } from '../models/types'
import { SetRow } from '../components/SetRow'
import { RIRSelector } from '../components/RIRSelector'
import { RestTimer } from '../components/RestTimer'
import { PlateCalc } from '../components/PlateCalc'
import { PRBadge } from '../components/PRBadge'

export function ActiveWorkout({ onComplete }: { onComplete: () => void }) {
  const store = useWorkoutStore()
  const prof = useProfileStore()
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [rir, setRIR] = useState<number | null>(null)
  const [historyMap, setHistoryMap] = useState<Record<number, string>>({})
  const [suggestionMap, setSuggestionMap] = useState<Record<number, string | null>>({})

  const profile = prof.profile ?? { restTimerDefault: 90, useKg: true, availablePlates: [25, 20, 15, 10, 5, 2.5, 1.25] }

  useEffect(() => {
    store.activeExercises.forEach(async e => {
      const h = await store.lastHistory(e.exercise.id!)
      setHistoryMap(prev => ({ ...prev, [e.exercise.id!]: h }))
      const s = await store.suggestion(e.exercise.id!)
      setSuggestionMap(prev => ({ ...prev, [e.exercise.id!]: s }))
    })
  }, [store.activeExercises.length])

  const handleAddSet = () => {
    const w = parseFloat(weight)
    const r = parseInt(reps)
    if (isNaN(w) || isNaN(r) || w <= 0 || r <= 0) return
    store.addSet(w, r, rir)
    setWeight('')
    setReps('')
    setRIR(null)
  }

  const handleToggle = (setId: number) => store.toggleSet(setId)

  const totalSets = store.activeExercises.reduce((sum, e) => sum + e.sets.length, 0)
  const doneSets = store.activeExercises.reduce((sum, e) => sum + e.sets.filter(s => s.completed).length, 0)

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <button onClick={onComplete} className="text-red-400 text-sm">Cancelar</button>
        <span className="font-medium">Entreno</span>
        <button onClick={() => store.completeWorkout()} className="text-orange-400 font-bold text-sm">
          Completar
        </button>
      </div>

      <div className="px-4 py-2">
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-orange-500 transition-all duration-300"
            style={{ width: totalSets ? `${(doneSets / totalSets) * 100}%` : '0%' }}
          />
        </div>
        <div className="text-xs text-gray-500 mt-1 text-right">{doneSets}/{totalSets} series</div>
      </div>

      <div className="flex-1 overflow-auto px-3 pb-32">
        {store.activeExercises.map((e, i) => {
          const isLast = i === store.activeExercises.length - 1
          return (
            <div key={e.we.id} className={`rounded-xl p-3 mb-3 ${isLast ? 'border border-orange-500/30 bg-orange-500/5' : 'bg-white/5'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{e.exercise.name}</span>
                {suggestionMap[e.exercise.id!] && (
                  <span className="text-xs text-gray-400">{suggestionMap[e.exercise.id!]}</span>
                )}
              </div>

              {historyMap[e.exercise.id!] && (
                <div className="text-xs text-gray-500 mb-2">Última vez: {historyMap[e.exercise.id!]}</div>
              )}

              {e.sets.map(set => (
                <SetRow key={set.id} set={set} onToggle={() => handleToggle(set.id!)} />
              ))}

              {isLast && (
                <div className="mt-3 space-y-2">
                  <div className="flex gap-2">
                    <input type="number" placeholder="Peso" value={weight}
                      onChange={e => setWeight(e.target.value)} className="w-20 text-sm" />
                    <span className="text-xs text-gray-400 self-center">kg</span>
                    <input type="number" placeholder="Reps" value={reps}
                      onChange={e => setReps(e.target.value)} className="w-16 text-sm" />
                    <span className="text-xs text-gray-400 self-center">rep</span>
                  </div>
                  <RIRSelector selected={rir} onChange={setRIR} />
                  <button onClick={handleAddSet} disabled={!weight || !reps}
                    className="w-full bg-orange-500 disabled:opacity-40 text-white py-2 rounded-xl font-medium text-sm">
                    Añadir Serie
                  </button>
                  <PlateCalc weight={parseFloat(weight) || 0} barWeight={20}
                    availablePlates={profile.availablePlates} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {store.isResting && store.restTimer > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-3">
          <RestTimer startTime={store.restTimer}
            onComplete={() => store.stopRestTimer()}
            onSkip={() => store.stopRestTimer()} />
        </div>
      )}

      {store.showPR && <PRBadge pr={store.showPR} onDismiss={() => store.dismissPR()} />}
    </div>
  )
}
