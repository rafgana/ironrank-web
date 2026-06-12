import type { PRType } from '../models/types'

export function PRBadge({ pr, onDismiss }: { pr: PRType; onDismiss: () => void }) {
  let title = ''
  let detail = ''

  if (pr.kind === '1rm') {
    title = '¡Nuevo 1RM!'
    detail = `${pr.old.toFixed(1)} → ${pr.new.toFixed(1)} kg`
  } else if (pr.kind === 'reps') {
    title = '¡Rep PR!'
    detail = `${pr.weight}kg: ${pr.old} → ${pr.new} reps`
  } else if (pr.kind === 'volume') {
    title = '¡Volume PR!'
    detail = `${pr.old} → ${pr.new} kg`
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onDismiss}>
      <div className="bg-zinc-900 rounded-2xl p-8 text-center max-w-xs border border-orange-500/30">
        <div className="text-6xl mb-3">🏆</div>
        <div className="text-xl font-bold mb-1">{title}</div>
        <div className="text-orange-400 text-lg mb-4">{detail}</div>
        <button onClick={onDismiss} className="bg-orange-500 text-white px-6 py-2 rounded-xl font-medium">
          Seguir
        </button>
      </div>
    </div>
  )
}
