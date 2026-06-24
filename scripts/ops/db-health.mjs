#!/usr/bin/env node
// ops/db-health.mjs — health check for IDB + Supabase
// Uso: node scripts/ops/db-health.mjs

import { execSync } from "node:child_process";
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://aemajqeksudfljdzsvfe.supabase.co";
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_C-dFcw66bC7KCthpN2hAvQ_K8uKKAAW";
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log(`\n=== DB health check ===\n`);

// [1/4] IDB schema version
console.log("[1/4] IDB schema:");
try {
  const dbSrc = readFileSync("src/db/database.ts", "utf8");
  const versionMatch = dbSrc.match(/CURRENT_SCHEMA_VERSION\s*=\s*(\d+)/);
  if (versionMatch) {
    console.log(`  CURRENT_SCHEMA_VERSION: ${versionMatch[1]}`);
  }
  // Count tables
  const tables = (dbSrc.match(/Dexie\.Table</g) || []).length;
  console.log(`  Tables: ${tables}`);
  // Count stores in current version
  const versionStoreMatch = dbSrc.match(/this\.version\(3\)\.stores\(\{([\s\S]*?)\}\)/);
  if (versionStoreMatch) {
    const stores = (versionStoreMatch[1].match(/^\s*(\w+):/gm) || []).length;
    console.log(`  v3 stores: ${stores}`);
  }
} catch (e) {
  console.log(`  (error: ${e.message})`);
}

// [2/4] Supabase reachability
console.log("\n[2/4] Supabase reachability:");
try {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
    headers: { apikey: ANON_KEY },
  });
  console.log(`  /auth/v1/health: ${res.status}`);
} catch (e) {
  console.log(`  (error: ${e.message})`);
}

// [3/4] Supabase table counts (if SERVICE_ROLE)
console.log("\n[3/4] Supabase tables:");
if (!SERVICE_ROLE) {
  console.log("  (skipped — no SERVICE_ROLE_KEY)");
} else {
  const tables = ["workouts", "sets", "user_profiles", "action_log", "body_measurements"];
  for (const t of tables) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${t}?select=id&limit=1`, {
        headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}` },
      });
      const contentRange = res.headers.get("content-range") || "?";
      const total = contentRange.includes("/") ? contentRange.split("/")[1] : "?";
      console.log(`  ${t}: ${total} rows`);
    } catch (e) {
      console.log(`  ${t}: error — ${e.message}`);
    }
  }
}

// [4/4] Recommendations
console.log("\n[4/4] Recommendations:");
const recs = [];
if (!SERVICE_ROLE) recs.push("Set SUPABASE_SERVICE_ROLE_KEY in CI for full health checks");
recs.push("Monitor RLS policies monthly (data-engineer)");
recs.push("Add db query latency to SLO (sre)");
recs.push("Backups: Supabase auto-backs-up daily; verify monthly");
for (const r of recs) console.log(`  - ${r}`);

// Persist
const md = `# DB health check

Generated: ${new Date().toISOString()}

## IDB schema
- CURRENT_SCHEMA_VERSION: see output above
- Tables: see output above

## Supabase
- Reachability: see output above
- Row counts: see output above

## Recommendations
${recs.map((r) => `- ${r}`).join("\n")}
`;
writeFileSync(resolve(".harness/DB_HEALTH.md"), md);
console.log(`\nSaved to .harness/DB_HEALTH.md`);
