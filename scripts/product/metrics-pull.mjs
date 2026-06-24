#!/usr/bin/env node
// product/metrics-pull.mjs — pull metrics from Supabase + logs
// Output: METRICS.md with counts, top events, top errors
// Uso: node scripts/product/metrics-pull.mjs

import { readFileSync, readdirSync, existsSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://aemajqeksudfljdzsvfe.supabase.co";
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_C-dFcw66bC7KCthpN2hAvQ_K8uKKAAW";
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log(`\n=== Metrics pull (IronRank) ===\n`);

// 1. Counts from Supabase (if SERVICE_ROLE available)
async function supaCount(table) {
  if (!SERVICE_ROLE) return null;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=id`, {
    headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.length;
}

let supa = {};
if (SERVICE_ROLE) {
  console.log("[1/3] Supabase counts:");
  for (const t of ["users", "workouts", "sets", "user_profiles", "action_log"]) {
    const n = await supaCount(t === "users" ? "auth.users" : t);
    if (n !== null) {
      supa[t] = n;
      console.log(`  ${t}: ${n}`);
    }
  }
} else {
  console.log("[1/3] Supabase counts: SKIPPED (no SERVICE_ROLE_KEY)");
}

// 2. Local logs
console.log("\n[2/3] Agent logs (last 30 days):");
const LOGS_DIR = resolve(".harness/logs");
const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
const allEntries = [];
if (existsSync(LOGS_DIR)) {
  for (const f of readdirSync(LOGS_DIR).filter((f) => f.endsWith(".jsonl"))) {
    for (const line of readFileSync(join(LOGS_DIR, f), "utf8").split("\n").filter(Boolean)) {
      try {
        allEntries.push(JSON.parse(line));
      } catch { /* ignore */ }
    }
  }
}
console.log(`  Total entries: ${allEntries.length}`);
const recent = allEntries.filter((e) => new Date(e.ts).getTime() > cutoff);
console.log(`  Last 30 days: ${recent.length}`);

const byAgent = {};
for (const e of allEntries) {
  const a = e.action.split("_")[0];
  byAgent[a] = (byAgent[a] || 0) + 1;
}
console.log(`  Top agents:`);
for (const [a, n] of Object.entries(byAgent).sort((a, b) => b[1] - a[1]).slice(0, 5)) {
  console.log(`    ${a}: ${n}`);
}

// 3. Source code metrics
console.log("\n[3/3] Source code metrics:");
import { execSync } from "node:child_process";
try {
  const srcLines = parseInt(execSync(`find src -name "*.ts" -o -name "*.tsx" | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}'`).toString().trim());
  const testLines = parseInt(execSync(`find tests -name "*.mjs" -o -name "*.js" | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}'`).toString().trim());
  const contentLines = parseInt(execSync(`find content -name "*.md" 2>/dev/null | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}'`).toString().trim());
  console.log(`  src/:     ${srcLines} lines`);
  console.log(`  tests/:   ${testLines} lines`);
  console.log(`  content/: ${contentLines} lines`);
  console.log(`  test:src ratio: ${(testLines / srcLines).toFixed(2)}`);
} catch (e) {
  console.log(`  (error: ${e.message})`);
}

// Build METRICS.md
const md = `# Metrics report

Generated: ${new Date().toISOString()}

## Supabase

${Object.keys(supa).length > 0
  ? Object.entries(supa).map(([k, v]) => `- **${k}**: ${v}`).join("\n")
  : "_Supabase counts skipped (no SERVICE_ROLE_KEY)_"}

## Agent logs (last 30 days)

- Total entries: ${allEntries.length}
- Last 30 days: ${recent.length}

### Top agents (all-time)

${Object.entries(byAgent)
  .sort((a, b) => b[1] - a[1])
  .map(([a, n]) => `- ${a}: ${n}`)
  .join("\n")}

## Source code

See terminal output above.

## Open questions

- Where do users drop off? (needs Plausible integration)
- What's the activation rate? (needs funnel tracking)
- What's the D7/D30 retention? (needs time-series data)
`;

const path = resolve(".harness/METRICS.md");
writeFileSync(path, md);
console.log(`\nSaved to ${path}`);
