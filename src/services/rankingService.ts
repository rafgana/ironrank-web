import { TIERS, type Tier } from '../models/types'

/**
 * Standards de fuerza relativa — segmento por género y edad.
 * Los ratios son peso_movido / peso_corporal (no Wilks).
 * Fuente: derivado de IPF GL + OpenPowerlifting, bucketed para población general.
 */
export interface StandardsEntry {
  ageMin: number
  ageMax: number
  bronce: number
  plata: number
  oro: number
  platino: number
  esmeralda: number
  diamante: number
  retador: number
}

export interface StandardsExercise {
  entries: {
    hombre: StandardsEntry[]
    mujer: StandardsEntry[]
  }
}

/** Set de ejercicios canónicos (real o sintético). */
export type ExerciseKey = string
export type StandardsPayload = Record<ExerciseKey, StandardsExercise>
export type Gender = 'hombre' | 'mujer'

export const STANDARDS_URL = `${import.meta.env.BASE_URL || '/'}strength_standards.json`

/** Carga el JSON con cache en memoria. */
let _cache: StandardsPayload | null = null
let _loading: Promise<StandardsPayload> | null = null

export async function loadStandards(): Promise<StandardsPayload> {
  if (_cache) return _cache
  if (_loading) return _loading
  _loading = fetch(STANDARDS_URL)
    .then(r => r.json())
    .then((j: StandardsPayload) => {
      _cache = j
      _loading = null
      return j
    })
    .catch(err => {
      _loading = null
      throw err
    })
  return _loading
}

