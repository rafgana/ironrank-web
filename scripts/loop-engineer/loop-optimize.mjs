#!/usr/bin/env node
// loop-optimize.mjs — detecta cuellos de botella en loops y propone mejoras
// Output: .harness/LOOP_PROPOSAL.md con diffs sugeridos a SKILL.md de otros agentes
// Uso: node scripts/loop-engineer/loop-optimize.mjs [--auto-apply]
//      --auto-apply: aplica los diffs (solo añadir líneas, con guardrails)

import { readFileSync, readdirSync, existsSync, writeFileSync } from "node:fs";

const args = process.argv.slice(2);
import { resolve, join } from "node:path";

const LOGS_DIR = resolve(".harness/logs");
const SKILLS_DIR = resolve(".claude/skills");
const REGISTRY = resolve(".harness/agent-registry.json");

if (!existsSync(LOGS_DIR)) {
  console.error("✗ .harness/logs/ missing. Run: scripts/supervisor/seed-logs.mjs");
  process.exit(1);
}

if (!existsSync(REGISTRY)) {
  console.error("✗ .harness/agent-registry.json missing");
  process.exit(1);
}

// Cargar entries
const entries = [];
for (const f of readdirSync(LOGS_DIR).filter((f) => f.endsWith(".jsonl"))) {
  for (const line of readFileSync(join(LOGS_DIR, f), "utf8").split("\n").filter(Boolean)) {
    try {
      entries.push(JSON.parse(line));
    } catch {
      /* ignore */
    }
  }
}

const proposals = [];
const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
const recent = entries.filter((e) => new Date(e.ts).getTime() > sevenDaysAgo);

// 1. SLOW PHASES: duration_ms > 180000 (3 min) en últimos 7 días
const slowByAgent = {};
for (const e of recent) {
  const dur = e.details?.duration_ms;
  if (dur && dur > 180000) {
    const agent = e.action.split("_")[0];
    slowByAgent[agent] = (slowByAgent[agent] || 0) + 1;
  }
}
for (const [agent, count] of Object.entries(slowByAgent)) {
  if (count >= 2) {
    proposals.push({
      type: "slow-phase",
      agent,
      metric: `${count} runs over 3 min in last 7 days`,
      action: `Add to ${agent}/SKILL.md: 'Break work into smaller steps; commit progress incrementally'`,
      proposed_diff: `+ ## Performance
+ - Expected duration per phase: <3 min
+ - If over budget: split into smaller commits
+ - If 2+ slow runs in 7d: review the agent's instructions for over-scoping`,
    });
  }
}

// 2. HIGH RETRY: misma acción repetida >2 veces en 7 días
const actionCounts = {};
for (const e of recent) {
  actionCounts[e.action] = (actionCounts[e.action] || 0) + 1;
}
for (const [action, count] of Object.entries(actionCounts)) {
  if (count > 2) {
    const agent = action.split("_")[0];
    proposals.push({
      type: "high-retry",
      agent,
      metric: `${action} invoked ${count}× in 7 days`,
      action: `Add to ${agent}/SKILL.md: 'If task fails, diagnose first; do not retry blindly'`,
      proposed_diff: `+ ## Retry policy
+ - If a task fails: read the error, don't retry blindly
+ - If 2 retries fail: escalate to user, do not loop`,
    });
  }
}

// 3. VERIFY LOOP HELL: implementer + verifier muy cercanos en el tiempo (verify falla y reintenta)
const verifyFails = recent.filter((e) => e.action.startsWith("verifier_") && e.details?.ok === false);
if (verifyFails.length >= 2) {
  proposals.push({
    type: "verify-loop-hell",
    agent: "implementer",
    metric: `${verifyFails.length} verify failures in 7 days`,
    action: `Add to implementer/SKILL.md: 'Always run verify.sh locally before reporting success; never hand off broken code'`,
    proposed_diff: `+ ## Pre-handoff checklist
+ - [ ] verify.sh passes locally
+ - [ ] No console.log / debugger / TODO
+ - [ ] No secrets in diff
+ - [ ] Bundle size delta < 10%`,
  });
}

