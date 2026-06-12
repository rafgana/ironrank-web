interface RIRSelectorProps {
  selected: number | null
  onChange: (rir: number | null) => void
}

export function RIRSelector({ selected, onChange }: RIRSelectorProps) {
  const options = [
    { value: 0, label: 'Fallo', color: '#ef444480' },
    { value: 1, label: '1', color: '#f9731680' },
    { value: 2, label: '2', color: '#eab30880' },
    { value: 3, label: '3', color: '#22c55e80' },
    { value: 4, label: '4+', color: '#3b82f680' },
  ]

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-gray-400 mr-1">RIR:</span>
      {options.map(opt => (
        <button
          key={opt.value}
          className={`text-xs font-bold px-2.5 py-1 rounded-full transition-colors ${
            selected === opt.value ? 'text-white' : 'text-gray-400 bg-white/5'
          }`}
          style={selected === opt.value ? { background: opt.color } : {}}
          onClick={() => onChange(selected === opt.value ? null : opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