/** Mapa alias → key del JSON. Para casos que no se resuelven con fuzzy matching. */
const EXERCISE_ALIAS: Record<string, string> = {
  'press banca': 'press_banca',
  'sentadilla': 'sentadilla',
  'peso muerto': 'peso_muerto',
  'press banca con manca': 'press_banca_mancuerna',
  'press banca mancuerna': 'press_banca_mancuerna',
  'press banca close grip': 'press_banca_close_grip',
  'peso muerto sumo': 'peso_muerto_sumo',
  'peso muerto piernas rigidas': 'peso_muerto_piernas_rigidas',
  'peso muerto pierna rigida': 'peso_muerto_piernas_rigidas',
  'peso muerto una pierna': 'peso_muerto_una_pierna',
  'peso muerto rack': 'peso_muerto_rack',
  'peso muerto rumano': 'peso_muerto_rumano',
  'jalon': 'jalones',
  'jalones agarre estrecho': 'jalones_agarre_estrecho',
  'jalon agarre estrecho': 'jalones_agarre_estrecho',
  'extension': 'extensiones',
  'extension cuadriceps': 'extensiones',
  'curl femoral tumbado': 'curl_femoral_tumbado',
  'gemelo': 'gemelos_de_pie',
  'gemelos': 'gemelos_de_pie',
  'press frances': 'press_frances',
  'press sentado': 'press_militar_sentado',
  'press militar': 'press_militar',
  'elevacion lateral': 'elevaciones_laterales',
  'elevaciones laterales': 'elevaciones_laterales',
  'extension triceps': 'extensiones_triceps',
  'cuerda triceps': 'cuerda_triceps',
  'patada triceps': 'patada_triceps',
  'patada gluteo': 'patada_gluteo_polea',
  'press inclinado': 'press_inclinado',
  'press declinado': 'press_banca_declinado',
  'press banca declinado': 'press_banca_declinado',
  'abduccion': 'abductores',
  'aduccion': 'aductores',
  'adductor': 'aductores',
  'abductor': 'abductores',
  'mountain climber': 'mountain_climbers',
  'mountain climbers': 'mountain_climbers',
  'v up': 'v_ups',
  'v-ups': 'v_ups',
  'hiperextension': 'hiperextensiones',
  'peso muerto piernas': 'peso_muerto_piernas_rigidas',
  'cruce polea': 'cruce_poleas',
  'cruce poleas': 'cruce_poleas',
  'crunch': 'abdominales',
  'crunches': 'abdominales',
  'crunch polea': 'crunches_polea',
  'prensa gemelo': 'prensa_gemelos',
  'prensa gemelos': 'prensa_gemelos',
  'sentadilla bulgara': 'sentadilla_bulgara',
  'buenos dias': 'buenos_dias',
  'glute bridge': 'glute_bridge',
  'hip thrust': 'hip_thrust',
  'press sillon': 'press_sillon',
  'sentadilla goblet': 'sentadilla_goblet',
  'sentadilla frontal': 'sentadilla_frontal',
  'sentadilla hack': 'sentadilla_hack',
  'extension polea': 'extensiones',
  'extensions polea': 'extensiones_polea_tras_nuca',
  'flexion': 'flexiones',
  'flexiones': 'flexiones',
  'press arnold': 'press_arnold',
  'pajaro': 'pajaro',
  'remo polea': 'remo_polea',
  'remo barra': 'remo_barra',
  'remo mancuerna': 'remo_mancuerna',
  'remo pendlay': 'remo_pendlay',
  'remo t': 'remo_t',
  'face pull': 'face_pull',
  'curl barra': 'curl_barra',
  'curl mancuerna': 'curl_mancuerna',
  'curl martillo': 'curl_martillo',
  'curl polea': 'curl_polea',
  'curl concentrado': 'curl_concentrado',
  'curl inverso': 'curl_inverso',
  'curl predicador': 'curl_predicador',
  'curl araña': 'curl_araña',
  'curl barra w': 'curl_barra_w',
  'curl w': 'curl_barra_w',
  'dominada': 'dominadas',
  'dominadas': 'dominadas',
  'dominadas asistidas': 'dominadas_asistidas',
  'apertura': 'aperturas',
  'aperturas': 'aperturas',
  'aperturas polea': 'aperturas_polea',
  'apertura polea': 'aperturas_polea',
  'aperturas inclinadas': 'aperturas_inclinadas',
  'pullover': 'pullover',
  'fonder': 'fondos',
  'fondos': 'fondos',
  'fondos triceps': 'fondos_triceps',
  'sentadilla sumo': 'sentadilla',
  'zancada': 'zancadas',
  'zancadas': 'zancadas',
  'zancada lateral': 'zancada_lateral',
  'step up': 'step_ups',
  'step ups': 'step_ups',
  'abdominal': 'abdominales',
  'abdominales': 'abdominales',
  'plancha': 'plancha',
  'russian twist': 'russian_twist',
  'elevacion piernas': 'elevacion_piernas',
  'elevacion piernna': 'elevacion_piernas',
  'bicicleta': 'bicicleta',
  'elevacion pelvis': 'elevacion_pelvis',
  'press militar sentado': 'press_militar_sentado',
  'pulover': 'pullover',
  'cable crunch': 'crunches_polea',
  'facepull': 'face_pull',
  'pulldown': 'jalones',
  'pull over': 'pullover',
  'bulgarian split': 'sentadilla_bulgara',
  'rdl': 'peso_muerto_rumano',
  'sdlp': 'peso_muerto_piernas_rigidas',
  'extensión': 'extensiones',
  'curl': 'curl_barra',
  'sentadilla profunda': 'sentadilla',
  'press banca cerrado': 'press_banca_close_grip',
  'elevacion frontal': 'elevaciones_frontales',
  'gemelo sentado': 'gemelos_sentado',
  'gemelos de pie': 'gemelos_de_pie',
  'press militar de pie': 'press_militar',
  'press banca plano': 'press_banca',
  'press banca inclinado': 'press_inclinado',
  'press banca decline': 'press_banca_declinado',
  'press mancuerna': 'press_mancuerna',
  'press con mancuerna': 'press_mancuerna',
  'press inclinado mancuerna': 'aperturas_inclinadas',
  'press mancuerna inclinado': 'aperturas_inclinadas',
  'remo con mancuerna': 'remo_mancuerna',
  'remo a una mano': 'remo_mancuerna',
  'pulldown cerrado': 'jalones_agarre_estrecho',
  'jalon cerrado': 'jalones_agarre_estrecho',
  'prensa': 'prensa',
  'prensa piernas': 'prensa',
  'maquina': 'prensa',
  'polea': 'jalones',
  'remo': 'remo_barra',
  'elevacion': 'elevaciones_laterales',
  'extension triceps polea': 'cuerda_triceps',
  'press cerrado': 'press_banca_close_grip',
  'close grip bench': 'press_banca_close_grip',
  'curl inclinado': 'curl_predicador',
  'curl scott': 'curl_predicador',
  'preacher curl': 'curl_predicador',
  'spider curl': 'curl_araña',
  'hammer curl': 'curl_martillo',
  'biceps': 'curl_barra',
  'triceps': 'extensiones_triceps',
  'pecho': 'press_banca',
  'espalda': 'remo_barra',
  'hombro': 'press_militar',
  'hombros': 'press_militar',
  'pierna': 'sentadilla',
  'piernas': 'sentadilla',
  'biceps femoral': 'curl_femoral',
  'cuadriceps': 'extensiones',
  'femoral': 'curl_femoral',
  'gluteo': 'hip_thrust',
  'gluteos': 'hip_thrust',
  'core': 'abdominales',
  'abdominales oblicuos': 'russian_twist',
  'lateral': 'elevaciones_laterales',
  'pajarito': 'pajaro',
  'pajaros': 'pajaro',
  'pájaro': 'pajaro',
  'pájaros': 'pajaro',
  'v-sit': 'v_ups',
  'bicicleta abdominal': 'bicicleta',
  'mountain': 'mountain_climbers',
  'climbers': 'mountain_climbers',
  'mountain-climbers': 'mountain_climbers',
  'press de hombros': 'press_militar',
  'press hombro': 'press_militar',
  'press hombros': 'press_militar',
  'jalon al pecho': 'jalones',
  'jalon pecho': 'jalones',
  'pulldown pecho': 'jalones',
  'pulldown al pecho': 'jalones',
  'prensa militar': 'press_militar',
  'press militar mancuerna': 'press_arnold',
  'press hombro mancuerna': 'press_arnold',
  'flexion pecho': 'flexiones',
  'fondos en paralelas': 'fondos',
  'fondos paralelas': 'fondos',
  'paralelas': 'fondos',
  'press': 'press_banca',
  'banco': 'press_banca',
  'banca': 'press_banca',
  'pullover mancuerna': 'pullover',
  'pullover polea': 'cruce_poleas',
  'peso muerto convencional': 'peso_muerto',
  'gemelos en maquina': 'prensa_gemelos',
  'gemelos en prensa': 'prensa_gemelos',
  'prensa de gemelos': 'prensa_gemelos',
  'press de banca': 'press_banca',
  'press banca declive': 'press_banca_declinado',
  'banca declinada': 'press_banca_declinado',
  'banca declive': 'press_banca_declinado',
  'press hombro sentado': 'press_militar_sentado',
  'prensa de piernas': 'prensa',
  'prensa de hombro': 'press_militar',
  'prensa hombro': 'press_militar',
}