// 4. DEAD AGENTS: agent invocado sin outputs correspondientes
const registry = JSON.parse(readFileSync(REGISTRY, "utf8"));
for (const [name, agent] of Object.entries(registry.agents)) {
  if (agent.deprecated) continue;
  const invocations = recent.filter((e) => e.action.startsWith(name + "_")).length;
  if (invocations === 0 && name !== "loop-engineer" && name !== "supervisor") {
    // Solo flaggear si existe el log (es decir, no es un agente "nuevo")
    if (entries.some((e) => e.action.startsWith(name + "_"))) {
      proposals.push({
        type: "dead-agent",
        agent: name,
        metric: `Not invoked in last 7 days`,
        action: `Consider: is this agent still needed? Or is the workflow bypassing it?`,
        proposed_diff: null,
      });
    }
  }
}

// 5. SUCCESS RATE por agente
const successByAgent = {};
for (const e of recent) {
  const agent = e.action.split("_")[0];
  if (!successByAgent[agent]) successByAgent[agent] = { ok: 0, fail: 0 };
  if (e.details?.ok === true) successByAgent[agent].ok++;
  else if (e.details?.ok === false) successByAgent[agent].fail++;
}
for (const [agent, stats] of Object.entries(successByAgent)) {
  const total = stats.ok + stats.fail;
  if (total < 2) continue;
  const successRate = (stats.ok / total) * 100;
  if (successRate < 70) {
    proposals.push({
      type: "low-success-rate",
      agent,
      metric: `${successRate.toFixed(0)}% success (${stats.ok}/${total})`,
      action: `Add to ${agent}/SKILL.md: 'Review recent failures; tighten the workflow'`,
      proposed_diff: `+ ## Quality bar
+ - Target success rate: >85%
+ - If <70%: review recent failures, tighten scope or improve inputs`,
    });
  }
}

// Output
const ts = new Date().toISOString();
let md = `# Loop optimization proposals

Generated: ${ts}
Analyzed: ${entries.length} log entries (${recent.length} in last 7 days)

`;

if (proposals.length === 0) {
  md += `✓ No issues detected. Loops are healthy.\n`;
} else {
  md += `Total proposals: ${proposals.length}\n\n`;
  for (const [i, p] of proposals.entries()) {
    md += `## ${i + 1}. ${p.type} (${p.agent || "—"})\n\n`;
    md += `- **Metric**: ${p.metric}\n`;
    md += `- **Action**: ${p.action}\n`;
    if (p.proposed_diff) {
      md += `- **Proposed diff to ${p.agent}/SKILL.md**:\n\n\`\`\`diff\n${p.proposed_diff}\n\`\`\`\n`;
    }
    md += "\n";
  }
}

const outPath = resolve(".harness/LOOP_PROPOSAL.md");
writeFileSync(outPath, md, "utf8");
console.log(`\n=== Loop optimization: ${proposals.length} proposals ===\n`);
for (const p of proposals) {
  console.log(`  [${p.type}] ${p.agent || "—"}: ${p.metric}`);
}
console.log(`\nSaved to ${outPath}`);

// ============================================================
// AUTO-APPLY (opt-in via --auto-apply flag)
// ============================================================
// Aplica los diffs propuestos a los SKILL.md de otros agentes.
// Solo aplica diffs que AÑADEN secciones (+ líneas), nunca los
// que eliminan (- líneas). Respeta guardrails: nunca toca
// archivos críticos, limita 1 cambio/agente/día, etc.

