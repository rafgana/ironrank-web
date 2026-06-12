import { useProfileStore } from '../store/profileStore'
import { useEffect, useState } from 'react'

export function Profile() {
  const store = useProfileStore()
  const [dark, setDark] = useState(false)

  useEffect(() => { store.load() }, [])

  if (!store.profile) return <div className="p-4">Cargando...</div>

  const p = store.profile

  return (
    <div className="px-4 md:px-6 pt-4 md:pt-8 pb-4 max-w-lg">
      <h2 className="text-lg font-bold md:text-2xl mb-4">Perfil</h2>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm">Edad</span>
          <input type="number" value={p.age} onChange={e => store.update({ age: +e.target.value })}
            className="w-20 text-sm text-right" />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm">Genero</span>
          <select value={p.gender} onChange={e => store.update({ gender: e.target.value as any })}
            className="w-28 text-sm">
            <option value="male">Hombre</option>
            <option value="female">Mujer</option>
          </select>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm">Peso (kg)</span>
          <input type="number" value={p.bodyweight} onChange={e => store.update({ bodyweight: +e.target.value })}
            className="w-20 text-sm text-right" />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm">Descanso (seg)</span>
          <input type="number" value={p.restTimerDefault} onChange={e => store.update({ restTimerDefault: +e.target.value })}
            className="w-20 text-sm text-right" />
        </div>
      </div>

      <div className="pt-4">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm">Modo Oscuro</span>
          <input type="checkbox" checked={dark} onChange={e => setDark(e.target.checked)} className="w-5 h-5" />
        </label>
      </div>
    </div>
  )
}
