import { useTimer } from '../hooks/useTimer'
import { useEffect } from 'react'

interface RestTimerProps {
  startTime: number
  onComplete: () => void
  onSkip: () => void
}

export function RestTimer({ startTime, onComplete, onSkip }: RestTimerProps) {
  const { time, running, start, stop } = useTimer()

  useEffect(() => {
    if (startTime > 0 && !running) start(startTime)
  }, [startTime])

  useEffect(() => {
    if (!running && time === 0 && startTime > 0) onComplete()
  }, [running, time])

  return (
    <div className="bg-white/5 rounded-xl p-3 flex items-center justify-between animate-in">
      <div>
        <div className="text-xs text-gray-400">Descanso</div>
        <div className="text-xl font-bold tabular-nums">
          {Math.floor(time / 60)}:{String(time % 60).padStart(2, '0')}
        </div>
      </div>
      <button
        onClick={() => { stop(); onSkip() }}
        className="text-xs text-gray-400 hover:text-white px-3 py-1 rounded-lg bg-white/5"
      >
        Saltar
      </button>
    </div>
  )
}
