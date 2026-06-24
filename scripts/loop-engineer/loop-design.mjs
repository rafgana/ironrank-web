#!/usr/bin/env node
// loop-design.mjs — scaffoldea un loop tipado desde template
// Uso: node scripts/loop-design.mjs <name> --type <build|fix|explore> [--description "..."]

import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const args = process.argv.slice(2);
const name = args[0];
if (!name) {
  console.error("Uso: node scripts/loop-design.mjs <name> --type <build|fix|explore>");
  process.exit(1);
}

const typeIdx = args.indexOf("--type");
const type = typeIdx > -1 ? args[typeIdx + 1] : "build";
const descIdx = args.indexOf("--description");
const description = descIdx > -1 ? args[descIdx + 1] : "<fill in: what this loop accomplishes>";

if (!["build", "fix", "explore"].includes(type)) {
  console.error(`✗ Type must be 'build', 'fix', or 'explore', got: ${type}`);
  process.exit(1);
}

const LOOPS_DIR = resolve(".harness/loops");
mkdirSync(LOOPS_DIR, { recursive: true });
const path = resolve(`${LOOPS_DIR}/${name}.md`);

if (existsSync(path)) {
  console.error(`✗ Loop already exists: ${path}`);
  process.exit(1);
}

const templates = {
  build: `# Loop: ${name} (build)

> ${description}

## Type
build — full feature lifecycle: plan → implement → verify → document → release

## Phases

1. **architect** — produce FEATURE_INTAKE.md
   - Expected duration: <5 min
   - Output: \`.harness/intake/<name>.md\`
   - Abort if: feature out of scope, no user need

2. **implementer** — code + tests
   - Expected duration: <30 min
   - Abort if: verify.sh fails 3 times in a row
   - Output: diff

3. **verifier** — run verify + evals
   - Expected duration: <3 min
   - Abort if: bundle +>10%, a11y critical, no coverage
   - Output: APPROVE / REJECT

4. **docs-writer** — blog post if user-facing
   - Expected duration: <10 min
   - Abort if: feature not user-facing
   - Output: \`content/posts/<slug>.md\`

5. **release-manager** — commit + push
   - Expected duration: <1 min
   - Abort if: secrets in diff
   - Output: commit

## Success criteria
- All 5 phases complete
- verify.sh passes
- No drift from FEATURE_INTAKE.md

## Retry policy
- Each phase can be re-run up to 2 times
- After 2 retries, escalate to user
- Total budget: 60 min

## Metrics to track
- Phase durations (log to .harness/logs/)
- Retry counts per phase
- Total time to completion
`,

  fix: `# Loop: ${name} (fix)

> ${description}

## Type
fix — bug fix: reproduce → diagnose → patch → verify

## Phases

1. **verifier** — reproduce the bug
   - Expected duration: <5 min
   - Output: failing test or repro steps
   - Abort if: bug not reproducible

2. **implementer** — diagnose + patch
   - Expected duration: <15 min
   - Output: diff
   - Abort if: root cause unclear after 2 attempts

3. **verifier** — re-verify the fix
   - Expected duration: <3 min
   - Output: passing test, no regressions
   - Abort if: regression introduced

4. **release-manager** — commit
   - Expected duration: <1 min
   - Output: commit (type: \`fix:\`)

## Success criteria
- Bug no longer reproduces
- No regressions
- Test added to prevent recurrence

## Retry policy
- Each phase can be re-run up to 2 times
- After 2 retries, escalate to user
- Total budget: 30 min

## Metrics to track
- Time to reproduce
- Time to fix
- Number of patches attempted
`,
  explore: `# Loop: ${name} (explore)

> ${description}

## Type
explore — research only: investigate → report. No commits.

## Phases

1. **seo-analyst** OR **marketing-strategist** OR **architect** — investigate
   - Expected duration: <15 min
   - Output: report (STRATEGY.md, SEO.md, or analysis doc)
   - Abort if: scope too large, split into smaller explores

2. **loop-engineer** — log outcome
   - Expected duration: <1 min
   - Output: log entry in \`.harness/logs/<date>.jsonl\`
   - Abort if: report missing

## Success criteria
- Report produced
- No commits created
- Findings documented for future reference

## Retry policy
- Single pass only
- If insufficient, spawn another explore loop
- Total budget: 20 min

## Metrics to track
- Time to complete
- Report length
- Followup actions generated
`,
};

const tmpl = templates[type];
writeFileSync(path, tmpl, "utf8");
console.log(`✓ Created ${path}`);
console.log(`  Type: ${type}`);
console.log(`\nNext:`);
console.log(`  1. Edit ${path} to fill in specifics`);
console.log(`  2. Run: ./scripts/loop-engineer/loop-trace.mjs (after first use)`);
console.log(`  3. Run: ./scripts/loop-engineer/loop-optimize.mjs (after 3+ uses)`);
