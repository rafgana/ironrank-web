# IronRank Web - Plan de Implementacion

## Stack
- React 19 + TypeScript + Vite
- TailwindCSS 4 (utility-first)
- Zustand (estado global reactivo)
- Dexie.js (IndexedDB wrapper, offline-first)
- Recharts (graficas)
- React Router (navegacion SPA)
- lucide-react (iconos)

## Estructura del proyecto

```
ironrank-web/
├── public/
│   ├── strength_standards.json
│   ├── exercises.json
│   └── manifest.json            (PWA)
├── src/
│   ├── main.tsx                  (entry)
│   ├── App.tsx                   (router + tabs)
│   ├── db/
│   │   ├── database.ts           (Dexie setup, schemas)
│   │   └── seed.ts               (seed 80 ejercicios)
│   ├── models/
│   │   └── types.ts              (TypeScript interfaces)
│   ├── store/
│   │   ├── workoutStore.ts       (Zustand)
│   │   ├── profileStore.ts
│   │   └── routineStore.ts
│   ├── services/
│   │   ├── rankingService.ts     (calculo de rangos)
│   │   ├── progressionService.ts (sugerencia peso, PRs)
│   │   ├── plateCalculator.ts
│   │   └── estimators.ts         (Epley, Brzycki)
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Workout.tsx
│   │   ├── ActiveWorkout.tsx      (la pantalla core)
│   │   ├── Progress.tsx
│   │   ├── Ranking.tsx
│   │   ├── Library.tsx
│   │   ├── Routines.tsx
│   │   └── Profile.tsx
│   ├── components/
│   │   ├── Layout.tsx             (tabs + header)
│   │   ├── SetRow.tsx
│   │   ├── RestTimer.tsx
│   │   ├── RIRSelector.tsx
│   │   ├── TierCard.tsx
│   │   ├── BellCurve.tsx
│   │   ├── PRBadge.tsx
│   │   ├── PlateCalc.tsx
│   │   └── ExerciseSearch.tsx
│   ├── hooks/
│   │   └── useTimer.ts
│   └── utils/
│       └── format.ts
└── index.html
```

## Plan de implementacion

### Phase 1: Setup + DB + Seed
1. Inicializar Vite + React + TS + Tailwind
2. Configurar Dexie.js con todas las tablas
3. Crear ejercicio seed (80 ejercicios desde JSON)
4. Configurar Zustand stores base

### Phase 2: Workout Core
1. ActiveWorkout: pantalla principal con ejercicios, sets, RIR
2. SetRow: peso, reps, RIR selector, completar
3. RestTimer: temporizador configurable
4. Historial durante workout ("Ultima vez: 80x8, 85x6")
5. Supersets y dropsets
6. Plate calculator

### Phase 3: Dashboard + Perfil
1. Dashboard: rango general, ultimo workout, stats semanales
2. Perfil: edad, genero, peso, preferencias

### Phase 4: Ranking System
1. RankingService: calculo de tiers
2. TierCard: visual del rango
3. BellCurve: grafica de distribucion
4. Ranking general compuesto

### Phase 5: Progress + PRs
1. Grafica 1RM vs tiempo (Recharts)
2. Deteccion automatica de PRs
3. Volumen semanal

### Phase 6: Biblioteca + Rutinas
1. Biblioteca con filtro por musculo
2. Rutinas CRUD
3. Iniciar workout desde rutina

### Phase 7: Polish + Deploy
1. PWA manifest + service worker
2. Dark mode
3. Deploy a VPS con Nginx
4. Build produccion (stateless, solo archivos estaticos)
