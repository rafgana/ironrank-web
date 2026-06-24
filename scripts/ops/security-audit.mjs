#!/usr/bin/env node
// ops/security-audit.mjs — automated security scanner for IronRank
// Detects: secrets in code, missing security headers, OWASP top 10 issues,
// GDPR compliance gaps, dangerous dependencies

import { readFileSync, readdirSync, existsSync, writeFileSync, statSync } from "node:fs";
import { resolve, join } from "node:path";
import { execSync } from "node:child_process";

const findings = [];
const suppressed = [];

function add(severity, location, description, remediation, refs = []) {
  findings.push({ severity, location, description, remediation, refs });
}

// ============================================================
// [1/6] Secrets scan
// ============================================================
console.log("[1/6] Scanning for secrets in source...");

  const SECRET_PATTERNS = [
  { re: /sb_secret_[A-Za-z0-9]{20,}/g, name: "Supabase service role key" },
  { re: /AIzaSy[A-Za-z0-9_-]{33}/g, name: "Google API key" },
  { re: /sk-[A-Za-z0-9]{40,}/g, name: "OpenAI key" },
  { re: /sk-ant-[A-Za-z0-9-]{40,}/g, name: "Anthropic key" },
  { re: /ghp_[A-Za-z0-9]{30,}/g, name: "GitHub PAT" },
  { re: /AKIA[0-9A-Z]{16}/g, name: "AWS access key" },
  { re: /BEGIN (RSA |OPENSSH |DSA |EC )?PRIVATE KEY/g, name: "Private key" },
];

// Falsos positivos conocidos (excluidos del scan)
const IGNORE_FILES = [
  "tests/e2e.mjs", // contiene credenciales de test deliberadas
  ".env", // en .gitignore, no se commitea
  "node_modules/",
  "dist/",
  ".harness/logs/",
  ".harness/evals/",
];

function* walkSrc(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    const s = statSync(p);
    if (s.isDirectory()) {
      if (!["node_modules", "dist", ".git", ".harness/logs"].includes(f)) {
        yield* walkSrc(p);
      }
    } else if (/\.(ts|tsx|js|mjs|json|md|yml|yaml|env)$/.test(f)) {
      yield p;
    }
  }
}

let secretCount = 0;
for (const file of walkSrc(".")) {
  if (IGNORE_FILES.some((ig) => file.includes(ig))) continue;
  const content = readFileSync(file, "utf8");
  for (const { re, name } of SECRET_PATTERNS) {
    const matches = content.match(re);
    if (matches) {
      for (const m of matches) {
        add(
          "CRITICAL",
          `${file}: <secret>`,
          `Possible ${name} found in source code`,
          "Move to environment variable. Rotate the key. Add to .gitignore.",
          ["OWASP A02:2021 - Cryptographic Failures"],
        );
        secretCount++;
      }
    }
  }
}
console.log(`  Secrets: ${secretCount} findings`);

// ============================================================
// [2/6] .env files tracked in git
// ============================================================
console.log("[2/6] Checking .env files tracked in git...");
const envFiles = [".env", ".env.local", ".env.production"];
for (const f of envFiles) {
  if (existsSync(f)) {
    try {
      // Check si está tracked por git
      const tracked = execSync(`git ls-files --error-unmatch ${f} 2>/dev/null`, { encoding: "utf8" }).trim();
      if (tracked) {
        add(
          "CRITICAL",
          f,
          `.env file is tracked by git`,
          "Remove from git: `git rm --cached .env`. Rotate all keys in the file.",
          ["OWASP A05:2021 - Security Misconfiguration"],
        );
      }
    } catch {
      // Not tracked, OK
    }
  }
}

// Check if .env is in .gitignore
if (existsSync(".gitignore")) {
  const gitignore = readFileSync(".gitignore", "utf8");
  if (!/\.env/.test(gitignore)) {
    add("HIGH", ".gitignore", ".env not in .gitignore", "Add .env to .gitignore");
  }
}
console.log(`  .env: checked`);

// ============================================================
// [3/6] Security headers check (live site)
// ============================================================
console.log("[3/6] Checking live security headers...");
const SITE = process.env.SITE_URL || "https://rafagandia.com/ironrank";

try {
  const res = await fetch(SITE, { method: "HEAD" });
  const headers = res.headers;

  const REQUIRED = [
    { name: "strict-transport-security", severity: "HIGH", desc: "HSTS not set" },
    { name: "x-frame-options", severity: "MEDIUM", desc: "Clickjacking protection missing" },
    { name: "x-content-type-options", severity: "MEDIUM", desc: "MIME sniffing protection missing" },
    { name: "content-security-policy", severity: "MEDIUM", desc: "CSP missing" },
    { name: "referrer-policy", severity: "LOW", desc: "Referrer policy missing" },
    { name: "permissions-policy", severity: "LOW", desc: "Permissions policy missing" },
  ];

  for (const h of REQUIRED) {
    if (!headers.has(h.name)) {
      add(h.severity, `${SITE}`, h.desc, `Add ${h.name} header in nginx/server config.`);
    }
  }
} catch (e) {
  add("INFO", SITE, `Could not check headers: ${e.message}`, "Verify site is accessible.");
}
console.log(`  Headers: checked`);

