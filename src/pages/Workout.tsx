import { useWorkoutStore } from '../store/workoutStore'
import { fmt } from '../utils/format'

export function WorkoutList({ onStart }: { onStart: () => void }) {
  const store = useWorkoutStore()

  return (
    <div className="px-4 md:px-6 pt-4 md:pt-8 pb-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold md:text-2xl">Entrenos</h2>
        <button onClick={onStart} className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-orange-600">
          + Nuevo
        </button>
      </div>

      <div className="space-y-2">
        {store.workouts.map(w => (
          <div key={w.id} className="bg-white/5 rounded-xl p-4 flex items-center justify-between hover:bg-white/10 transition-colors">
            <div>
              <div className="font-medium">{fmt.date(w.date)}</div>
              <div className="text-xs text-gray-400">{fmt.time(w.date)} · {fmt.duration(w.duration)}</div>
            </div>
          </div>
        ))}
        {!store.workouts.length && (
          <div className="text-center text-gray-500 py-12">
            Sin entrenos aun. Empieza uno nuevo!
          </div>
        )}
      </div>
    </div>
  )
}
