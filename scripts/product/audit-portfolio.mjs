#!/usr/bin/env node
// product/audit-portfolio.mjs — initial audit of IronRank's feature portfolio
// Output: .harness/PRODUCT_AUDIT.md with RICE-scored features + recommendations
// Este es el "audit inicial" que pidió el usuario.

import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { execSync } from "node:child_process";

console.log(`\n=== Portfolio audit (IronRank) ===\n`);

// 1. Inventario de features (páginas + componentes)
console.log("[1/4] Inventorying features...");
const pages = execSync(`ls src/pages/`).toString().trim().split("\n");
const components = execSync(`ls src/components/ironrank/`).toString().trim().split("\n");
const hooks = execSync(`ls src/hooks/`).toString().trim().split("\n");
const stores = execSync(`ls src/store/`).toString().trim().split("\n");

console.log(`  Pages: ${pages.length}`);
console.log(`  Components: ${components.length}`);
console.log(`  Hooks: ${hooks.length}`);
console.log(`  Stores: ${stores.length}`);

// 2. Blog posts
const POSTS_DIR = resolve("content/posts");
let postCount = 0;
if (existsSync(POSTS_DIR)) {
  postCount = execSync(`ls ${POSTS_DIR} | wc -l`).toString().trim();
}
console.log(`  Blog posts: ${postCount}`);

// 3. Subagentes
const agents = JSON.parse(readFileSync(resolve(".harness/agent-registry.json"), "utf8"));
console.log(`  Subagents: ${Object.keys(agents.agents).length}`);

// 4. RICE score de las features principales
const features = [
  { name: "Sistema de ligas (7 tiers)", reach: 1000, impact: 3, confidence: 95, effort: 4 },
  { name: "Body measurements", reach: 500, impact: 2, confidence: 80, effort: 3 },
  { name: "Streak counter", reach: 800, impact: 2, confidence: 90, effort: 1 },
  { name: "Auto-backup", reach: 600, impact: 2, confidence: 85, effort: 4 },
  { name: "Plate calculator", reach: 400, impact: 1, confidence: 70, effort: 1 },
  { name: "Rest timer", reach: 700, impact: 1.5, confidence: 90, effort: 2 },
  { name: "RIR tracking", reach: 300, impact: 1, confidence: 60, effort: 2 },
  { name: "Public leaderboards", reach: 200, impact: 0.5, confidence: 30, effort: 6 },
  { name: "Apple Watch app", reach: 400, impact: 2, confidence: 50, effort: 16 },
  { name: "AI workout coach", reach: 500, impact: 1, confidence: 20, effort: 12 },
  { name: "Social feed", reach: 300, impact: 0.5, confidence: 20, effort: 10 },
  { name: "Marketing blog (SEO)", reach: 2000, impact: 2, confidence: 75, effort: 2 },
  { name: "Harness (agent system)", reach: 0, impact: 0, confidence: 0, effort: 0, note: "internal — N/A" },
];

const scored = features
  .map((f) => ({
    ...f,
    rice: f.effort > 0 ? (f.reach * f.impact * (f.confidence / 100)) / f.effort : 0,
  }))
  .sort((a, b) => b.rice - a.rice);

console.log("\n[2/4] RICE-scoring features:");
console.log("\nFeature                          | RICE    | Verdict");
console.log("-".repeat(80));
for (const f of scored) {
  const verdict = f.note
    ? f.note
    : f.rice > 50
      ? "BUILD (top)"
      : f.rice > 20
        ? "BUILD (high)"
        : f.rice > 10
          ? "BUILD (med)"
          : f.rice > 5
            ? "DEFER"
            : "KILL";
  console.log(
    `${f.name.padEnd(33)} | ${f.rice.toFixed(1).padStart(7)} | ${verdict}`,
  );
}

