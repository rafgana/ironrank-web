#!/usr/bin/env node
// keyword-research.mjs — sugiere keywords a partir de un seed y de posts existentes
// Uso: node scripts/marketing/keyword-research.mjs "<seed>"

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import matter from "gray-matter";

const seed = process.argv[2];
if (!seed) {
  console.error("Uso: node scripts/marketing/keyword-research.mjs \"<seed>\"");
  process.exit(1);
}

// Heurística: variaciones del seed que la gente busca en Google
const templates = [
  `${seed} gratis`,
  `${seed} online`,
  `${seed} app`,
  `${seed} vs`,
  `${seed} cómo funciona`,
  `mejor ${seed}`,
  `${seed} 2026`,
  `${seed} sin cuenta`,
  `${seed} sin internet`,
  `${seed} offline`,
  `${seed} comparativa`,
  `${seed} alternativa`,
  `${seed} español`,
  `${seed} para principiantes`,
  `${seed} serio`,
  `${seed} gratis para siempre`,
];

// Cargar keywords existentes de los posts
const POSTS_DIR = resolve("content/posts");
const existing = new Set();
if (existsSync(POSTS_DIR)) {
  for (const f of readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md"))) {
    const raw = readFileSync(join(POSTS_DIR, f), "utf8");
    const { data } = matter(raw);
    for (const k of data.keywords || []) existing.add(k.toLowerCase());
  }
}

// Categorizar por intent (heurística)
function intent(kw) {
  if (/gratis|gratis para siempre|sin cuenta|sin tarjeta/i.test(kw)) return "transactional";
  if (/cómo|qué es|por qué|mejor|vs|comparativa|alternativa/i.test(kw)) return "informational/consideration";
  if (/app|online|2026|español/i.test(kw)) return "navigational";
  return "informational";
}

console.log(`\n=== Keyword research: "${seed}" ===\n`);
console.log("keyword | intent | already-covered?");
console.log("-".repeat(70));
for (const kw of templates) {
  const covered = existing.has(kw.toLowerCase()) ? "✓" : "·";
  console.log(`${kw.padEnd(40)} | ${intent(kw).padEnd(30)} | ${covered}`);
}

if (existing.size > 0) {
  console.log(`\nExisting keywords in posts: ${existing.size}`);
  for (const k of [...existing].slice(0, 10)) console.log(`  - ${k}`);
}
