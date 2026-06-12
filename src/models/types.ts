export interface Workout {
  id?: number
  date: Date
  duration: number
  notes: string
}

export interface WorkoutExercise {
  id?: number
  workoutId: number
  exerciseId: number
  order: number
}

export interface SetEntry {
  id?: number
  workoutExerciseId: number
  weight: number
  reps: number
  rir: number | null
  note: string | null
  order: number
  completed: boolean
  isDropSet: boolean
  supersetGroupId: string | null
}

export interface Exercise {
  id?: number
  name: string
  musclePrimary: string
  muscleSecondary: string | null
  equipment: string
  instructions: string
  alternatives: string[]
}

export interface Routine {
  id?: number
  name: string
  createdAt: Date
}

export interface RoutineExercise {
  id?: number
  routineId: number
  exerciseId: number
  order: number
}

export interface UserProfile {
  id?: number
  age: number
  gender: 'male' | 'female'
  bodyweight: number
  height: number
  restTimerDefault: number
  useKg: boolean
  availablePlates: number[]
}

export type Tier =
  | 'Bronce'
  | 'Plata'
  | 'Oro'
  | 'Platino'
  | 'Esmeralda'
  | 'Diamante'
  | 'Retador'

export const TIERS: Tier[] = [
  'Bronce',
  'Plata',
  'Oro',
  'Platino',
  'Esmeralda',
  'Diamante',
  'Retador',
]

// Hex reales (equivalentes a los OKLch de index.css) — solo para canvas
// (confetti) y SVG raster, que no resuelven CSS vars. La UI usa TIER_VARS.
export const TIER_COLORS: Record<Tier, string> = {
  Bronce: '#C08445',
  Plata: '#C2C4CC',
  Oro: '#ECC940',
  Platino: '#4FC8E8',
  Esmeralda: '#2FBF8F',
  Diamante: '#A8DCFF',
  Retador: '#F04457',
}

export const TIER_COLORS_2: Record<Tier, string> = {
  Bronce: '#8A5A2A',
  Plata: '#8B8E99',
  Oro: '#C0A020',
  Platino: '#2DA3C2',
  Esmeralda: '#1D9670',
  Diamante: '#6DB9F5',
  Retador: '#C52F44',
}

// Referencias CSS var — la forma canónica de colorear UI por tier
export const TIER_VARS: Record<Tier, string> = {
  Bronce: 'var(--color-tier-bronce)',
  Plata: 'var(--color-tier-plata)',
  Oro: 'var(--color-tier-oro)',
  Platino: 'var(--color-tier-platino)',
  Esmeralda: 'var(--color-tier-esmeralda)',
  Diamante: 'var(--color-tier-diamante)',
  Retador: 'var(--color-tier-retador)',
}

export const TIER_VARS_DEEP: Record<Tier, string> = {
  Bronce: 'var(--color-tier-bronce-deep)',
  Plata: 'var(--color-tier-plata-deep)',
  Oro: 'var(--color-tier-oro-deep)',
  Platino: 'var(--color-tier-platino-deep)',
  Esmeralda: 'var(--color-tier-esmeralda-deep)',
  Diamante: 'var(--color-tier-diamante-deep)',
  Retador: 'var(--color-tier-retador-deep)',
}

/** Devuelve un color-mix translúcido del color de un tier (sustituye `${hex}1A`) */
export function tierAlpha(tier: Tier, pct: number): string {
  return `color-mix(in oklab, ${TIER_VARS[tier]} ${pct}%, transparent)`
}

export const TIER_SLUGS: Record<Tier, string> = {
  Bronce: 'bronce',
  Plata: 'plata',
  Oro: 'oro',
  Platino: 'platino',
  Esmeralda: 'esmeralda',
  Diamante: 'diamante',
  Retador: 'retador',
}

export const TIER_LABELS: Record<Tier, string> = {
  Bronce: 'IV',
  Plata: 'IV',
  Oro: 'IV',
  Platino: 'IV',
  Esmeralda: 'IV',
  Diamante: 'IV',
  Retador: '',
}

export interface ProgressionSuggestion {
  weight: number
  reps: number
  reason: string
}

export type PRType =
  | { kind: '1rm'; old: number; new: number }
  | { kind: 'reps'; weight: number; old: number; new: number }
  | { kind: 'volume'; old: number; new: number }
