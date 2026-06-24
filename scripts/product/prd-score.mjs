#!/usr/bin/env node
// product/prd-score.mjs — score a feature using RICE framework
// Uso: node scripts/product/prd-score.mjs "<feature-name>" [--reach N] [--impact 0.5] [--confidence 80] [--effort 2]

const args = process.argv.slice(2);
const name = args[0];
if (!name) {
  console.error("Uso: node scripts/product/prd-score.mjs \"<feature-name>\" [--reach N] [--impact 0.25|0.5|1|2|3] [--confidence 50-100] [--effort person-weeks]");
  process.exit(1);
}

const getArg = (flag, def) => {
  const i = args.indexOf(flag);
  return i > -1 ? args[i + 1] : def;
};

const reach = parseFloat(getArg("--reach", "100"));
const impact = parseFloat(getArg("--impact", "1"));
const confidence = parseFloat(getArg("--confidence", "80"));
const effort = parseFloat(getArg("--effort", "2"));

// RICE = (Reach × Impact × Confidence) / Effort
const rice = (reach * impact * (confidence / 100)) / effort;

console.log(`\n=== RICE score: ${name} ===\n`);
console.log(`  Reach:     ${reach} users/quarter`);
console.log(`  Impact:    ${impact} (0.25=minimal, 0.5=low, 1=medium, 2=high, 3=massive)`);
console.log(`  Confidence: ${confidence}%`);
console.log(`  Effort:    ${effort} person-weeks`);
console.log(`\n  RICE: ${rice.toFixed(2)}`);

// Interpretación
let verdict = "DEFER";
if (rice > 50) verdict = "BUILD (high priority)";
else if (rice > 20) verdict = "BUILD (medium priority)";
else if (rice > 10) verdict = "BUILD (low priority, fits in slack time)";
else if (rice > 5) verdict = "DEFER (until effort decreases or impact grows)";
else verdict = "KILL (reconsider, low value for effort)";

console.log(`\n  Verdict: ${verdict}\n`);

// Benchmarks IronRank Y1
console.log("IronRank Y1 RICE benchmarks:");
console.log("  > 50  = top priority (build now)");
console.log("  20-50 = high priority (build this quarter)");
console.log("  10-20 = medium priority (next quarter)");
console.log("  5-10  = low priority (defer)");
console.log("  < 5   = reconsider (kill or radically simpler)\n");
