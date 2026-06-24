#!/usr/bin/env node
// supervisor/evolve.mjs — detecta patrones y propone evolución
// Detecta: drift, overlap, gap, stale-invariant

import { readFileSync, existsSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { resolve, join } from "node:path";

const REGISTRY = resolve(".harness/agent-registry.json");
const LOGS_DIR = resolve(".harness/logs");

if (!existsSync(REGISTRY)) {
  console.error("✗ .harness/agent-registry.json missing");
  process.exit(1);
}

const reg = JSON.parse(readFileSync(REGISTRY, "utf8"));
const proposals = [];

// 1. OVERLAP: dos subagentes con >50% overlap en outputs + scripts compartidos
//    (NO medimos solo grantedTools porque todos comparten read/grep/glob por defecto)
const agents = Object.values(reg.agents).filter((a) => !a.deprecated);
for (let i = 0; i < agents.length; i++) {
  for (let j = i + 1; j < agents.length; j++) {
    const a = agents[i];
    const b = agents[j];
    // Outputs overlap
    const aOut = new Set((a.outputs || []).map((o) => o.toLowerCase()));
    const bOut = new Set((b.outputs || []).map((o) => o.toLowerCase()));
    const outIntersect = [...aOut].filter((t) => bOut.has(t)).length;
    const outUnion = new Set([...aOut, ...bOut]).size;
    const outOverlap = outUnion === 0 ? 0 : outIntersect / outUnion;

    // Scripts overlap
    const aScripts = new Set(a.scripts || []);
    const bScripts = new Set(b.scripts || []);
    const scriptOverlap = aScripts.size > 0 && bScripts.size > 0
      ? [...aScripts].filter((s) => bScripts.has(s)).length / Math.max(aScripts.size, bScripts.size)
      : 0;

    // Solo flagear si outputs >50% O scripts compartidos >50%
    if (outOverlap > 0.5 || scriptOverlap > 0.5) {
      proposals.push({
        type: "overlap",
        agents: [a.name, b.name],
        metric: `${Math.round(outOverlap * 100)}% outputs, ${Math.round(scriptOverlap * 100)}% scripts`,
        action: `Consider merging or differentiating ${a.name} and ${b.name}`,
      });
    }
  }
}

// 2. ORPHAN SCRIPTS: scripts que existen pero no están en ningún subagente
//    Excluimos los scripts del harness (que son compartidos por el main agent)
//    y los del supervisor (que son del meta-agent)
const scriptsDir = resolve("scripts");
const allScripts = new Set();
if (existsSync(scriptsDir)) {
  for (const team of readdirSync(scriptsDir)) {
    const teamPath = join(scriptsDir, team);
    if (!existsSync(teamPath) || !teamPath.includes("scripts/")) continue;
    try {
      for (const f of readdirSync(teamPath)) {
        if (f.endsWith(".mjs") || f.endsWith(".sh")) allScripts.add(`${team}/${f}`);
      }
    } catch {
      /* ignore */
    }
  }
}

const usedScripts = new Set();
for (const agent of agents) {
  for (const s of agent.scripts || []) usedScripts.add(`${agent.team}/${s}`);
}

// Scripts del harness y supervisor son intencionalmente compartidos
const SHARED_TEAMS = new Set(["harness", "supervisor", "loop-engineer"]);

for (const script of allScripts) {
  const [team] = script.split("/");
  if (SHARED_TEAMS.has(team)) continue; // harness + supervisor son compartidos
  if (!usedScripts.has(script)) {
    proposals.push({
      type: "orphan-script",
      script,
      action: `Script ${script} is not declared in any agent's registry`,
    });
  }
}

// 3. STALE: agent sin invocar en 30+ días (basado en lastInvokedAt)
const now = Date.now();
const STALE_DAYS = 30;
for (const agent of agents) {
  if (agent.lastInvokedAt) {
    const days = (now - new Date(agent.lastInvokedAt).getTime()) / (24 * 60 * 60 * 1000);
    if (days > STALE_DAYS) {
      proposals.push({
        type: "stale-agent",
        agent: agent.name,
        metric: `${Math.floor(days)} days since last invocation`,
        action: `Consider deprecating ${agent.name} or documenting when to use it`,
      });
    }
  }
}

// 4. DRIFT: SKILL.md modified >90 days ago, registry says healthy
const today = new Date();
const DRIFT_DAYS = 90;
const DRIFT_MS = DRIFT_DAYS * 24 * 60 * 60 * 1000;
for (const agent of agents) {
  const skillPath = resolve(agent.skillPath);
  if (existsSync(skillPath)) {
    const mtime = statSync(skillPath).mtime;
    const age = today - mtime;
    if (age > DRIFT_MS) {
      proposals.push({
        type: "stale-skill",
        agent: agent.name,
        metric: `skill not updated in ${Math.floor(age / (24 * 60 * 60 * 1000))} days`,
        action: `Review ${agent.skillPath} and update if needed`,
      });
    }
  }
}

// Output EVOLVE.md
const ts = new Date().toISOString();
const md = `# Evolution proposals

Generated: ${ts}

Total agents: ${agents.length}
Total proposals: ${proposals.length}

${proposals.length === 0 ? "✓ No issues detected. Harness is healthy." : ""}
${proposals
  .map(
    (p, i) =>
      `## ${i + 1}. ${p.type} ${p.agents ? `(${p.agents.join(" + ")})` : p.agent || p.script || ""}

- **Metric**: ${p.metric || "—"}
- **Action**: ${p.action}
`,
  )
  .join("\n")}
`;

const outPath = resolve(".harness/EVOLVE.md");
writeFileSync(outPath, md, "utf8");
console.log(`\n=== Evolution proposals: ${proposals.length} ===\n`);
for (const p of proposals) {
  const label = p.agents || p.agent || p.script || "?";
  console.log(`  [${p.type}] ${label}: ${p.action}`);
}
console.log(`\nSaved to ${outPath}`);
