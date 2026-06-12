import Dexie from 'dexie'
import type { Workout, WorkoutExercise, SetEntry, Exercise, Routine, RoutineExercise, UserProfile } from '../models/types'

export class IronRankDB extends Dexie {
  workouts!: Dexie.Table<Workout, number>
  workoutExercises!: Dexie.Table<WorkoutExercise, number>
  sets!: Dexie.Table<SetEntry, number>
  exercises!: Dexie.Table<Exercise, number>
  routines!: Dexie.Table<Routine, number>
  routineExercises!: Dexie.Table<RoutineExercise, number>
  userProfile!: Dexie.Table<UserProfile, number>

  constructor() {
    super('IronRank')
    this.version(1).stores({
      workouts: '++id, date',
      workoutExercises: '++id, workoutId, exerciseId',
      sets: '++id, workoutExerciseId, completed',
      exercises: '++id, name, musclePrimary',
      routines: '++id, name',
      routineExercises: '++id, routineId, exerciseId',
      userProfile: '++id',
    })
  }
}

export const db = new IronRankDB()

export async function seedExercises() {
  const count = await db.exercises.count()
  if (count > 0) return
  const res = await fetch('/exercises.json')
  const exercises = await res.json()
  await db.exercises.bulkAdd(exercises)
}

export async function getProfile(): Promise<UserProfile> {
  const profiles = await db.userProfile.toArray()
  if (profiles.length > 0) return profiles[0]
  const defaultProfile: UserProfile = {
    age: 25, gender: 'male', bodyweight: 75, height: 175,
    restTimerDefault: 90, useKg: true,
    availablePlates: [25, 20, 15, 10, 5, 2.5, 1.25]
  }
  const id = await db.userProfile.add(defaultProfile)
  return { ...defaultProfile, id }
}
