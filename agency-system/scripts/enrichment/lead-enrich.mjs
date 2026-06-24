#!/usr/bin/env node
// enrichment/lead-enrich.mjs — skeleton for enriching a prospect with public data
// Uso: node scripts/enrichment/lead-enrich.mjs --id <uuid>

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const args = process.argv.slice(2);
const idIdx = args.indexOf("--id");
const ID = idIdx > -1 ? args[idIdx + 1] : null;

if (!ID) {
  console.error("Uso: node scripts/enrichment/lead-enrich.mjs --id <uuid>");
  process.exit(1);
}

const PROSPECTS_FILE = resolve(".harness/prospects.json");
if (!existsSync(PROSPECTS_FILE)) {
  console.error("✗ prospects.json not found");
  process.exit(1);
}

const prospects = JSON.parse(readFileSync(PROSPECTS_FILE, "utf8"));
const idx = prospects.findIndex((p) => p.id === ID);
if (idx === -1) {
  console.error(`✗ Prospect not found: ${ID}`);
  process.exit(1);
}

const prospect = prospects[idx];
console.log(`\n=== Lead enrichment ===\n`);
console.log(`Company: ${prospect.company}`);
console.log(`Domain: ${prospect.domain}`);
console.log(`Current fit_score: ${prospect.fit_score || 0}\n`);

// Skeleton: en implementación real, esto haría:
// 1. WHOIS lookup (domain age)
// 2. Wappalyzer o similar (tech stack)
// 3. LinkedIn public posts (webfetch)
// 4. Google News (webfetch)
// 5. Crunchbase / Pitchbook (webfetch)
// 6. Job postings (webfetch)
const enrichment = {
  enriched_at: new Date().toISOString(),
  domain_age_years: "<to be filled>",
  tech_stack: [],
  social: {
    linkedin_followers: 0,
    twitter_handle: null,
    recent_posts: [],
  },
  news: [],
  funding: {
    last_round: null,
    amount: null,
    date: null,
    investors: [],
  },
  hiring_signals: [],
  computed_signals: [],
  fit_score_updated: prospect.fit_score || 0,
  sources: [],
};

prospects[idx] = { ...prospect, enrichment, status: "enriched" };
writeFileSync(PROSPECTS_FILE, JSON.stringify(prospects, null, 2));

console.log(`✓ Enrichment skeleton created for ${prospect.company}`);
console.log(`  status: draft → enriched`);
console.log(`\nNEXT STEPS:`);
console.log(`  1. The lead-enricher subagent will fill in the real data`);
console.log(`  2. Run: agency research dossier "<name>" --company "${prospect.company}"`);
console.log(`  3. Run: agency outbound email --dossier dossiers/<slug>.md`);
