#!/usr/bin/env node
// supervisor/monitor.mjs — chequea salud de todos los subagentes
// Output: tabla con estado por subagente

import { readFileSync, existsSync, statSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { execSync } from "node:child_process";

const REGISTRY = resolve(".harness/agent-registry.json");
if (!existsSync(REGISTRY)) {
  console.error("✗ .harness/agent-registry.json missing. Run: scripts/harness/state.sh init");
  process.exit(1);
}

const reg = JSON.parse(readFileSync(REGISTRY, "utf8"));
const today = new Date();
const STALE_DAYS = 90;
const STALE_MS = STALE_DAYS * 24 * 60 * 60 * 1000;

const report = [];
let broken = 0;
let stale = 0;
let drift = 0;
let ok = 0;

for (const [name, agent] of Object.entries(reg.agents)) {
  if (agent.deprecated) {
    report.push({ name, status: "DEPRECATED", note: "marked deprecated" });
    continue;
  }

  const checks = [];
  let status = "OK";

  // 1. Skill file exists
  if (!existsSync(resolve(agent.skillPath))) {
    checks.push("skill missing");
    status = "BROKEN";
  }

  // 2. Frontmatter valid
  if (existsSync(resolve(agent.skillPath))) {
    const raw = readFileSync(resolve(agent.skillPath), "utf8");
    const fm = raw.match(/^---\n([\s\S]*?)\n---/);
    if (!fm) {
      checks.push("no frontmatter");
      status = "BROKEN";
    } else {
      if (!/^name:/m.test(fm[1])) checks.push("missing name in frontmatter");
      if (!/^version:/m.test(fm[1])) checks.push("missing version in frontmatter");
      if (!/^grantedTools:/m.test(fm[1])) checks.push("missing grantedTools in frontmatter");
      if (!/^description:/m.test(fm[1])) checks.push("missing description in frontmatter");
    }
  }

  // 3. Scripts exist + executable
  for (const script of agent.scripts || []) {
    const scriptPath = resolve(`scripts/${agent.team}/${script}`);
    if (!existsSync(scriptPath)) {
      checks.push(`script missing: ${script}`);
      status = status === "OK" ? "DRIFT" : status;
    } else {
      try {
        const mode = statSync(scriptPath).mode;
        if (!(mode & 0o111)) {
          checks.push(`not executable: ${script}`);
        }
      } catch {
        checks.push(`cannot stat: ${script}`);
      }
    }
  }

  // 4. Invariants count
  if (!agent.invariants || agent.invariants.length < 3) {
    checks.push(`only ${(agent.invariants || []).length} invariants (need ≥3)`);
    status = status === "OK" ? "DRIFT" : status;
  }

  // 5. Last modified (stale check)
  if (existsSync(resolve(agent.skillPath))) {
    const mtime = statSync(resolve(agent.skillPath)).mtime;
    if (today - mtime > STALE_MS) {
      const days = Math.floor((today - mtime) / (24 * 60 * 60 * 1000));
      checks.push(`stale (${days}d)`);
      if (status === "OK") status = "STALE";
    }
  }

  if (status === "BROKEN") broken++;
  else if (status === "STALE") stale++;
  else if (status === "DRIFT") drift++;
  else ok++;

  report.push({ name, status, note: checks.join(", ") || "—" });
}

console.log("\n=== Agent health report ===\n");
const ICON = { OK: "✓", DRIFT: "⚠", STALE: "○", BROKEN: "✗", DEPRECATED: "·" };
console.log("status   | name                 | note");
console.log("-".repeat(80));
for (const r of report) {
  console.log(`${ICON[r.status] || "?"} ${r.status.padEnd(8)} | ${r.name.padEnd(20)} | ${r.note}`);
}

console.log(`\nSummary: ${ok} OK, ${drift} DRIFT, ${stale} STALE, ${broken} BROKEN`);
console.log(`Total registered: ${Object.keys(reg.agents).length}`);

// Persist last report
writeFileSync(
  resolve(".harness/evals/agents.json"),
  JSON.stringify({ ts: new Date().toISOString(), report, summary: { ok, drift, stale, broken } }, null, 2),
);
console.log("\nSaved to .harness/evals/agents.json");
