# IronRank Web - Spec

Web app de tracking de gym con sistema ranked tipo League of Legends. Funciona en móvil y PC. 100% cliente (PWA, offline-first).

## Stack
- **Frontend**: React 19 + TypeScript + Vite + TailwindCSS 4
- **State**: Zustand
- **Persistence**: Dexie.js (IndexedDB — offline-first, 0 backend)
- **Charts**: Recharts
- **Deploy**: VPS con Nginx (SPA estática)

## Por qué web y no iOS
- Sin Mac, sin Xcode, sin AltStore
- Funciona en iPhone, Android, PC, tablet
- PWA: se puede "instalar" como app desde el navegador
- Offline-first: sin internet sigue funcionando
- Actualizaciones instantáneas (sin Apple Review)

## Features (mismas que iOS pero web)

### Core
- Registrar workouts con ejercicios, series, peso, reps, RIR
- Historial del ejercicio durante el workout
- Temporizador de descanso entre series
- Supersets y dropsets
- Plate calculator + warmup calculator
- Progresión inteligente (sugerencia de peso)

### Ranked System
- 7 rangos: Bronze → Prata → Ouro → Platina → Esmeralda → Diamante → Retador
- Rankeado por ejercicio y rango general compuesto
- Barra de progreso a siguiente rango
- Datos de referencia basados en población real

### Progress + PRs
- Gráficas 1RM vs tiempo por ejercicio (Recharts)
- Detección automática de PRs (1RM, Reps, Volumen)
- Volumen semanal por grupo muscular

### Biblioteca
- 80 ejercicios precargados con categorías reales
- Filtro por grupo muscular, búsqueda
- Cada ejercicio muestra su rango actual

### Rutinas
- CRUD de rutinas
- Iniciar workout desde rutina

### Perfil
- Edad, género, peso corporal
- Preferencias (timer, unidades kg/lbs, discos disponibles)

## Base de datos (Dexie.js / IndexedDB)

```
workouts          (id, date, duration, notes)
workout_exercises (id, workoutId, exerciseId, order)
sets              (id, workoutExerciseId, weight, reps, rir, isDropSet, supersetGroupId, note, order, completed)
exercises         (id, name, musclePrimary, muscleSecondary, equipment, instructions, alternatives)
routines          (id, name, createdAt)
routine_exercises (id, routineId, exerciseId, order)
user_profile      (id, age, gender, bodyweight, height, restTimer, useKg, availablePlates)
```

## Pantallas

1. **Dashboard** — rango general, último workout, progreso semanal
2. **Workout** — workout en vivo con RIR, sets, timer
3. **Progreso** — gráficas + PRs
4. **Ranked** — ranking por ejercicio + campana
5. **Biblioteca** — ejercicios + rutinas
6. **Perfil** — datos + preferencias

## Datos de referencia
- `strength_standards.json` embebido con thresholds poblacionales
- Basado en strengthlevel.com + OpenPowerlifting
- Normalizado por peso corporal, género, edad
