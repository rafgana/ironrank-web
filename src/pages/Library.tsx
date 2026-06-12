import { useEffect, useState } from 'react'
import { db } from '../db/database'
import { useProfileStore } from '../store/profileStore'
import { bestSetForExercise } from '../db/queries'
import { estimatedMax } from '../utils/estimators'
import { tierFor } from '../services/rankingService'
import type { Exercise, Tier } from '../models/types'
import { TIER_ICONS } from '../models/types'

export function Library() {
  const [exs, setExs] = useState<(Exercise & { tier?: Tier })[]>([])
  const [search, setSearch] = useState('')
  const [muscle, setMuscle] = useState<string | null>(null)
  const p = useProfileStore(s => s.profile)

  useEffect(() => { if (p) load() }, [p])

  const load = async () => {
    let all = await db.exercises.toArray()
    if (p) {
      all = await Promise.all(all.map(async e => {
        const best = await bestSetForExercise(e.id!)
        if (!best) return e
        return { ...e, tier: tierFor(estimatedMax(best.weight, best.reps, best.rir), p.bodyweight, p.gender, p.age, e.name) }
      }))
    }
    setExs(all)
  }

  const muscles = [...new Set(exs.map(e => e.musclePrimary))].sort()
  const filtered = exs.filter(e =>
    (!muscle || e.musclePrimary === muscle) &&
    (!search || e.name.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="space-y-4 animate-in">
      <h1 className="text-2xl font-extrabold tracking-tight">Biblioteca</h1>

      <input type="search" placeholder="Buscar ejercicios..." value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full px-4 py-3 rounded-xl text-sm"
        style={{ background: 'var(--input)', color: 'var(--foreground)', border: '1px solid var(--border)' }} />

      <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1">
        <FilterPill label="Todos" active={!muscle} onClick={() => setMuscle(null)} />
        {muscles.map(m => (
          <FilterPill key={m} label={m} active={muscle === m} onClick={() => setMuscle(muscle === m ? null : m)} />
        ))}
      </div>

      <div className="space-y-1">
        {filtered.map(e => (
          <div key={e.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:brightness-110 transition-all"
            style={{ background: 'transparent' }}>
            <div>
              <div className="text-sm font-medium">{e.name}</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                {e.musclePrimary} · {e.equipment}
              </div>
            </div>
            {e.tier && <span className="text-lg">{TIER_ICONS[e.tier]}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap transition-all"
      style={{
        background: active ? 'var(--primary)' : 'var(--secondary)',
        color: active ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
      }}>
      {label}
    </button>
  )
}
