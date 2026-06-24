#!/usr/bin/env node
// gtm/proposal-gen.mjs — skeleton for generating a GTM proposal
// Uso: node scripts/gtm/proposal-gen.mjs --id <uuid>

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const args = process.argv.slice(2);
const idIdx = args.indexOf("--id");
const ID = idIdx > -1 ? args[idIdx + 1] : null;

if (!ID) {
  console.error("Uso: node scripts/gtm/proposal-gen.mjs --id <uuid>");
  process.exit(1);
}

const PROSPECTS_FILE = resolve(".harness/prospects.json");
if (!existsSync(PROSPECTS_FILE)) {
  console.error("✗ prospects.json not found");
  process.exit(1);
}

const prospects = JSON.parse(readFileSync(PROSPECTS_FILE, "utf8"));
const prospect = prospects.find((p) => p.id === ID);
if (!prospect) {
  console.error(`✗ Prospect not found: ${ID}`);
  process.exit(1);
}

const slug = prospect.company.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
const out = resolve(`.harness/proposals/${slug}.md`);
mkdirSync(resolve(".harness/proposals"), { recursive: true });

console.log(`\n=== Proposal generation ===\n`);
console.log(`Company: ${prospect.company}`);
console.log(`Domain: ${prospect.domain}`);
console.log(`Fit score: ${prospect.fit_score || 0}`);
console.log(`Output: ${out}\n`);

// Skeleton: el gtm-strategist agent llenará el contenido real
const skeleton = `# Proposal: ${prospect.company}

## Executive summary
- Their problem: <filled by gtm-strategist based on dossier>
- Our solution: <our GTM system: research + outbound + automation>
- ROI estimate: <based on their stage and our typical impact>

## What we'll build
- Market research automation (ICP + dossier)
- Outbound system (email + LinkedIn sequences)
- Pipeline tracking (CRM + analytics)
- Optional: content engine (SEO blog)
- Optional: paid acquisition (Google/Meta ads)

## Timeline
- Week 1: discovery + setup
- Week 2: build + integrate
- Week 3: test + refine
- Week 4: handoff + training

## Pricing
- Setup fee: €3,000-€8,000 (one-time)
- Monthly retainer: €1,500-€3,000/month (includes 10-20h support)
- OR project-based: €5,000-€15,000 for 4 weeks

## What's included
- (per scope)

## What's NOT included
- (explicit list to prevent scope creep)

## Success criteria
- 30 days: 50+ qualified prospects in pipeline
- 90 days: 5+ qualified leads per month from outbound

## Risks
- (honest list)

## Next step
- [ ] Schedule 30min call
- [ ] Send SOW
- [ ] Invoice setup fee

---
Prospect: ${prospect.id}
Company: ${prospect.company}
Domain: ${prospect.domain}
Locale: <es|en>
Generated: ${new Date().toISOString()}
Status: draft
`;

writeFileSync(out, skeleton);
console.log(`✓ Created draft proposal: ${out}`);
console.log(`\nNEXT STEPS:`);
console.log(`  1. The gtm-strategist subagent will fill in the real content`);
console.log(`  2. Review pricing against your cost structure`);
console.log(`  3. Send when ready`);
