#!/usr/bin/env node
// agency — main CLI for the GTM agency system
// Uso:
//   ./scripts/agency research icp "B2B SaaS, 10-50 employees, Spain"
//   ./scripts/agency research dossier "Juan Pérez" --company "Acme Inc"
//   ./scripts/agency outbound email --dossier dossiers/juan-perez.md
//   ./scripts/agency sync
//   ./scripts/agency status

const args = process.argv.slice(2);
const cmd = args[0];
const sub = args[1];

if (!cmd || cmd === "help" || cmd === "--help") {
  console.log(`agency — GTM agency CLI

Usage:
  agency research icp "<ICP>"                        Find companies matching an ICP
  agency research dossier "<name>" [--company X]    Build dossier on a person
  agency enrich <prospect-id>                        Enrich a prospect with public data
  agency outbound email --dossier <path>             Compose cold email
  agency outbound linkedin --dossier <path>          Compose LinkedIn DM
  agency proposal <prospect-id>                      Generate GTM proposal
  agency sync                                          Sync local state to Supabase
  agency review                                        Weekly pipeline review
  agency status                                        Show pipeline status
  agency help                                          Show this help
`);
  process.exit(0);
}

if (cmd === "research") {
  if (sub === "icp") {
    const icp = args[2];
    if (!icp) {
      console.error("ICP required: agency research icp \"<description>\"");
      process.exit(1);
    }
    const orig = process.argv;
    process.argv = ["node", "icp-search.mjs", "--icp", icp];
    await import("./research/icp-search.mjs");
    process.argv = orig;
  } else if (sub === "dossier") {
    const name = args[2];
    if (!name) {
      console.error("Name required: agency research dossier \"<name>\"");
      process.exit(1);
    }
    console.log("Dossier generation: not implemented yet (skeleton in place)");
  } else {
    console.error(`Unknown research subcommand: ${sub}`);
    process.exit(1);
  }
} else if (cmd === "enrich") {
  const id = args[1];
  if (!id) {
    console.error("Usage: agency enrich <prospect-id>");
    process.exit(1);
  }
  const orig = process.argv;
  process.argv = ["node", "lead-enrich.mjs", "--id", id];
  await import("./enrichment/lead-enrich.mjs");
  process.argv = orig;
} else if (cmd === "outbound") {
  if (sub === "email") {
    const remaining = args.slice(2);
    const orig = process.argv;
    process.argv = ["node", "email-compose.mjs", ...remaining];
    await import("./outbound/email-compose.mjs");
    process.argv = orig;
  } else if (sub === "linkedin") {
    console.log("LinkedIn DM: not implemented yet");
  } else {
    console.error(`Unknown outbound subcommand: ${sub}`);
    process.exit(1);
  }
} else if (cmd === "proposal") {
  const id = args[1];
  if (!id) {
    console.error("Usage: agency proposal <prospect-id>");
    process.exit(1);
  }
  const orig = process.argv;
  process.argv = ["node", "proposal-gen.mjs", "--id", id];
  await import("./gtm/proposal-gen.mjs");
  process.argv = orig;
} else if (cmd === "sync") {
  await import("./pipeline/sync-supabase.mjs");
} else if (cmd === "review") {
  console.log("Weekly review: skeleton — not implemented yet");
} else if (cmd === "status") {
  const fs = await import("node:fs");
  const prospectsFile = ".harness/prospects.json";
  const dossiersDir = ".harness/dossiers";
  const sequencesDir = ".harness/sequences";
  console.log("\n=== Pipeline status ===\n");
  if (fs.existsSync(prospectsFile)) {
    const prospects = JSON.parse(fs.readFileSync(prospectsFile, "utf8"));
    console.log(`Prospects: ${prospects.length}`);
    const byStatus = {};
    for (const p of prospects) {
      byStatus[p.status] = (byStatus[p.status] || 0) + 1;
    }
    for (const [s, n] of Object.entries(byStatus)) {
      console.log(`  ${s}: ${n}`);
    }
  } else {
    console.log("Prospects: 0 (no file)");
  }
  if (fs.existsSync(dossiersDir)) {
    const dossiers = fs.readdirSync(dossiersDir).filter((f) => f.endsWith(".md"));
    console.log(`\nDossiers: ${dossiers.length}`);
  } else {
    console.log("\nDossiers: 0 (no directory)");
  }
  if (fs.existsSync(sequencesDir)) {
    const sequences = fs.readdirSync(sequencesDir);
    console.log(`Sequences: ${sequences.length}`);
  } else {
    console.log("\nSequences: 0 (no directory)");
  }
} else {
  console.error(`Unknown command: ${cmd}`);
  console.error("Run: agency help");
  process.exit(1);
}
