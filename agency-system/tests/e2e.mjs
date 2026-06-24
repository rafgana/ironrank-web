#!/usr/bin/env node
// tests/e2e.mjs — E2E tests for the agency system
import { existsSync, writeFileSync, mkdirSync, rmSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { execSync } from "node:child_process";

const AGENCY_DIR = resolve(".");
const SCRIPTS = `${AGENCY_DIR}/scripts/agency.mjs`;

let pass = 0;
let fail = 0;
const failures = [];

function test(name, fn) {
  return async () => {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      pass++;
    } catch (e) {
      console.log(`  ✗ ${name}: ${e.message}`);
      fail++;
      failures.push({ name, error: e.message });
    }
  };
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || "Assertion failed");
}

console.log("\n[1. agency help shows usage]");
await test("help", async () => {
  const out = execSync(`node ${SCRIPTS} help 2>&1`).toString();
  assert(out.includes("Usage:"), "should show Usage");
  assert(out.includes("research icp"), "should list research icp");
  assert(out.includes("outbound email"), "should list outbound email");
})();

console.log("\n[2. agency status works on empty state]");
await test("status empty", async () => {
  // Backup existing
  const pp = `${AGENCY_DIR}/.harness/prospects.json`;
  let backup = null;
  if (existsSync(pp)) {
    backup = readFileSync(pp, "utf8");
    rmSync(pp);
  }
  try {
    const out = execSync(`node ${SCRIPTS} status 2>&1`).toString();
    assert(out.includes("Pipeline status"), "should show pipeline status");
  } finally {
    if (backup) writeFileSync(pp, backup);
  }
})();

console.log("\n[3. agency research icp creates prospect]");
await test("icp search", async () => {
  const out = execSync(`node ${SCRIPTS} research icp "B2B SaaS, 10-50 employees, Spain" 2>&1`).toString();
  assert(out.includes("Created draft entry"), "should create draft entry");
  const pp = `${AGENCY_DIR}/.harness/prospects.json`;
  assert(existsSync(pp), "prospects.json should exist");
  const prospects = JSON.parse(readFileSync(pp, "utf8"));
  assert(prospects.length >= 1, "should have at least 1 prospect");
  const last = prospects[prospects.length - 1];
  assert(last.icp.includes("B2B SaaS"), "ICP should be saved");
  assert(last.status === "draft", "status should be draft");
})();

console.log("\n[4. agency outbound email composes from dossier]");
await test("outbound email", async () => {
  // Create test dossier
  const dossierPath = `${AGENCY_DIR}/.harness/dossiers/test-person.md`;
  mkdirSync(`${AGENCY_DIR}/.harness/dossiers`, { recursive: true });
  writeFileSync(
    dossierPath,
    "# Dossier: Test Person\n\n## Basics\n- Role: CEO at Test Co\n- LinkedIn: linkedin.com/in/test\n",
  );
  try {
    const out = execSync(
      `node ${SCRIPTS} outbound email --dossier ${dossierPath} --tone casual --locale es 2>&1`,
    ).toString();
    assert(out.includes("Created draft email"), "should create email");
    const slug = "test-person";
    const emailPath = `${AGENCY_DIR}/.harness/sequences/${slug}/01-cold.md`;
    assert(existsSync(emailPath), "01-cold.md should exist");
    const email = readFileSync(emailPath, "utf8");
    assert(email.includes("Subject"), "should have Subject section");
    assert(email.includes("Body"), "should have Body section");
    assert(email.includes("Follow-up"), "should have Follow-up section");
    assert(email.includes("Locale: es"), "should record locale");
  } finally {
    rmSync(dossierPath, { force: true });
    rmSync(`${AGENCY_DIR}/.harness/sequences/test-person`, { recursive: true, force: true });
  }
})();

console.log("\n[5. agency status shows pipeline counts]");
await test("status with data", async () => {
  const out = execSync(`node ${SCRIPTS} status 2>&1`).toString();
  assert(out.includes("Pipeline status"), "should show status");
  assert(out.includes("Prospects:"), "should count prospects");
})();

console.log("\n[6. Skills and config exist]");
await test("structure", async () => {
  assert(existsSync(`${AGENCY_DIR}/.harness/config.json`), "config.json");
  assert(existsSync(`${AGENCY_DIR}/.claude/skills/market-researcher/SKILL.md`), "market-researcher SKILL");
  assert(existsSync(`${AGENCY_DIR}/.claude/skills/outbound-writer/SKILL.md`), "outbound-writer SKILL");
  assert(existsSync(`${AGENCY_DIR}/scripts/agency.mjs`), "agency CLI");
  assert(existsSync(`${AGENCY_DIR}/scripts/research/icp-search.mjs`), "icp-search");
  assert(existsSync(`${AGENCY_DIR}/scripts/outbound/email-compose.mjs`), "email-compose");
})();

console.log("\n[7. enrich, proposal, sync scripts exist and are executable]");
await test("scripts", async () => {
  for (const s of [
    "scripts/enrichment/lead-enrich.mjs",
    "scripts/gtm/proposal-gen.mjs",
    "scripts/pipeline/sync-supabase.mjs",
  ]) {
    const path = `${AGENCY_DIR}/${s}`;
    assert(existsSync(path), `${s} should exist`);
    const stat = execSync(`stat -c %a ${path}`).toString().trim();
    assert(stat === "755" || stat === "775", `${s} should be executable, got ${stat}`);
  }
  // Schema SQL
  assert(existsSync(`${AGENCY_DIR}/scripts/pipeline/schema.sql`), "schema.sql should exist");
})();

console.log("\n[8. all 5 subagent skills exist]");
await test("all skills", async () => {
  const expected = [
    "market-researcher",
    "outbound-writer",
    "lead-enricher",
    "gtm-strategist",
    "pipeline-operator",
  ];
  for (const s of expected) {
    assert(existsSync(`${AGENCY_DIR}/.claude/skills/${s}/SKILL.md`), `Missing skill: ${s}/SKILL.md`);
  }
})();

console.log("\n[9. CLI handles unknown commands gracefully]");
await test("unknown command", async () => {
  try {
    execSync(`node ${SCRIPTS} bogus 2>&1`, { stdio: "pipe" });
    throw new Error("should have failed");
  } catch (e) {
    // Should exit with non-zero
    assert(e.status !== 0, "should exit non-zero");
    assert(e.stderr.toString().includes("Unknown") || e.stdout.toString().includes("Unknown"), "should say Unknown");
  }
})();

console.log("\n[10. enrich transitions status draft -> enriched]");
await test("enrich transition", async () => {
  // Create a draft prospect
  execSync(`node ${SCRIPTS} research icp "Test for enrich" 2>&1`, { stdio: "pipe" });
  const pp = `${AGENCY_DIR}/.harness/prospects.json`;
  const before = JSON.parse(readFileSync(pp, "utf8"));
  const last = before[before.length - 1];
  assert(last.status === "draft", "should start as draft");
  // Enrich
  execSync(`node ${SCRIPTS} enrich ${last.id} 2>&1`, { stdio: "pipe" });
  const after = JSON.parse(readFileSync(pp, "utf8"));
  const updated = after.find((p) => p.id === last.id);
  assert(updated.status === "enriched", `should be enriched, got ${updated.status}`);
  assert(updated.enrichment, "should have enrichment field");
})();

console.log(`\nResults: ${pass} pass, ${fail} fail`);
if (fail > 0) {
  console.log("\nFailures:");
  failures.forEach((f) => console.log(`  - ${f.name}: ${f.error}`));
}
process.exit(fail > 0 ? 1 : 0);
