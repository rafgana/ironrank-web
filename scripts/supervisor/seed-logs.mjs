#!/usr/bin/env node
// supervisor/seed-logs.mjs — pobla .harness/logs/ con datos sintéticos realistas
// Para que loop-trace.mjs tenga material para analizar
// Uso: node scripts/supervisor/seed-logs.mjs [--days 30]

import { writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";

const args = process.argv.slice(2);
const lastIdx = args.indexOf("--days");
const days = lastIdx > -1 ? parseInt(args[lastIdx + 1]) : 30;

const LOGS_DIR = resolve(".harness/logs");
mkdirSync(LOGS_DIR, { recursive: true });

// Distribución realista: un feature loop cada 2-3 días
const agents = [
  "architect",
  "implementer",
  "verifier",
  "docs-writer",
  "release-manager",
  "marketing-strategist",
  "copywriter",
  "seo-analyst",
  "growth-hacker",
  "supervisor",
  "loop-engineer",
];

const actionByAgent = {
  architect: ["architect_plan", "architect_intake", "architect_review"],
  implementer: ["implementer_code", "implementer_test", "implementer_fix"],
  verifier: ["verifier_audit", "verifier_approve", "verifier_reject"],
  "docs-writer": ["docs-writer_post", "docs-writer_readme", "docs-writer_jsdoc"],
  "release-manager": ["release-manager_commit", "release-manager_pr", "release-manager_changelog"],
  "marketing-strategist": ["marketing-strategist_gtm", "marketing-strategist_channels"],
  copywriter: ["copywriter_landing", "copywriter_email", "copywriter_ads"],
  "seo-analyst": ["seo-analyst_audit", "seo-analyst_keywords", "seo-analyst_brief"],
  "growth-hacker": ["growth-hacker_experiment", "growth-hacker_funnel"],
  supervisor: ["supervisor_monitor", "supervisor_create", "supervisor_evolve"],
  "loop-engineer": ["loop-engineer_design", "loop-engineer_trace", "loop-engineer_optimize"],
};

const targets = [
  "src/App.tsx",
  "src/db/database.ts",
  "src/store/workoutStore.ts",
  "src/components/ironrank/TierBadge.tsx",
  "public/landing/index.html",
  "scripts/harness/verify.sh",
  "tests/e2e.mjs",
  "content/posts/ironrank-vs-strong-vs-hevy.md",
  "STRATEGY.md",
  "SEO.md",
  "FEATURE_INTAKE.md",
  "EVOLVE.md",
];

const now = Date.now();
let totalEntries = 0;

  for (let d = 0; d < days; d++) {
    const dayDate = new Date(now - d * 24 * 60 * 60 * 1000);
    const dayKey = dayDate.toISOString().slice(0, 10);
    const filePath = join(LOGS_DIR, `${dayKey}.jsonl`);

    // 0-3 features por día, con 3-8 ops por feature
    const numFeatures = Math.floor(Math.random() * 4);
    const lines = [];
    for (let f = 0; f < numFeatures; f++) {
      let startTs = dayDate.getTime() + Math.random() * 8 * 60 * 60 * 1000; // 0-8h into the day
      const flow = ["architect", "implementer", "verifier", "docs-writer", "release-manager"];
      for (const agent of flow) {
        if (Math.random() < 0.7) {
          // 30% chance of skip
          const dur = 30000 + Math.random() * 180000; // 30s-3.5min
          const ts = new Date(startTs).toISOString();
          const actions = actionByAgent[agent] || [`${agent}_op`];
          const action = actions[Math.floor(Math.random() * actions.length)];
          const target = targets[Math.floor(Math.random() * targets.length)];
          const details = JSON.stringify({ duration_ms: Math.floor(dur), ok: Math.random() > 0.15 });
          lines.push(`{"ts":"${ts}","action":"${action}","target":"${target}","details":${details}}`);
          totalEntries++;
          startTs = startTs + dur + Math.random() * 30000; // 30s gap
        }
      }
    }

    if (lines.length > 0) {
      writeFileSync(filePath, lines.join("\n") + "\n", "utf8");
    }
  }

console.log(`✓ Seeded ${days} days of logs (${totalEntries} entries) to ${LOGS_DIR}`);
