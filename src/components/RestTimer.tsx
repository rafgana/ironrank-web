import { useTimer } from '../hooks/useTimer'
import { useEffect } from 'react'

interface RestTimerProps { startTime: number; onComplete: () => void; onSkip: () => void }

export function RestTimer({ startTime, onComplete, onSkip }: RestTimerProps) {
  const { time, running, start, stop } = useTimer()

  useEffect(() => { if (startTime > 0 && !running) start(startTime) }, [startTime])
  useEffect(() => { if (!running && time === 0 && startTime > 0) onComplete() }, [running, time])

  return (
    <div className="rounded-lg border p-3 flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
      <div>
        <div className="text-xs text-muted-foreground">Descanso</div>
        <div className="text-lg font-bold tabular-nums">
          {Math.floor(time / 60)}:{String(time % 60).padStart(2, '0')}
        </div>
      </div>
      <button onClick={() => { stop(); onSkip() }} className="text-xs text-muted-foreground hover:text-foreground px-3 py-1 rounded-md border" style={{ borderColor: 'var(--border)' }}>
        Saltar
      </button>
    </div>
  )
}
