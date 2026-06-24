#!/usr/bin/env node
// supervisor/create-skill.mjs — scaffold de un nuevo subagente
// Uso: node scripts/supervisor/create-skill.mjs <name> --team <tech|marketing> --purpose "..."

import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const args = process.argv.slice(2);
const name = args[0];
if (!name) {
  console.error("Uso: node scripts/supervisor/create-skill.mjs <name> --team <tech|marketing> --purpose \"...\"");
  process.exit(1);
}

const teamIdx = args.indexOf("--team");
const team = teamIdx > -1 ? args[teamIdx + 1] : "tech";
const purposeIdx = args.indexOf("--purpose");
const purpose = purposeIdx > -1 ? args[purposeIdx + 1] : "<to be defined>";

if (!["tech", "marketing"].includes(team)) {
  console.error(`✗ Team must be 'tech' or 'marketing', got: ${team}`);
  process.exit(1);
}

const SKILL_DIR = resolve(`.claude/skills/${name}`);
const SKILL_PATH = resolve(`${SKILL_DIR}/SKILL.md`);
const REGISTRY = resolve(".harness/agent-registry.json");

// 1. Check duplicates
if (existsSync(SKILL_PATH)) {
  console.error(`✗ Skill already exists: ${SKILL_PATH}`);
  process.exit(1);
}

// 2. Scaffold SKILL.md
mkdirSync(SKILL_DIR, { recursive: true });
const template = `---
name: ${name}
description: ${purpose}
version: 1
grantedTools: [read, glob, grep]
---

# ${name}

You are the **${name}** subagent for IronRank. Your job is to <fill in: single sentence purpose>.

## When to invoke

The main agent calls you when <fill in: trigger conditions>.

## Inputs you receive

- Current \`HARNESS.md\` (project context)
- <fill in: other inputs>

## What you produce

<fill in: outputs (files, decisions, reports)>

## Constraints (HARD)

- <rule 1>
- <rule 2>
- <rule 3>
- <rule 4>
- <rule 5>

## Useful commands

- \`./scripts/harness/context.sh\` — see project state
- \`./scripts/harness/log.sh ${name} <target>\` — log
`;
writeFileSync(SKILL_PATH, template);
console.log(`✓ Created ${SKILL_PATH}`);

// 3. Update registry
if (!existsSync(REGISTRY)) {
  console.error("✗ .harness/agent-registry.json missing");
  process.exit(1);
}
const reg = JSON.parse(readFileSync(REGISTRY, "utf8"));
if (reg.agents[name]) {
  console.error(`✗ ${name} already in registry`);
  process.exit(1);
}

reg.agents[name] = {
  name,
  team,
  purpose,
  skillPath: `.claude/skills/${name}/SKILL.md`,
  scripts: [],
  version: "1",
  grantedTools: ["read", "glob", "grep"],
  invokedBy: ["main"],
  outputs: [],
  invariants: [
    "<rule 1>",
    "<rule 2>",
    "<rule 3>",
  ],
  lastInvokedAt: null,
  health: "ok",
  deprecated: false,
};
reg.lastReviewedAt = new Date().toISOString();
writeFileSync(REGISTRY, JSON.stringify(reg, null, 2));
console.log(`✓ Updated ${REGISTRY}`);

console.log(`\nNext:`);
console.log(`  1. Edit .claude/skills/${name}/SKILL.md (fill in sections)`);
console.log(`  2. Add invariants to .harness/agent-registry.json`);
console.log(`  3. Run: node scripts/supervisor/monitor.mjs`);
