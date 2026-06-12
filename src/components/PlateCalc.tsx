import { platesDescription, warmupSets } from '../services/plateCalculator'

interface PlateCalcProps {
  weight: number
  barWeight: number
  availablePlates: number[]
}

export function PlateCalc({ weight, barWeight, availablePlates }: PlateCalcProps) {
  if (weight <= barWeight) return null
  const desc = platesDescription(weight, barWeight, availablePlates)
  const warmup = warmupSets(weight, barWeight)

  return (
    <details className="mt-2">
      <summary className="text-xs text-gray-500 cursor-pointer">Plates + Calentamiento</summary>
      <div className="mt-1 text-xs text-gray-400">
        <div className="mb-1">Discos: <span className="text-orange-400">{desc}</span></div>
        <div className="text-gray-500">
          Calentamiento: {warmup.map(w => w.label).join(' → ')}
        </div>
      </div>
    </details>
  )
}
