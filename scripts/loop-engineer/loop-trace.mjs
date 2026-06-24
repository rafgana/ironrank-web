#!/usr/bin/env node
// loop-trace.mjs — mide rendimiento de loops desde .harness/logs/
// Output: tabla con duración por fase, retry count, success rate

import { readFileSync, readdirSync, existsSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";

const args = process.argv.slice(2);
const lastIdx = args.indexOf("--last");
const lastDays = lastIdx > -1 ? parseInt(args[lastIdx + 1]) : 30;

const LOGS_DIR = resolve(".harness/logs");
if (!existsSync(LOGS_DIR)) {
  console.error("✗ .harness/logs/ missing");
  process.exit(1);
}

// Cargar logs de los últimos N días
const cutoff = Date.now() - lastDays * 24 * 60 * 60 * 1000;
const entries = [];
for (const f of readdirSync(LOGS_DIR).filter((f) => f.endsWith(".jsonl"))) {
  const dayKey = f.replace(".jsonl", "");
  const dayDate = new Date(`${dayKey}T00:00:00Z`).getTime();
  if (dayDate < cutoff) continue;
  for (const line of readFileSync(join(LOGS_DIR, f), "utf8").split("\n").filter(Boolean)) {
    try {
      const entry = JSON.parse(line);
      entry._dayKey = dayKey;
      entries.push(entry);
    } catch {
      /* ignore malformed */
    }
  }
}

console.log(`\n=== Loop trace (last ${lastDays} days, ${entries.length} entries) ===\n`);

// Agrupar por sesión (entre 2 agent_invocations con gap < 5 min = misma sesión)
function groupSessions(entries) {
  const sessions = [];
  let current = [];
  for (const e of entries) {
    if (current.length === 0) {
      current.push(e);
    } else {
      const last = current[current.length - 1];
      if (new Date(e.ts).getTime() - new Date(last.ts).getTime() < 5 * 60 * 1000) {
        current.push(e);
      } else {
        sessions.push(current);
        current = [e];
      }
    }
  }
  if (current.length > 0) sessions.push(current);
  return sessions;
}

const sessions = groupSessions(entries);
console.log(`Sessions: ${sessions.length}`);

// Por sesión: duración, número de operaciones, agentes involucrados
const sessionStats = sessions.map((s) => {
  const start = new Date(s[0].ts).getTime();
  const end = new Date(s[s.length - 1].ts).getTime();
  const agents = new Set(s.map((e) => e.action.split("_")[0])).size;
  return {
    date: s[0]._dayKey,
    duration_ms: end - start,
    ops: s.length,
    agents,
    actions: s.map((e) => e.action).join(" → "),
  };
});

// Top 5 sesiones más largas
const longest = [...sessionStats].sort((a, b) => b.duration_ms - a.duration_ms).slice(0, 5);
console.log("\nTop 5 longest sessions:");
console.log("date       | duration | ops | agents | chain");
console.log("-".repeat(80));
for (const s of longest) {
  const dur = s.duration_ms < 1000
    ? `${s.duration_ms}ms`
    : `${(s.duration_ms / 1000).toFixed(1)}s`;
  console.log(`${s.date} | ${dur.padEnd(8)} | ${String(s.ops).padEnd(3)} | ${String(s.agents).padEnd(6)} | ${s.actions.slice(0, 50)}`);
}

// Por agente: cuántas veces invocado
const agentCounts = {};
for (const e of entries) {
  const agent = e.action.split("_")[0];
  agentCounts[agent] = (agentCounts[agent] || 0) + 1;
}
console.log("\nInvocations per agent:");
for (const [a, c] of Object.entries(agentCounts).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${a.padEnd(20)} ${c}`);
}

// Persist
const out = {
  ts: new Date().toISOString(),
  window_days: lastDays,
  total_entries: entries.length,
  total_sessions: sessions.length,
  longest_sessions: longest,
  invocations_per_agent: agentCounts,
};
writeFileSync(resolve(".harness/LOOP_REPORT.json"), JSON.stringify(out, null, 2));
console.log(`\nSaved to .harness/LOOP_REPORT.json`);

// Markdown
const md = `# Loop trace report

Generated: ${out.ts}
Window: last ${lastDays} days
Total entries: ${out.total_entries}
Total sessions: ${out.total_sessions}

## Top 5 longest sessions

| Date | Duration | Ops | Agents | Chain |
|---|---|---|---|---|
${longest.map((s) => `| ${s.date} | ${s.duration_ms}ms | ${s.ops} | ${s.agents} | ${s.actions.slice(0, 50)} |`).join("\n")}

## Invocations per agent

${Object.entries(agentCounts)
  .sort((a, b) => b[1] - a[1])
  .map(([a, c]) => `- **${a}**: ${c}`)
  .join("\n")}
`;
writeFileSync(resolve(".harness/LOOP_REPORT.md"), md);
