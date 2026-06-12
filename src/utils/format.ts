export const fmt = {
  kg: (v: number) => v === Math.floor(v) ? `${v}` : v.toFixed(1),
  date: (d: Date) => new Date(d).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }),
  time: (d: Date) => new Date(d).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
  duration: (s: number) => `${Math.floor(s / 60)}m ${s % 60}s`,
  pct: (v: number) => `${v > 0 ? '+' : ''}${Math.round(v)}%`,
}