// 3. Gaps detectados (features que NO tenemos pero la competencia tiene)
console.log("\n[3/4] Competitive gap analysis (vs Strong + Hevy):");
const gaps = [
  { feature: "Plantillas de rutinas pre-hechas", competitors: ["Strong", "Hevy"], priority: "KILL" },
  { feature: "Social feed", competitors: ["Hevy"], priority: "KILL" },
  { feature: "Public leaderboards", competitors: ["Hevy"], priority: "KILL" },
  { feature: "Apple Watch app", competitors: ["Strong"], priority: "DEFER" },
  { feature: "AI coach", competitors: ["Hevy"], priority: "DEFER" },
  { feature: "Video form check", competitors: ["Hevy"], priority: "DEFER" },
  { feature: "Year in review (Spotify Wrapped)", competitors: ["Hevy"], priority: "BUILD (Q4)" },
  { feature: "Routines con deload automático", competitors: ["Strong Pro"], priority: "DEFER" },
  { feature: "Export PDF del progreso", competitors: ["Strong Pro"], priority: "BUILD (low effort)" },
  { feature: "Comparte workout en redes", competitors: ["Hevy"], priority: "BUILD (ShareCard ya existe)" },
];
for (const g of gaps) {
  console.log(`  ${g.priority.padEnd(20)} | ${g.feature.padEnd(45)} | ${g.competitors.join(", ")}`);
}

// 4. Recomendaciones
console.log("\n[4/4] Top 5 recomendaciones Q1-Q2:");

const recs = [
  {
    rank: 1,
    feature: "Marketing blog (2 posts/mes)",
    reason: "RICE 150 (alto), acquisition channel, SEO compounding",
    effort: "0.5 day/post",
  },
  {
    rank: 2,
    feature: "Year in review (Q4 launch)",
    reason: "Hevy lo tiene, viral, low effort, high retention",
    effort: "5 days",
  },
  {
    rank: 3,
    feature: "Comparte workout (ShareCard ya existe)",
    reason: "Free growth, ShareCard ya implementado, falta solo UI",
    effort: "2 days",
  },
  {
    rank: 4,
    feature: "Export PDF del progreso",
    reason: "Strong cobra PRO, nosotros gratis = diferenciador",
    effort: "3 days",
  },
  {
    rank: 5,
    feature: "Harness self-improve (ya hecho)",
    reason: "Ya implementado, beneficio: mantenimiento autónomo",
    effort: "0 (done)",
  },
];

for (const r of recs) {
  console.log(`  #${r.rank} ${r.feature}`);
  console.log(`      Reason: ${r.reason}`);
  console.log(`      Effort: ${r.effort}`);
}

// Persist
const md = `# Product portfolio audit

Generated: ${new Date().toISOString()}

## Inventory
- Pages: ${pages.length} (${pages.join(", ")})
- Components (ironrank): ${components.length}
- Hooks: ${hooks.length}
- Stores: ${stores.length}
- Blog posts: ${postCount}
- Subagents: ${Object.keys(agents.agents).length}

## RICE score (current + candidate features)

| Feature | Reach | Impact | Confidence | Effort | RICE | Verdict |
|---|---|---|---|---|---|---|
${scored
  .map(
    (f) =>
      `| ${f.name} | ${f.reach} | ${f.impact} | ${f.confidence}% | ${f.effort} | ${f.rice.toFixed(1)} | ${f.note || (f.rice > 50 ? "BUILD" : f.rice > 20 ? "BUILD (high)" : f.rice > 10 ? "BUILD (med)" : f.rice > 5 ? "DEFER" : "KILL")} |`,
  )
  .join("\n")}

## Competitive gaps (vs Strong + Hevy)

| Priority | Feature | In |
|---|---|---|
${gaps.map((g) => `| ${g.priority} | ${g.feature} | ${g.competitors.join(", ")} |`).join("\n")}

## Top 5 recomendaciones Q1-Q2

${recs
  .map(
    (r) =>
      `### #${r.rank} ${r.feature}\n\n- Reason: ${r.reason}\n- Effort: ${r.effort}\n`,
  )
  .join("\n")}

## Open questions

- Are users actually using the body measurements feature? (needs data)
- Is the streak counter moving retention? (needs A/B test)
- What's the activation rate from signup → first workout? (needs funnel tracking)
- Are users sharing the ShareCard? (needs analytics)
`;

const outPath = resolve(".harness/PRODUCT_AUDIT.md");
writeFileSync(outPath, md);
console.log(`\nSaved to ${outPath}`);
