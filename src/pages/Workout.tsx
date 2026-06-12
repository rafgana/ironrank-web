import { useWorkoutStore } from '../store/workoutStore'

export function WorkoutList({ onStart }: { onStart: () => void }) {
  const s = useWorkoutStore()

  return (
    <div className="space-y-4 animate-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight">Entrenos</h1>
        <button onClick={onStart}
          className="px-4 py-2 rounded-lg text-sm font-bold transition-all active:scale-[0.98]"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
          + Nuevo
        </button>
      </div>

      {!s.workouts.length ? (
        <div className="text-center py-16" style={{ color: 'var(--muted-foreground)' }}>
          <div className="text-5xl mb-3">🏋️</div>
          <p className="text-sm">Aun no tienes entrenos guardados</p>
          <button onClick={onStart} className="mt-4 text-sm font-bold" style={{ color: 'var(--primary)' }}>
            Empezar primer workout
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {s.workouts.map(w => (
            <div key={w.id} className="card p-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">
                  {new Date(w.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                  {new Date(w.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <div className="text-sm tabular-nums font-medium" style={{ color: 'var(--muted-foreground)' }}>
                {Math.floor(w.duration / 60)}m {w.duration % 60}s
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
