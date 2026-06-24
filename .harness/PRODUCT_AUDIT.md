# Product portfolio audit

Generated: 2026-06-24T19:05:43.001Z

## Inventory
- Pages: 7 (ActiveWorkout.tsx, Dashboard.tsx, Library.tsx, Profile.tsx, Progress.tsx, Ranking.tsx, Workout.tsx)
- Components (ironrank): 14
- Hooks: 6
- Stores: 5
- Blog posts: 2
- Subagents: 18

## RICE score (current + candidate features)

| Feature | Reach | Impact | Confidence | Effort | RICE | Verdict |
|---|---|---|---|---|---|---|
| Marketing blog (SEO) | 2000 | 2 | 75% | 2 | 1500.0 | BUILD |
| Streak counter | 800 | 2 | 90% | 1 | 1440.0 | BUILD |
| Sistema de ligas (7 tiers) | 1000 | 3 | 95% | 4 | 712.5 | BUILD |
| Rest timer | 700 | 1.5 | 90% | 2 | 472.5 | BUILD |
| Plate calculator | 400 | 1 | 70% | 1 | 280.0 | BUILD |
| Body measurements | 500 | 2 | 80% | 3 | 266.7 | BUILD |
| Auto-backup | 600 | 2 | 85% | 4 | 255.0 | BUILD |
| RIR tracking | 300 | 1 | 60% | 2 | 90.0 | BUILD |
| Apple Watch app | 400 | 2 | 50% | 16 | 25.0 | BUILD (high) |
| AI workout coach | 500 | 1 | 20% | 12 | 8.3 | DEFER |
| Public leaderboards | 200 | 0.5 | 30% | 6 | 5.0 | KILL |
| Social feed | 300 | 0.5 | 20% | 10 | 3.0 | KILL |
| Harness (agent system) | 0 | 0 | 0% | 0 | 0.0 | internal — N/A |

## Competitive gaps (vs Strong + Hevy)

| Priority | Feature | In |
|---|---|---|
| KILL | Plantillas de rutinas pre-hechas | Strong, Hevy |
| KILL | Social feed | Hevy |
| KILL | Public leaderboards | Hevy |
| DEFER | Apple Watch app | Strong |
| DEFER | AI coach | Hevy |
| DEFER | Video form check | Hevy |
| BUILD (Q4) | Year in review (Spotify Wrapped) | Hevy |
| DEFER | Routines con deload automático | Strong Pro |
| BUILD (low effort) | Export PDF del progreso | Strong Pro |
| BUILD (ShareCard ya existe) | Comparte workout en redes | Hevy |

## Top 5 recomendaciones Q1-Q2

### #1 Marketing blog (2 posts/mes)

- Reason: RICE 150 (alto), acquisition channel, SEO compounding
- Effort: 0.5 day/post

### #2 Year in review (Q4 launch)

- Reason: Hevy lo tiene, viral, low effort, high retention
- Effort: 5 days

### #3 Comparte workout (ShareCard ya existe)

- Reason: Free growth, ShareCard ya implementado, falta solo UI
- Effort: 2 days

### #4 Export PDF del progreso

- Reason: Strong cobra PRO, nosotros gratis = diferenciador
- Effort: 3 days

### #5 Harness self-improve (ya hecho)

- Reason: Ya implementado, beneficio: mantenimiento autónomo
- Effort: 0 (done)


## Open questions

- Are users actually using the body measurements feature? (needs data)
- Is the streak counter moving retention? (needs A/B test)
- What's the activation rate from signup → first workout? (needs funnel tracking)
- Are users sharing the ShareCard? (needs analytics)