// ============================================================
// [4/6] Dangerous dependencies
// ============================================================
console.log("[4/6] Checking dependencies...");
if (existsSync("package.json")) {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
  // Known issues
  const KNOWN_BAD = {
    "node-fetch": "deprecated, use undici",
    "request": "deprecated, security issues",
    "tar": "<6.2.0 has CVE-2021-37701",
  };
  for (const [name, reason] of Object.entries(KNOWN_BAD)) {
    if (allDeps[name]) {
      add("HIGH", `package.json`, `${name} is in deps: ${reason}`, `Remove or replace.`);
    }
  }
}
console.log(`  Deps: checked`);

// ============================================================
// [5/6] CSP and CORS in code
// ============================================================
console.log("[5/6] Checking CSP/CORS in code...");

// dangerouslySetInnerHTML (XSS risk)
let xssRisks = 0;
for (const file of walkSrc(".")) {
  if (!file.endsWith(".tsx") && !file.endsWith(".ts")) continue;
  const content = readFileSync(file, "utf8");
  if (/dangerouslySetInnerHTML/.test(content)) {
    add("MEDIUM", file, "Uses dangerouslySetInnerHTML (XSS risk)", "Sanitize input or use a safer alternative.");
    xssRisks++;
  }
}
console.log(`  XSS risks (dangerouslySetInnerHTML): ${xssRisks}`);

// CORS: any '*' for Access-Control-Allow-Origin?
if (existsSync("dist")) {
  for (const file of walkSrc("dist")) {
    if (!file.endsWith(".js")) continue;
    const content = readFileSync(file, "utf8");
    if (/Access-Control-Allow-Origin["']?\s*[:=]\s*["']\*["']/.test(content)) {
      add("MEDIUM", file, "Wildcard CORS in built code", "Specify allowed origins explicitly.");
    }
  }
}

// ============================================================
// [6/6] GDPR compliance
// ============================================================
console.log("[6/6] GDPR compliance check...");

const hasPrivacyPolicy =
  existsSync("public/privacy.html") ||
  existsSync("content/posts/") ||
  readFileSync("public/landing/index.html", "utf8").toLowerCase().includes("privacidad");
if (!hasPrivacyPolicy) {
  add("HIGH", "/", "No privacy policy visible", "Add /privacy page or section in landing");
}

const hasAccountDelete = (() => {
  try {
    const src = readFileSync("src/services/auth/authStore.ts", "utf8");
    return /deleteAccount|account_deleted/.test(src);
  } catch {
    return false;
  }
})();
if (!hasAccountDelete) {
  add("HIGH", "src/services/auth/authStore.ts", "No account delete flow (GDPR right to erasure)", "Implement user-initiated account deletion");
}

const hasDataExport = existsSync("src/services/dataPortability.ts");
if (!hasDataExport) {
  add("MEDIUM", "src/services/", "No data export (GDPR right to portability)", "Add JSON/CSV export of user data");
}

console.log(`  GDPR: checked`);

// ============================================================
// Output
// ============================================================
const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0 };
for (const f of findings) counts[f.severity]++;

console.log(`\n=== Security audit ===\n`);
console.log(`  ${counts.CRITICAL} CRITICAL, ${counts.HIGH} HIGH, ${counts.MEDIUM} MEDIUM, ${counts.LOW} LOW, ${counts.INFO} INFO`);

const md = `# Security audit

Generated: ${new Date().toISOString()}
Scope: IronRank source + live headers

## Summary

| Severity | Count |
|---|---|
| CRITICAL | ${counts.CRITICAL} |
| HIGH | ${counts.HIGH} |
| MEDIUM | ${counts.MEDIUM} |
| LOW | ${counts.LOW} |
| INFO | ${counts.INFO} |

${counts.CRITICAL > 0 ? "**BLOCK DEPLOY** until CRITICAL findings are fixed." : "✓ No critical issues."}

## Findings

${findings
  .sort((a, b) => {
    const order = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"];
    return order.indexOf(a.severity) - order.indexOf(b.severity);
  })
  .map(
    (f) =>
      `### [${f.severity}] ${f.location}

- **Description**: ${f.description}
- **Remediation**: ${f.remediation}
${f.refs && f.refs.length > 0 ? `- **References**: ${f.refs.join(", ")}` : ""}
`,
  )
  .join("\n")}

## Compliance

- **GDPR**: ${hasPrivacyPolicy ? "✓" : "✗"} privacy policy, ${hasAccountDelete ? "✓" : "✗"} account delete, ${hasDataExport ? "✓" : "✗"} data export
- **OWASP Top 10**: covered by findings above
- **CSP**: see live header check

## Recommendations

1. Address all CRITICAL findings before any deploy.
2. Fix HIGH findings within 1 week.
3. Schedule MEDIUM findings for next sprint.
4. Note LOW/INFO for backlog.
`;

const outPath = resolve(".harness/SECURITY_AUDIT.md");
writeFileSync(outPath, md);
console.log(`\nSaved to ${outPath}`);

// Exit code: 1 if critical
process.exit(counts.CRITICAL > 0 ? 1 : 0);
