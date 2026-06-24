#!/usr/bin/env node
// Lista los posts en content/posts/ con título y fecha

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import matter from "gray-matter";

const POSTS_DIR = resolve("content/posts");
if (!existsSync(POSTS_DIR)) {
  console.log("content/posts/ no existe");
  process.exit(0);
}

const files = readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md"));
if (files.length === 0) {
  console.log("No hay posts.");
  process.exit(0);
}

const posts = files.map((f) => {
  const raw = readFileSync(join(POSTS_DIR, f), "utf8");
  return matter(raw).data;
});

posts.sort((a, b) => new Date(b.date) - new Date(a.date));

console.log(`\n${posts.length} posts:\n`);
for (const p of posts) {
  console.log(`  ${p.date}  ${p.slug}`);
  console.log(`    ${p.title}`);
  console.log(`    ${p.readingTime || "?"} min · ${p.description?.slice(0, 80) || "(sin descripción)"}${p.description?.length > 80 ? "..." : ""}`);
  console.log();
}
