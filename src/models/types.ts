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

export type Tier = 'Bronze' | 'Prata' | 'Ouro' | 'Platina' | 'Esmeralda' | 'Diamante' | 'Retador'

export const TIERS: Tier[] = ['Bronze', 'Prata', 'Ouro', 'Platina', 'Esmeralda', 'Diamante', 'Retador']

export const TIER_COLORS: Record<Tier, string> = {
  Bronze: '#CD7F32', Prata: '#C0C0C0', Ouro: '#FFD700',
  Platina: '#E5E4E2', Esmeralda: '#50C878', Diamante: '#B9F2FF', Retador: '#FF4500'
}

export const TIER_ICONS: Record<Tier, string> = {
  Bronze: '🥉', Prata: '🥈', Ouro: '🥇', Platina: '💎', Esmeralda: '🟢', Diamante: '🔷', Retador: '👑'
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
