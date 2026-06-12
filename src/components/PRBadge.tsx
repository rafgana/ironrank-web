import type { PRType } from '../models/types'

export function PRBadge({ pr, onDismiss }: { pr: PRType; onDismiss: () => void }) {
  let title = '', detail = ''
  if (pr.kind === '1rm') { title = 'Nuevo 1RM'; detail = `${pr.old.toFixed(1)} → ${pr.new.toFixed(1)} kg` }
  else if (pr.kind === 'reps') { title = 'Rep PR'; detail = `${pr.weight}kg: ${pr.old} → ${pr.new} reps` }
  else { title = 'Volume PR'; detail = `${pr.old} → ${pr.new} kg` }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-in"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onDismiss}>
      <div className="rounded-2xl p-8 text-center max-w-xs mx-4 border"
        style={{ background: 'var(--card)', borderColor: 'var(--primary)', opacity: 0.5 }}>
        <div className="text-6xl mb-4">🏆</div>
        <div className="text-xl font-extrabold mb-1">{title}</div>
        <div className="text-lg font-bold mb-6" style={{ color: 'var(--primary)' }}>{detail}</div>
        <button onClick={onDismiss}
          className="px-6 py-2.5 rounded-xl text-sm font-bold"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
          Seguir
        </button>
      </div>
    </div>
  )
}
