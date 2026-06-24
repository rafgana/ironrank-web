#!/usr/bin/env node
// pipeline/sync-supabase.mjs — push local state to Supabase
// Uso: SUPABASE_SERVICE_ROLE_KEY=... node scripts/pipeline/sync-supabase.mjs

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://aemajqeksudfljdzsvfe.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
  console.error("✗ SUPABASE_SERVICE_ROLE_KEY not set");
  process.exit(1);
}

const PROSPECTS_FILE = resolve(".harness/prospects.json");
if (!existsSync(PROSPECTS_FILE)) {
  console.error("✗ prospects.json not found");
  process.exit(1);
}

const prospects = JSON.parse(readFileSync(PROSPECTS_FILE, "utf8"));
console.log(`\n=== Sync to Supabase ===\n`);
console.log(`Prospects to sync: ${prospects.length}`);

// Skeleton: el pipeline-operator agent implementará la lógica real
// Por ahora, hace un upsert de cada prospect via REST API
const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "resolution=merge-duplicates",
};

let synced = 0;
let failed = 0;
for (const p of prospects) {
  // Mapear el schema local a Supabase
  const row = {
    id: p.id,
    company: p.company,
    domain: p.domain,
    industry: p.industry,
    size_estimate: p.size_estimate,
    geography: p.geography,
    founders: p.founders || [],
    signals: p.signals || [],
    enrichment: p.enrichment || {},
    fit_score: p.fit_score || 0,
    angle: p.angle,
    icp: p.icp,
    source: p.source,
    status: p.status || "draft",
  };
  // Skip si hay campos null o vacíos que rompen el schema
  Object.keys(row).forEach((k) => {
    if (row[k] === "" || row[k] === "<to be filled>") row[k] = null;
  });

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/agency_prospects`, {
      method: "POST",
      headers,
      body: JSON.stringify(row),
    });
    if (res.ok) {
      console.log(`  ✓ ${p.company} (${p.status})`);
      synced++;
    } else {
      const err = await res.text();
      console.log(`  ✗ ${p.company}: ${res.status} ${err.slice(0, 100)}`);
      failed++;
    }
  } catch (e) {
    console.log(`  ✗ ${p.company}: ${e.message}`);
    failed++;
  }
}

console.log(`\nSynced: ${synced}, Failed: ${failed}`);
console.log("\nNOTE: the agency_prospects table must exist in Supabase.");
console.log("Run scripts/pipeline/schema.sql in Supabase SQL editor first.");
