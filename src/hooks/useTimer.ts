import { useState, useEffect, useRef } from 'react'

export function useTimer() {
  const [time, setTime] = useState(0)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    if (running && time > 0) {
      intervalRef.current = window.setInterval(() => {
        setTime(t => {
          if (t <= 1) { setRunning(false); return 0 }
          return t - 1
        })
      }, 1000)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running, time === 0])

  const start = (seconds: number) => { setTime(seconds); setRunning(true) }
  const stop = () => { setTime(0); setRunning(false) }

  return { time, running, start, stop }
}
