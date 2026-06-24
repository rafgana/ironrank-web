#!/usr/bin/env node
// harness/init-config.mjs — scaffoldea .harness/config.json en un proyecto nuevo
// Uso: node scripts/harness/init-config.mjs [--name "Mi Proyecto"] [--stack react-vite-supabase]

import { existsSync, writeFileSync, mkdirSync, copyFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { execSync } from "node:child_process";

const args = process.argv.slice(2);
const nameIdx = args.indexOf("--name");
const stackIdx = args.indexOf("--stack");

const NAME = nameIdx > -1 ? args[nameIdx + 1] : "my-project";
const STACK = stackIdx > -1 ? args[stackIdx + 1] : "react-vite-supabase";

console.log(`\n=== Init agent-harness ===\n`);
console.log(`Project: ${NAME}`);
console.log(`Stack: ${STACK}\n`);

// 1. Verificar que no existe ya
if (existsSync(".harness/config.json")) {
  console.error("✗ .harness/config.json already exists. Aborting.");
  process.exit(1);
}

// 2. Crear directorios
console.log("[1/5] Creating directories...");
for (const d of [".harness", ".harness/state", ".harness/logs", ".harness/evals", ".claude/skills", "scripts/harness", "scripts/ops", "scripts/product", "scripts/marketing", "scripts/loop-engineer", "scripts/supervisor"]) {
  mkdirSync(d, { recursive: true });
}
console.log("  ✓ .harness/, .claude/, scripts/{harness,ops,product,marketing,loop-engineer,supervisor}/");

// 3. Crear config.json
console.log("\n[2/5] Creating .harness/config.json...");
const config = {
  "$schema": "./config.schema.json",
  "version": 1,
  "project": {
    name: NAME,
    displayName: NAME.charAt(0).toUpperCase() + NAME.slice(1),
    description: "",
    type: "spa",
    stack: STACK,
    language: "en",
    license: "MIT",
  },
  build: {
    framework: STACK.startsWith("react") ? "react" : STACK.startsWith("next") ? "next" : "other",
    buildCommand: "npm run build",
    devCommand: "npm run dev",
    testCommand: "node tests/e2e.mjs",
    typecheckCommand: "npx tsc --noEmit",
    lintCommand: "npm run lint",
    outputDir: "dist",
    publicDir: "public",
    srcDir: "src",
  },
  deploy: {
    method: "manual",
    url: "",
    previewUrl: `http://127.0.0.1:4173/${NAME}/`,
  },
  database: {
    primary: "none",
    local: "none",
    schemaVersionFile: "",
    schemaVersionMatch: "",
  },
  seo: {
    siteUrl: "",
    siteName: NAME,
    twitterHandle: "",
    defaultOgImage: "/og.png",
    sitemapPath: "public/sitemap.xml",
    robotsPath: "public/robots.txt",
  },
  agents: {
    registry: ".harness/agent-registry.json",
    skillsDir: ".claude/skills",
    stateDir: ".harness/state",
    logsDir: ".harness/logs",
    scriptsDir: "scripts",
  },
  harness: {
    cron: "0 8 * * 1",
    maxChangesPerAgentPerDay: 1,
    secretPatterns: [
      "sb_secret_[A-Za-z0-9]{20,}",
      "AIzaSy[A-Za-z0-9_-]{33}",
      "sk-[A-Za-z0-9]{40,}",
      "sk-ant-[A-Za-z0-9-]{40,}",
      "ghp_[A-Za-z0-9]{30,}",
      "AKIA[0-9A-Z]{16}",
    ],
    ignoreFiles: [
      "tests/e2e.mjs",
      "node_modules/",
      "dist/",
      ".harness/logs/",
      ".harness/evals/",
    ],
  },
};
writeFileSync(".harness/config.json", JSON.stringify(config, null, 2));
console.log("  ✓ .harness/config.json");

// 4. State files
console.log("\n[3/5] Creating state files...");
const state = {
  schemaVersion: 1,
  lastVerifiedAt: null,
  lastCommitSha: null,
  lastTestPass: 0,
  lastTestFail: 0,
};
const plan = { version: 1, queue: [], current: null };
const query = { ts: new Date().toISOString(), scope: "agent-turn", context: {} };
writeFileSync(".harness/state/state.json", JSON.stringify(state, null, 2));
writeFileSync(".harness/state/plan.json", JSON.stringify(plan, null, 2));
writeFileSync(".harness/state/query.json", JSON.stringify(query, null, 2));
console.log("  ✓ state.json, plan.json, query.json");

// 5. agent-registry.json (vacio, con los 18 subagentes base)
console.log("\n[4/5] Creating agent-registry.json...");
const teams = ["tech", "marketing", "meta", "product", "ops"];
const skillsList = [
  "architect", "implementer", "verifier", "docs-writer", "release-manager",
  "marketing-strategist", "copywriter", "seo-analyst", "growth-hacker",
  "supervisor", "loop-engineer",
  "product-manager", "ux-researcher", "data-analyst", "customer-support",
  "security-auditor", "devops", "data-engineer", "sre",
];
const agentsObj = {};
for (const s of skillsList) {
  const team = s === "supervisor" || s === "loop-engineer" ? "meta" :
    s === "product-manager" || s === "ux-researcher" || s === "data-analyst" || s === "customer-support" ? "product" :
    s === "security-auditor" || s === "devops" || s === "data-engineer" || s === "sre" ? "ops" :
    s === "marketing-strategist" || s === "copywriter" || s === "seo-analyst" || s === "growth-hacker" ? "marketing" : "tech";
  agentsObj[s] = {
    name: s, team,
    purpose: `TODO: define purpose for ${s}`,
    skillPath: `.claude/skills/${s}/SKILL.md`,
    scripts: [], version: "1", grantedTools: ["read", "glob", "grep"],
    invokedBy: ["main"], outputs: [],
    invariants: ["TODO: 1", "TODO: 2", "TODO: 3"],
    lastInvokedAt: null, health: "ok", deprecated: false,
  };
}
const registry = {
  "$schema": "./agent-registry.schema.json",
  "version": 1,
  "lastReviewedAt": new Date().toISOString(),
  "agents": agentsObj,
};
writeFileSync(".harness/agent-registry.json", JSON.stringify(registry, null, 2));
console.log("  ✓ agent-registry.json (19 agents registered)");

// 6. Placeholder SKILL.md files
console.log("\n[5/5] Creating SKILL.md templates...");
for (const s of skillsList) {
  const dir = `.claude/skills/${s}`;
  mkdirSync(dir, { recursive: true });
  const skillMd = `---
name: ${s}
description: TODO: describe what ${s} does
version: 1
grantedTools: [read, glob, grep]
---

# ${s}

You are the **${s}** subagent. TODO: write what this agent does.

## When to invoke

TODO

## Inputs you receive

TODO

## What you produce

TODO

## Constraints (HARD)

- TODO 1
- TODO 2
- TODO 3
- TODO 4
- TODO 5
`;
  writeFileSync(`${dir}/SKILL.md`, skillMd);
}
console.log(`  ✓ ${skillsList.length} SKILL.md templates`);

console.log("\n=== Init complete ===\n");
console.log("Next steps:");
console.log("  1. Edit .harness/config.json with your project details");
console.log("  2. Fill in TODO items in .claude/skills/*/SKILL.md");
console.log("  3. Edit agents in .harness/agent-registry.json (purpose, scripts, invariants)");
console.log("  4. Copy scripts from agent-harness-template repo to scripts/{harness,ops,product,marketing,loop-engineer,supervisor}/");
console.log("  5. Copy .github/workflows/{ci,self-improve}.yml");
console.log("  6. Run: node scripts/supervisor/monitor.mjs (verify all agents OK)");
console.log("  7. Run: node scripts/ops/security-audit.mjs (verify security baseline)");
console.log("");
console.log("Or install via: npx @ironrank/harness init (coming soon)");
