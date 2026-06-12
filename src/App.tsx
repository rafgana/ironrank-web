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
  { key: 'ranked', icon: '🏆', label: 'Ranked' },
  { key: 'progress', icon: '📊', label: 'Progreso' },
  { key: 'library', icon: '📖', label: 'Biblioteca' },
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
    <div className="min-h-screen md:flex" style={{ background: 'var(--background)' }}>
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex md:flex-col md:fixed md:left-0 md:top-0 md:h-full md:w-60 md:border-r md:z-20"
        style={{ background: 'var(--sidebar)', borderColor: 'var(--sidebar-border)' }}>
        {/* Logo */}
        <div className="flex items-center gap-2 px-5 h-16 border-b" style={{ borderColor: 'var(--sidebar-border)' }}>
          <span className="text-xl">🏋️</span>
          <span className="text-lg font-bold tracking-tight" style={{ color: 'var(--sidebar-primary)' }}>IronRank</span>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1" style={{ overflowY: 'auto' }}>
          {tabs.map(t => {
            const active = tab === t.key
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium rounded-md transition-colors"
                style={{
                  background: active ? 'var(--sidebar-primary)' : 'transparent',
                  color: active ? 'var(--primary-foreground)' : 'var(--sidebar-foreground)',
                  opacity: active ? 1 : 0.7,
                }}>
                <span className="text-base">{t.icon}</span>
                {t.label}
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-5 py-3 border-t text-xs" style={{ borderColor: 'var(--sidebar-border)', color: 'var(--muted-foreground)' }}>
          IronRank v1.0
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 main-content" style={{
        '@media (min-width: 768px)': { marginLeft: '240px' },
        background: 'var(--background)',
      } as any}>
        <div className="max-w-3xl mx-auto px-4 py-6 md:px-8 md:py-10 animate-in">
          {tab === 'home' && <Dashboard onStartWorkout={startWorkout} />}
          {tab === 'workout' && <WorkoutList onStart={startWorkout} />}
          {tab === 'ranked' && <Ranking />}
          {tab === 'progress' && <Progress />}
          {tab === 'library' && <Library />}
          {tab === 'profile' && <Profile />}
        </div>
        <div className="h-20 md:hidden" />
      </main>

      {/* MOBILE NAV */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t flex justify-around items-center px-2 py-3"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        {tabs.map(t => {
          const active = tab === t.key
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="flex flex-col items-center gap-0.5 text-[10px] font-medium px-2"
              style={{ color: active ? 'var(--primary)' : 'var(--muted-foreground)' }}>
              <span className="text-lg">{t.icon}</span>
              {t.label}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
