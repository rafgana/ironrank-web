import type { SetEntry } from '../models/types'
import { estimatedMax } from '../utils/estimators'
import { fmt } from '../utils/format'

interface SetRowProps { set: SetEntry; onToggle: () => void }

export function SetRow({ set, onToggle }: SetRowProps) {
  return (
    <div className="flex items-center gap-2 py-1.5 text-sm">
      <button onClick={onToggle} className="text-base">
        {set.completed ? '✅' : '◯'}
      </button>
      <span className="font-medium tabular-nums">{fmt.kg(set.weight)}kg × {set.reps}</span>
      {set.rir !== null && set.rir !== undefined && (
        <span className="text-xs px-1.5 py-0.5 rounded-full bg-orange-500/10 text-orange-400 font-medium">
          RIR {set.rir}
        </span>
      )}
      {set.isDropSet && (
        <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400 font-semibold">DROP</span>
      )}
      <span className="ml-auto text-xs text-muted-foreground tabular-nums">{fmt.kg(estimatedMax(set.weight, set.reps, set.rir))}</span>
    </div>
  )
}