const TIER_KEYS: (keyof Omit<StandardsEntry, 'ageMin' | 'ageMax'>)[] = [
  'bronce', 'plata', 'oro', 'platino', 'esmeralda', 'diamante', 'retador',
]

const TIER_FROM_KEY: Record<string, Tier> = {
  bronce: 'Bronce',
  plata: 'Plata',
  oro: 'Oro',
  platino: 'Platino',
  esmeralda: 'Esmeralda',
  diamante: 'Diamante',
  retador: 'Retador',
}

/** Normaliza un nombre de ejercicio para matching. */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quitar acentos
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Encuentra la key del JSON para un nombre de ejercicio. */
function resolveExerciseKey(name: string, standards: StandardsPayload): string | null {
  const n = normalizeName(name);
  if (EXERCISE_ALIAS[n]) return EXERCISE_ALIAS[n];
  // Construir índice de keys normalizadas dinámicamente
  const knownKeys = Object.keys(standards).filter(k => !k.startsWith('_'));
  for (const key of knownKeys) {
    const k = normalizeName(key).replace(/_/g, ' ');
    if (n === k) return key;
    if (n.includes(k) || k.includes(n)) return key;
  }
  return null;
}

/** Encuentra el bucket de edad para un usuario. */
function findAgeBucket(entries: StandardsEntry[], age: number): StandardsEntry | null {
  for (const e of entries) {
    if (age >= e.ageMin && age <= e.ageMax) return e
  }
  // Fallback: devolver el más cercano
  if (entries.length === 0) return null
  return entries.reduce((closest, e) => {
    const dC = Math.min(Math.abs(age - closest.ageMin), Math.abs(age - closest.ageMax))
    const dE = Math.min(Math.abs(age - e.ageMin), Math.abs(age - e.ageMax))
    return dE < dC ? e : closest
  })
}

/** Devuelve los thresholds reales para (exercise, gender, age). */
export function getThresholds(
  exerciseName: string,
  gender: Gender | string,
  age: number,
  standards: StandardsPayload,
): { tier: Tier; minRatio: number }[] {
  const exKey = resolveExerciseKey(exerciseName, standards)
  if (!exKey) return fallbackThresholds()
  const ex = standards[exKey]
  if (!ex) return fallbackThresholds();
  const gKey: Gender = gender === 'mujer' || gender === 'female' || gender === 'f' ? 'mujer' : 'hombre'
  const entries = ex.entries[gKey]
  if (!entries || entries.length === 0) return fallbackThresholds()
  const bucket = findAgeBucket(entries, age)
  if (!bucket) return fallbackThresholds()
  return TIER_KEYS.map((k) => ({
    tier: TIER_FROM_KEY[k],
    minRatio: bucket[k] as number,
  }))
}

