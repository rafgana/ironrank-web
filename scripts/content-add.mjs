#!/usr/bin/env node
// Crea un post vacío en content/posts/ con frontmatter válido
// Uso: node scripts/content-add.mjs "Título del post"
//      node scripts/content-add.mjs "Título del post" --topic comparativa
//      node scripts/content-add.mjs "Título del post" --date 2026-07-01

import { writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const args = process.argv.slice(2);
if (args.length === 0 || args[0].startsWith("--")) {
  console.error("Uso: node scripts/content-add.mjs \"Título del post\" [--date YYYY-MM-DD] [--reading N]");
  process.exit(1);
}

const title = args[0];
const dateIdx = args.indexOf("--date");
const date = dateIdx > -1 ? args[dateIdx + 1] : new Date().toISOString().slice(0, 10);

const readingIdx = args.indexOf("--reading");
const reading = readingIdx > -1 ? args[readingIdx + 1] : "5";

const slug = title
  .toLowerCase()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "") // sin tildes
  .replace(/[^a-z0-9\s-]/g, "")
  .trim()
  .replace(/\s+/g, "-")
  .slice(0, 60);

const path = resolve("content/posts", `${slug}.md`);
if (existsSync(path)) {
  console.error(`✗ Ya existe: content/posts/${slug}.md`);
  process.exit(1);
}

const template = `---
title: "${title}"
slug: "${slug}"
date: ${date}
description: ""
keywords: []
author: "IronRank"
readingTime: ${reading}
tldr: ""
---

# ${title}

Escribe aquí el contenido del post. 800-1500 palabras recomendado.

Secciones sugeridas: introducción, comparativa/argumento, ejemplo práctico, conclusión con CTA.
`;

writeFileSync(path, template, "utf8");
console.log(`✓ Post creado: content/posts/${slug}.md`);
console.log("  Edita frontmatter + body, luego:");
console.log("  npm run build");
