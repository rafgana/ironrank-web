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
    <div className="min-h-screen bg-[#0f0f0f] text-white flex flex-col md:flex-row">
      {/* Sidebar nav - desktop */}
      <nav className="hidden md:flex md:flex-col md:w-56 md:min-h-screen md:border-r md:border-white/10 md:bg-zinc-950 md:p-3 md:gap-1 md:fixed md:left-0 md:top-0">
        <div className="text-orange-400 font-bold text-lg px-3 py-3 mb-2">IronRank</div>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left w-full ${
              tab === t.key ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'text-gray-400 hover:bg-white/5'
            }`}>
            <span className="text-lg">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>

      {/* Main content */}
      <div className="flex-1 md:ml-56 overflow-auto">
        <div className="max-w-4xl mx-auto">
          {tab === 'home' && <Dashboard onStartWorkout={startWorkout} />}
          {tab === 'workout' && <WorkoutList onStart={startWorkout} />}
          {tab === 'progress' && <Progress />}
          {tab === 'ranked' && <Ranking />}
          {tab === 'library' && <Library />}
          {tab === 'profile' && <Profile />}
        </div>
        <div className="h-20 md:hidden" />
      </div>

      {/* Bottom nav - mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-900/90 backdrop-blur border-t border-white/10 px-2 py-2 flex justify-around z-40">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-xs transition-colors ${
              tab === t.key ? 'text-orange-400' : 'text-gray-500'
            }`}>
            <span className="text-lg">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
