#!/usr/bin/env node
// outbound/email-compose.mjs — given a dossier, generate a cold email
// Skeleton. The outbound-writer subagent will fill in the real copy.
// Uso: node scripts/outbound/email-compose.mjs --dossier <path> --tone casual

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const args = process.argv.slice(2);
const dossierIdx = args.indexOf("--dossier");
const DOSSIER = dossierIdx > -1 ? args[dossierIdx + 1] : null;
const toneIdx = args.indexOf("--tone");
const TONE = toneIdx > -1 ? args[toneIdx + 1] : "casual";
const localeIdx = args.indexOf("--locale");
const LOCALE = localeIdx > -1 ? args[localeIdx + 1] : "es";

if (!DOSSIER) {
  console.error("Uso: node scripts/outbound/email-compose.mjs --dossier <path> [--tone casual|formal] [--locale es|en]");
  process.exit(1);
}

if (!existsSync(DOSSIER)) {
  console.error(`✗ Dossier not found: ${DOSSIER}`);
  process.exit(1);
}

console.log(`\n=== Compose cold email ===\n`);
console.log(`Dossier: ${DOSSIER}`);
console.log(`Tone: ${TONE}`);
console.log(`Locale: ${LOCALE}\n`);

const dossierContent = readFileSync(DOSSIER, "utf8");
const company = dossierContent.match(/Role:.+at\s+(.+)/)?.[1]?.trim() || "the company";
const name = dossierContent.match(/Dossier:\s+(.+)/)?.[1]?.trim() || "the prospect";
const slug = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");

// Skeleton: el outbound-writer agent llenará el copy real
const dir = resolve(`.harness/sequences/${slug}`);
mkdirSync(dir, { recursive: true });

const skeleton = `# Cold email: ${name} at ${company}

## Subject (3 options)
1. <subject A — 5 words, specific>
2. <subject B — question format>
3. <subject C — value prop in subject>

## Body

<150 words. Structure:
1. Hook (1 sentence, specific to ${name})
2. Credibility (1 sentence, relevant to ${company}'s stage)
3. Ask (1 sentence, low-friction)
4. Sign-off (${LOCALE === "es" ? "Un saludo, Rafa" : "Best, Rafa"})

## Why this works
- <reason 1>
- <reason 2>

## A/B variant
<different angle, same length>

## Follow-up (if no reply in 5 days)
<second touch, different angle, 80 words>

---
Locale: ${LOCALE}
Tone: ${TONE}
Dossier: ${DOSSIER}
Composed: ${new Date().toISOString()}
Status: draft
`;

const out = resolve(`.harness/sequences/${slug}/01-cold.md`);
writeFileSync(out, skeleton);
console.log(`✓ Created draft email: ${out}`);
console.log(`\nNEXT STEPS:`);
console.log(`  1. The outbound-writer subagent will fill in the real copy`);
console.log(`  2. Review and adjust tone`);
console.log(`  3. Send manually or via your outreach tool`);
