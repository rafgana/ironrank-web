#!/usr/bin/env node
// research/icp-search.mjs — given an ICP, generate a prospects.json entry
// This is the SKELETON. Real search will use webfetch, LinkedIn, etc.
// Uso: node scripts/research/icp-search.mjs --icp "B2B SaaS, 10-50 employees, Spain"

import { writeFileSync, existsSync, readFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const args = process.argv.slice(2);
const icpIdx = args.indexOf("--icp");
const ICP = icpIdx > -1 ? args[icpIdx + 1] : null;

if (!ICP) {
  console.error("Uso: node scripts/research/icp-search.mjs --icp \"<ICP description>\"");
  console.error("Ejemplo: node scripts/research/icp-search.mjs --icp \"B2B SaaS, 10-50 employees, Spain\"");
  process.exit(1);
}

console.log(`\n=== ICP search ===\n`);
console.log(`ICP: ${ICP}\n`);

// Cargar prospects existentes
const PROSPECTS_FILE = resolve(".harness/prospects.json");
let prospects = [];
if (existsSync(PROSPECTS_FILE)) {
  prospects = JSON.parse(readFileSync(PROSPECTS_FILE, "utf8"));
}

// Skeleton: en implementación real, esto llamaría a:
// - webfetch (Google search, LinkedIn público)
// - Apollo.io API
// - Hunter.io API
// - etc.
const skeleton = {
  id: crypto.randomUUID(),
  company: "<to be filled by market-researcher agent>",
  domain: "<to be filled>",
  industry: ICP.split(",")[0]?.trim() || "<to be filled>",
  size_estimate: ICP.match(/\d+-\d+/) || "<to be filled>",
  geography: ICP.match(/Spain|LATAM|USA|EU/)?.[0] || "<to be filled>",
  founders: [],
  signals: [],
  fit_score: 0,
  angle: "<to be filled by market-researcher agent>",
  source: "icp-search (skeleton)",
  icp: ICP,
  researched_at: new Date().toISOString(),
  status: "draft", // draft | qualified | contacted | replied | won | lost
};

// Append
prospects.push(skeleton);
writeFileSync(PROSPECTS_FILE, JSON.stringify(prospects, null, 2));

console.log(`✓ Created draft entry: ${skeleton.id}`);
console.log(`  Saved to ${PROSPECTS_FILE}`);
console.log(`\nNEXT STEPS:`);
console.log(`  1. The market-researcher subagent will fill in the real data`);
console.log(`  2. Use: node scripts/research/lead-enrich.mjs --id ${skeleton.id}`);
console.log(`  3. Once qualified, status="qualified" and trigger outbound-writer`);
