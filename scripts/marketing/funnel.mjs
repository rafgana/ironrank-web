#!/usr/bin/env node
// funnel.mjs — placeholder para análisis de funnel
// Cuando integres Plausible custom events, lee los datos aquí
// Uso: node scripts/marketing/funnel.mjs

console.log("=== Funnel analysis ===\n");
console.log("Esta es una integración placeholder. Para activarla:");
console.log("1. Ve a https://plausible.io/ironrank.rafagandia.com/settings/goals");
console.log("2. Crea custom events: signup_started, workout_completed, week_1_returned");
console.log("3. Exporta datos via Plausible API o Stats API");
console.log("4. Implementa aquí la lectura + cálculo de funnel\n");

console.log("Funnel objetivo (IronRank MVP):");
console.log("  visit_landing     →  visit_signup     →  signup_completed");
console.log("       ↓                                       ↓");
console.log("  first_workout_started  ←  onboarding_done  ←  app_opened_3x");
console.log("       ↓");
console.log("  first_workout_completed  →  week_1_returned (retention D7)");
console.log();

console.log("Benchmarks de la industria (gym apps 2026):");
console.log("  Landing → signup:  2-5% (median 3%)");
console.log("  signup → first workout:  40-60%");
console.log("  first workout → D7:  25-35%");
console.log("  D7 → D30:  40-50%");
console.log();
console.log("IronRank target (Y1):");
console.log("  Landing → signup:  4% (above median due to SEO)");
console.log("  signup → first workout:  50%");
console.log("  first workout → D7:  30%");
console.log("  D7 → D30:  45%");
