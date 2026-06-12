import type { SetEntry } from '../models/types'
import { estimatedMax } from '../utils/estimators'
import { fmt } from '../utils/format'

interface SetRowProps {
  set: SetEntry
  onToggle: () => void
}

export function SetRow({ set, onToggle }: SetRowProps) {
  return (
    <div className="flex items-center gap-2 py-2 text-sm">
      <button onClick={onToggle} className="text-lg">
        {set.completed ? '✅' : '⬜'}
      </button>
      <span className="font-medium">{fmt.kg(set.weight)}kg x {set.reps}</span>
      {set.rir !== null && set.rir !== undefined && (
        <span className="text-xs px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400">
          RIR:{set.rir}
        </span>
      )}
      {set.isDropSet && (
        <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold">DROP</span>
      )}
      <span className="ml-auto text-xs text-gray-500">{fmt.kg(estimatedMax(set.weight, set.reps, set.rir))}</span>
    </div>
  )
}