const autoApply = args.includes("--auto-apply");
if (autoApply && proposals.length > 0) {
  console.log(`\n=== AUTO-APPLY (--auto-apply flag) ===\n`);
  const { statSync: ss } = await import("node:fs");
  const stateFile = resolve(".harness/state/state.json");
  const state = JSON.parse(readFileSync(stateFile, "utf8"));
  state.lastAutoApply = state.lastAutoApply || {};
  const today = new Date().toISOString().slice(0, 10);

  let applied = 0;
  let skipped = 0;
  let manual = 0;

  for (const p of proposals) {
    if (!p.proposed_diff || !p.agent) {
      console.log(`  · [${p.type}] no diff, skipped`);
      skipped++;
      continue;
    }

    // GUARDRAIL 1: solo añadir (+ líneas), nunca eliminar
    const hasNegativeLines = p.proposed_diff
      .split("\n")
      .some((l) => l.startsWith("- ") && !l.startsWith("+ "));
    if (hasNegativeLines) {
      console.log(`  ✗ [${p.type}] ${p.agent}: contiene líneas a eliminar, MANUAL_REQUIRED`);
      manual++;
      continue;
    }

    const skillPath = resolve(`.claude/skills/${p.agent}/SKILL.md`);
    if (!existsSync(skillPath)) {
      console.log(`  ✗ [${p.type}] ${p.agent}: SKILL.md missing, MANUAL_REQUIRED`);
      manual++;
      continue;
    }

    // GUARDRAIL 2: 1 cambio por agente por día
    if (state.lastAutoApply[p.agent] === today) {
      console.log(`  · [${p.type}] ${p.agent}: ya aplicado hoy, skipped`);
      skipped++;
      continue;
    }

    // GUARDRAIL 3: si ya tiene la sección "Auto-improved by loop-engineer", no duplicar
    const skillContent = readFileSync(skillPath, "utf8");
    if (skillContent.includes("## Auto-improved by loop-engineer")) {
      console.log(`  · [${p.type}] ${p.agent}: ya tiene sección auto-improved, skipped (run --force para re-aplicar)`);
      skipped++;
      continue;
    }

    // GUARDRAIL 4: no tocar archivos críticos
    const FORBIDDEN = ["dist/", ".env", "node_modules/", "package-lock.json"];
    if (FORBIDDEN.some((f) => skillPath.includes(f))) {
      console.log(`  ✗ [${p.type}] ${p.agent}: ruta prohibida, MANUAL_REQUIRED`);
      manual++;
      continue;
    }

    // GUARDRAIL 5: solo si el agente no está deprecated
    const registry = JSON.parse(readFileSync(REGISTRY, "utf8"));
    if (registry.agents[p.agent]?.deprecated) {
      console.log(`  · [${p.type}] ${p.agent}: deprecated, skipped`);
      skipped++;
      continue;
    }

    // APLICAR
    const before = readFileSync(skillPath, "utf8");
    const newLines = p.proposed_diff
      .split("\n")
      .filter((l) => l.startsWith("+ ") && !l.startsWith("++"))
      .map((l) => l.slice(2));
    if (newLines.length === 0) {
      console.log(`  ✗ [${p.type}] ${p.agent}: diff vacío, MANUAL_REQUIRED`);
      manual++;
      continue;
    }
    const newSection = `\n## Auto-improved by loop-engineer\n\n_${new Date().toISOString()}_\n\n${newLines.join("\n")}\n`;
    const after = before.trimEnd() + "\n" + newSection;
    writeFileSync(skillPath, after, "utf8");
    state.lastAutoApply[p.agent] = today;
    applied++;
    console.log(`  ✓ [${p.type}] ${p.agent}: applied (${newLines.length} lines added)`);

    // Log
    const logLine = JSON.stringify({
      ts: new Date().toISOString(),
      action: "loop-engineer_auto_applied",
      target: skillPath,
      details: { type: p.type, metric: p.metric, lines_added: newLines.length },
    });
    const logFile = resolve(`.harness/logs/${today}.jsonl`);
    const fs = await import("node:fs");
    const existing = existsSync(logFile) ? readFileSync(logFile, "utf8") : "";
    writeFileSync(logFile, existing + logLine + "\n", "utf8");
  }

  // Persist state
  writeFileSync(stateFile, JSON.stringify(state, null, 2));

  console.log(`\nResult: ${applied} applied, ${skipped} skipped, ${manual} require manual review`);
  console.log(`Run: ./scripts/supervisor/monitor.mjs to verify health.`);
}
