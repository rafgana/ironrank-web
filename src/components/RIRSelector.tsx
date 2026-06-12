interface RIRSelectorProps { selected: number | null; onChange: (rir: number | null) => void }

export function RIRSelector({ selected, onChange }: RIRSelectorProps) {
  const options = [
    { value: 0, label: 'Fallo' },
    { value: 1, label: '1' },
    { value: 2, label: '2' },
    { value: 3, label: '3' },
    { value: 4, label: '4+' },
  ]

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-muted-foreground mr-1">RIR</span>
      {options.map(opt => (
        <button key={opt.value} onClick={() => onChange(selected === opt.value ? null : opt.value)}
          className="text-xs font-semibold px-2.5 py-1 rounded-full transition-colors"
          style={{
            background: selected === opt.value ? 'var(--primary)' : 'var(--secondary)',
            color: selected === opt.value ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
          }}>
          {opt.label}
        </button>
      ))}
    </div>
  )
}
