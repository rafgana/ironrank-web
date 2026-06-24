#!/usr/bin/env node
// content-brief.mjs — genera un brief para un post a partir de un keyword
// Uso: node scripts/marketing/content-brief.mjs "<keyword>" [--intent informational|transactional|comparison]

import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const args = process.argv.slice(2);
const keyword = args[0];
if (!keyword) {
  console.error("Uso: node scripts/marketing/content-brief.mjs \"<keyword>\" [--intent <type>]");
  process.exit(1);
}

const intentIdx = args.indexOf("--intent");
const intent = intentIdx > -1 ? args[intentIdx + 1] : "informational";

const slug = keyword
  .toLowerCase()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9\s-]/g, "")
  .trim()
  .replace(/\s+/g, "-")
  .slice(0, 60);

const readingTime = 8;

// Templates por intent
const sections = {
  informational: [
    "Introducción: por qué importa este tema",
    "El problema real (con datos si es posible)",
    "Cómo funciona / la verdad sobre X",
    "Errores comunes",
    "Lo que aprendimos / conclusión",
    "CTA: Probar IronRank →",
  ],
  transactional: [
    "Quiénes somos (1 párrafo)",
    "El problema que resolvemos",
    "Cómo funciona IronRank (3 pasos)",
    "Por qué confiar (datos, no claims)",
    "Pricing / Empezar gratis",
    "FAQ rápido",
    "CTA: Probar IronRank →",
  ],
  comparison: [
    "TL;DR (tabla comparativa)",
    "Cómo probamos cada uno",
    "Strong: pros, contras, para quién",
    "Hevy: pros, contras, para quién",
    "IronRank: pros, contras, para quién (sesgo declarado)",
    "Veredicto honesto",
    "CTA: Probar IronRank →",
  ],
};

const template = sections[intent] || sections.informational;

const brief = {
  keyword,
  slug,
  intent,
  readingTime,
  wordTarget: 800,
  sections: template,
  metaDescription: `${keyword}: guía honesta 2026. Sin fluff, sin clickbait. IronRank blog.`,
  keywords: [keyword, "gym", "tracker"],
  internalLinks: [],
  externalLinks: [],
};

console.log(`\n=== Content brief: "${keyword}" ===\n`);
console.log(`Slug: ${slug}`);
console.log(`Intent: ${intent}`);
console.log(`Reading time: ${readingTime} min`);
console.log(`Word target: ${brief.wordTarget}`);
console.log("\nSections:");
for (const s of template) console.log(`  - ${s}`);

const path = resolve(`.harness/intake/${slug}.json`);
mkdirSync(resolve(".harness/intake"), { recursive: true });
writeFileSync(path, JSON.stringify(brief, null, 2));
console.log(`\nBrief saved to ${path}`);
console.log(`\nNext: run \`npm run content:add "${keyword}"\` and use the brief above.`);
