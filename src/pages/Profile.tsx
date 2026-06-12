import { useProfileStore } from '../store/profileStore'
import { useEffect } from 'react'

export function Profile() {
  const s = useProfileStore()
  useEffect(() => { s.load() }, [])
  const p = s.profile
  if (!p) return null

  const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: 'var(--border)' }}>
      <span className="text-sm">{label}</span>
      {children}
    </div>
  )

  return (
    <div className="space-y-6 animate-in">
      <h1 className="text-2xl font-extrabold tracking-tight">Perfil</h1>

      <div className="card">
        <Row label="Edad">
          <input type="number" value={p.age} onChange={e => s.update({ age: +e.target.value })}
            className="w-16 text-sm text-right font-semibold"
            style={{ background: 'transparent', color: 'var(--foreground)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '4px 8px' }} />
        </Row>
        <Row label="Genero">
          <select value={p.gender} onChange={e => s.update({ gender: e.target.value as any })}
            className="text-sm font-semibold"
            style={{ background: 'var(--secondary)', color: 'var(--foreground)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '4px 8px' }}>
            <option value="male">Hombre</option>
            <option value="female">Mujer</option>
          </select>
        </Row>
        <Row label="Peso corporal">
          <input type="number" value={p.bodyweight} onChange={e => s.update({ bodyweight: +e.target.value })}
            className="w-16 text-sm text-right font-semibold"
            style={{ background: 'transparent', color: 'var(--foreground)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '4px 8px' }} />
          <span className="text-sm ml-1" style={{ color: 'var(--muted-foreground)' }}>kg</span>
        </Row>
        <Row label="Descanso">
          <input type="number" value={p.restTimerDefault} onChange={e => s.update({ restTimerDefault: +e.target.value })}
            className="w-16 text-sm text-right font-semibold"
            style={{ background: 'transparent', color: 'var(--foreground)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '4px 8px' }} />
          <span className="text-sm ml-1" style={{ color: 'var(--muted-foreground)' }}>seg</span>
        </Row>
        <Row label="Altura">
          <input type="number" value={p.height} onChange={e => s.update({ height: +e.target.value })}
            className="w-16 text-sm text-right font-semibold"
            style={{ background: 'transparent', color: 'var(--foreground)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '4px 8px' }} />
          <span className="text-sm ml-1" style={{ color: 'var(--muted-foreground)' }}>cm</span>
        </Row>
      </div>

      <div className="card p-4 text-center">
        <div className="text-3xl font-extrabold tabular-nums" style={{ color: 'var(--primary)' }}>🏆</div>
        <div className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
          Tus datos se usan para calcular tu rango en el sistema ranked
        </div>
      </div>
    </div>
  )
}
