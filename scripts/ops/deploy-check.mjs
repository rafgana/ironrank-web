#!/usr/bin/env node
// ops/deploy-check.mjs — pre-deploy checks
// Verifies: build works, tests pass, no uncommitted changes, security audit clean

import { execSync } from "node:child_process";
import { existsSync } from "node:fs";

const checks = [];
let failed = 0;

function check(name, fn) {
  try {
    const result = fn();
    checks.push({ name, status: "✓", result });
    console.log(`  ✓ ${name}${result ? `: ${result}` : ""}`);
  } catch (e) {
    checks.push({ name, status: "✗", error: e.message });
    failed++;
    console.log(`  ✗ ${name}: ${e.message}`);
  }
}

console.log(`\n=== Pre-deploy checks ===\n`);

// [1/5] Working tree clean
console.log("[1/5] Git status:");
check("No uncommitted changes", () => {
  const status = execSync("git status --porcelain").toString().trim();
  if (status) throw new Error(`uncommitted: ${status.split("\n").length} files`);
  return "clean";
});

// [2/5] TypeScript compiles
console.log("\n[2/5] TypeScript:");
check("tsc --noEmit", () => {
  execSync("npx tsc --noEmit", { stdio: "pipe" });
  return "OK";
});

// [3/5] Build works
console.log("\n[3/5] Build:");
check("npm run build", () => {
  execSync("npm run build", { stdio: "pipe" });
  const distExists = existsSync("dist");
  if (!distExists) throw new Error("dist/ not created");
  return "dist/ created";
});

// [4/5] Tests pass
console.log("\n[4/5] Tests:");
check("E2E tests (26+ scenarios)", () => {
  execSync("SUPABASE_SERVICE_ROLE_KEY= node tests/e2e.mjs", {
    stdio: "pipe",
    timeout: 300000,
  });
  return "OK";
});

// [5/5] Security audit clean
console.log("\n[5/5] Security:");
check("No CRITICAL security findings", () => {
  try {
    execSync("node scripts/ops/security-audit.mjs", { stdio: "pipe" });
  } catch (e) {
    throw new Error("CRITICAL findings in security audit");
  }
  return "clean";
});

// Summary
console.log(`\n=== Summary ===\n`);
const passed = checks.filter((c) => c.status === "✓").length;
console.log(`  ${passed}/${checks.length} checks passed`);
if (failed > 0) {
  console.log(`  ${failed} checks FAILED — DO NOT DEPLOY`);
  process.exit(1);
}
console.log(`  ✓ Ready to deploy\n`);
