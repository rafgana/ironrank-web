import type { SetEntry } from '../models/types'
import { estimatedMax } from '../utils/estimators'
import { fmt } from '../utils/format'

interface SetRowProps { set: SetEntry; onToggle: () => void }

export function SetRow({ set, onToggle }: SetRowProps) {
  return (
    <div className="flex items-center gap-2.5 py-1.5 px-2 rounded-md text-sm transition-colors"
      style={{ background: set.completed ? 'var(--secondary)' : 'transparent' }}>
      <button onClick={onToggle} className="text-base" style={{ opacity: set.completed ? 1 : 0.4 }}>
        {set.completed ? '✅' : '○'}
      </button>
      <span className="font-semibold tabular-nums">{fmt.kg(set.weight)}kg <span className="font-normal">×</span> {set.reps}</span>
      {set.rir !== null && set.rir !== undefined && (
        <span className="text-[11px] px-1.5 py-0.5 rounded font-medium" style={{ background: 'var(--primary)', opacity: 0.15, color: 'var(--primary)' }}>
          RIR {set.rir}
        </span>
      )}
      {set.isDropSet && (
        <span className="text-[11px] px-1.5 py-0.5 rounded font-bold" style={{ background: 'oklch(0.55 0.2 25)', opacity: 0.15, color: 'oklch(0.55 0.2 25)' }}>
          DROP
        </span>
      )}
      <span className="ml-auto text-xs tabular-nums">{fmt.kg(estimatedMax(set.weight, set.reps, set.rir))}</span>
    </div>
  )
}
