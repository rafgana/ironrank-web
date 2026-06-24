export interface Workout {
  id?: number
  date: Date
  duration: number
  notes: string
  restStartTimestamp?: number | null
  restDuration?: number
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

export type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Dom, 1=Lun, ..., 6=Sáb

/**
 * Log de acciones del usuario — para análisis con IA.
 * Cada acción captura: qué pasó + contexto del usuario al momento.
 * Persiste en IndexedDB; rotación FIFO a 5000 entries.
 */
export type ActionKind =
  | "workout_started"
  | "workout_completed"
  | "workout_abandoned"
  | "set_logged"
  | "pr_set"
  | "tier_up"
  | "routine_created"
  | "routine_updated"
  | "routine_deleted"
  | "routine_exercise_added"
  | "routine_exercise_removed"
  | "profile_updated"
  | "goal_updated"
  | "theme_changed"
  | "export_data"
  | "import_data"
  | "wipe_data"
  | "app_installed"
  | "command_palette_opened"
  | "share_card_generated"
  | "error_caught"
  | "login_started"
  | "login_skipped"
  | "login_screen_shown"
  | "login_mode_switch"
  | "signup_started"
  | "logout_clicked"
  | "logout_completed"
  | "cloud_sync_offer_clicked"
  | "auth_guard_passed"
  | "sync_completed"
  | "sync_failed"
  | "sync_skipped"
  | "sync_full_on_login"
  | "sync_failed_on_login"
  | "sync_conflicts_detected"
  | "sync_conflict_resolved"
  | "sync_conflict_resolve_failed"
  | "sync_conflicts_dismissed"
  | "network_back_online"
  | "network_offline"
  | "auto_sync_on_network_recovery"
  | "schema_migrated"
  | "routine_create_validation_failed"
  | "token_refreshed"
  | "user_updated"
  | "auto_backup_created"
  | "auto_backup_downloaded"
  | "auto_backup_dismissed"
  | "auto_backup_failed"
  | "realtime_change_received"
  | "realtime_subscribed"
  | "realtime_unsubscribed"
  | "realtime_channel_error"
  | "realtime_applied"
  | "realtime_apply_failed"
  | "realtime_delete_skipped"
  | "sync_manual_triggered"
  | "account_deleted"
  | "account_deleted_completed";

export interface ActionLog {
  id?: number;
  /** ISO timestamp */
  timestamp: string;
  /** Categoría de acción */
  kind: ActionKind;
  /** Subtipo: workout_started → "press_banca"; routine_updated → "days" */
  category?: string;
  /** Payload específico: { weight: 100, reps: 5, exercise: "Press Banca" } */
  payload?: Record<string, string | number | boolean | null | undefined>;
  /** Contexto automático */
  context: {
    tier?: string;
    streakDays?: number;
    totalWorkouts?: number;
    sessionId?: string;
    appVersion?: string;
    viewport?: { w: number; h: number };
    online?: boolean;
  };
}
export const WEEK_DAY_LABELS: Record<WeekDay, string> = {
  0: "Dom", 1: "Lun", 2: "Mar", 3: "Mié", 4: "Jue", 5: "Vie", 6: "Sáb",
};
export const WEEK_DAY_NAMES: Record<WeekDay, string> = {
  0: "Domingo", 1: "Lunes", 2: "Martes", 3: "Miércoles",
  4: "Jueves", 5: "Viernes", 6: "Sábado",
};

export interface Routine {
  id?: number
  name: string
  createdAt: Date
  /** Días de la semana en que se debe hacer este workout (0-6). Vacío = "cuando sea". */
  days: WeekDay[]
  /** Notas opcionales del usuario sobre este workout. */
  notes?: string
}

export interface BodyMeasurement {
  id?: number
  date: Date
  /** Peso corporal en kg. 0 = sin registrar. */
  bodyweight: number
  /** Porcentaje de grasa (0-100). 0 = sin registrar. */
  bodyFatPct: number
  /** Perímetro de cintura en cm. 0 = sin registrar. */
  waistCm: number
  /** Perímetro de pecho en cm. 0 = sin registrar. */
  chestCm: number
  /** Perímetro de brazo en cm. 0 = sin registrar. */
  armCm: number
  /** Perímetro de muslo en cm. 0 = sin registrar. */
  thighCm: number
  notes?: string
}

export interface RoutineExercise {
  id?: number
  routineId: number
  exerciseId: number
  order: number
  /** Sets objetivo para este ejercicio (ej: "3x8", "4x10-12"). Opcional. */
  targetSets?: number
  /** Reps objetivo (ej: "8", "10-12"). Opcional. */
  targetReps?: string
  /** Peso objetivo (kg). Opcional, sugerencias inteligentes después. */
  targetWeight?: number
  /** Descanso objetivo en segundos (override del default). */
  targetRest?: number
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
  /** Objetivo de volumen semanal en kg. 0 = sin objetivo. */
  weeklyVolumeGoal?: number
  /** Cuántos workouts por semana quiere hacer el usuario. 0 = sin objetivo. */
  weeklyWorkoutsGoal?: number
  /** Meta del usuario (fuerza, músculo, general, rendimiento). */
  goal?: 'strength' | 'muscle' | 'general' | 'performance'
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