/** Fallback si el JSON falla o el ejercicio no está mapeado. */
function fallbackThresholds(): { tier: Tier; minRatio: number }[] {
  return [
    { tier: 'Bronce', minRatio: 0 },
    { tier: 'Plata', minRatio: 0.6 },
    { tier: 'Oro', minRatio: 0.8 },
    { tier: 'Platino', minRatio: 1.0 },
    { tier: 'Esmeralda', minRatio: 1.2 },
    { tier: 'Diamante', minRatio: 1.4 },
    { tier: 'Retador', minRatio: 1.6 },
  ]
}

/** Tier para un ratio en un ejercicio concreto, segmentado por género+edad. */
export function tierFor(
  rm: number,
  bodyweight: number,
  gender: Gender | string,
  age: number,
  exerciseName: string,
  standards: StandardsPayload,
): Tier {
  if (bodyweight <= 0) return 'Bronce'
  const rel = rm / bodyweight
  const thresholds = getThresholds(exerciseName, gender, age, standards)
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (rel >= thresholds[i].minRatio) return thresholds[i].tier
  }
  return 'Bronce'
}

/** Cuánto peso falta para el siguiente tier (en valor absoluto, no ratio). */
export function nextMilestone(
  rm: number,
  bodyweight: number,
  gender: Gender | string,
  age: number,
  exerciseName: string,
  standards: StandardsPayload,
): { nextTier: Tier; weightNeeded: number } | null {
  if (bodyweight <= 0) return null
  const current = tierFor(rm, bodyweight, gender, age, exerciseName, standards)
  const idx = TIERS.indexOf(current)
  if (idx < 0 || idx >= TIERS.length - 1) return null
  const nextTier = TIERS[idx + 1]
  const thresholds = getThresholds(exerciseName, gender, age, standards)
  const next = thresholds.find((t) => t.tier === nextTier)
  if (!next) return null
  const neededRel = next.minRatio * bodyweight
  const diff = neededRel - rm
  return { nextTier, weightNeeded: Math.max(0, Math.round(diff * 10) / 10) }
}

/**
 * Score 0–1 de un ejercicio contra su techo (tier Retador).
 * Devuelve 0 si no hay datos válidos, hasta 1 si alcanzó/sobrepasó Retador.
 * No devuelve el Tier — eso lo hace `tierFor()`. Esto es un número puro.
 */
export function exerciseScore(
  rm: number,
  bodyweight: number,
  gender: Gender | string,
  age: number,
  exerciseName: string,
  standards: StandardsPayload,
): number {
  if (bodyweight <= 0 || rm <= 0) return 0
  const thresholds = getThresholds(exerciseName, gender, age, standards)
  if (thresholds.length === 0) return 0
  const ceil = thresholds[thresholds.length - 1].minRatio
  if (ceil <= 0) return 0
  const rel = rm / bodyweight
  return Math.min(1, Math.max(0, rel / ceil))
}

/**
 * Score ranked global (0–1) = PROMEDIO de TODOS los ejercicios del usuario.
 *
 * Cada ejercicio devuelve su propio score 0–1 contra su techo (tier Retador).
 * El global es el promedio simple — funciona para powerlifters, culturistas,
 * crossfitters, runners de fuerza, principiantes y avanzados por igual.
 *
 * No hay pesos mágicos por ejercicio ni "big three" hardcoded.
 * Si tienes 1 ejercicio a 0.8 y 1 a 0.4, tu score global es 0.6.
 * Si tienes 10 ejercicios a 0.5, tu score global es 0.5.
 */
export function rankedScore(
  exercises: Array<{ rm: number; name: string }>,
  bodyweight: number,
  gender: Gender | string,
  age: number,
  standards: StandardsPayload,
): number {
  if (bodyweight <= 0 || exercises.length === 0) return 0
  const scores = exercises
    .filter((e) => e.rm > 0)
    .map((e) => exerciseScore(e.rm, bodyweight, gender, age, e.name, standards))
  if (scores.length === 0) return 0
  const sum = scores.reduce((acc, s) => acc + s, 0)
  return Math.min(1, Math.max(0, sum / scores.length))
}

export function tierFromScore(score: number): Tier {
  const map: [Tier, number][] = [
    ['Retador', 0.95], ['Diamante', 0.80], ['Esmeralda', 0.65],
    ['Platino', 0.50], ['Oro', 0.35], ['Plata', 0.20], ['Bronce', 0],
  ]
  return map.find(([_, min]) => score >= min)![0]
}

/** Tipo del estándar expuesto al UI (sin lógica de carga). */
export type { StandardsEntry as StandardBucket }
