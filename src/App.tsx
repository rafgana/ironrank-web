import { useState, useEffect } from 'react'
import { Dashboard } from './pages/Dashboard'
import { ActiveWorkout } from './pages/ActiveWorkout'
import { WorkoutList } from './pages/Workout'
import { Ranking } from './pages/Ranking'
import { Progress } from './pages/Progress'
import { Library } from './pages/Library'
import { Profile } from './pages/Profile'
import { useWorkoutStore } from './store/workoutStore'
import { useProfileStore } from './store/profileStore'

type Tab = 'home' | 'workout' | 'progress' | 'ranked' | 'library' | 'profile'

const tabs: { key: Tab; icon: string; label: string }[] = [
  { key: 'home', icon: '🏠', label: 'Inicio' },
  { key: 'workout', icon: '🏋️', label: 'Entreno' },
  { key: 'progress', icon: '📊', label: 'Progreso' },
  { key: 'ranked', icon: '🏆', label: 'Ranked' },
  { key: 'library', icon: '📚', label: 'Biblioteca' },
  { key: 'profile', icon: '👤', label: 'Perfil' },
]

export default function App() {
  const [tab, setTab] = useState<Tab>('home')
  const [showWorkout, setShowWorkout] = useState(false)
  const ws = useWorkoutStore()
  const ps = useProfileStore()

  useEffect(() => { ws.loadWorkouts(); ws.loadProfile(); ps.load() }, [])

  const startWorkout = async () => { await ws.startWorkout(); setShowWorkout(true) }

  if (showWorkout && ws.activeWorkout) {
    return <ActiveWorkout onComplete={() => { setShowWorkout(false); ws.loadWorkouts() }} />
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ background: 'var(--background)' }}>
      {/* Desktop sidebar */}
      <nav className="hidden md:flex md:flex-col md:w-60 md:min-h-screen md:border-r md:z-30 md:fixed md:left-0 md:top-0"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <div className="px-4 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--primary)' }}>
            <span>🏆</span> <span>IronRank</span>
          </div>
        </div>
        <div className="flex-1 px-2 py-3 space-y-0.5">
          {tabs.map(t => {
            const active = tab === t.key
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className="flex items-center gap-3 px-3 py-2.5 w-full text-left text-sm rounded-md transition-colors"
                style={{
                  color: active ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                  background: active ? 'var(--primary)' : 'transparent',
                  fontWeight: active ? 600 : 400,
                }}>
                <span className="text-base">{t.icon}</span>
                <span>{t.label}</span>
              </button>
            )
          })}
        </div>
        <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>v1.0</span>
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 min-h-screen main-content">
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 md:py-10">
          {tab === 'home' && <Dashboard onStartWorkout={startWorkout} />}
          {tab === 'workout' && <WorkoutList onStart={startWorkout} />}
          {tab === 'progress' && <Progress />}
          {tab === 'ranked' && <Ranking />}
          {tab === 'library' && <Library />}
          {tab === 'profile' && <Profile />}
        </div>
        <div className="h-20 md:hidden" />
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-2 py-2 flex justify-around border-t"
        style={{ background: 'oklch(0.18 0 0 / 0.95)', borderColor: 'var(--border)', backdropFilter: 'blur(12px)' }}>
        {tabs.map(t => {
          const active = tab === t.key
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-md text-xs transition-colors"
              style={{ color: active ? 'var(--primary)' : 'var(--muted-foreground)' }}>
              <span className="text-lg">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
