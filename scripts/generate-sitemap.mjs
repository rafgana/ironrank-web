#!/usr/bin/env node
// Genera public/sitemap.xml y dist/sitemap.xml con lastmod = fecha actual
// Se ejecuta al final del build para que incluya los posts del blog

import { writeFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";

const BASE = "https://rafagandia.com/ironrank";
const now = new Date().toISOString().slice(0, 10);

const urls = [
  { loc: "/", changefreq: "weekly", priority: "1.0" },
  { loc: "/landing/", changefreq: "weekly", priority: "0.9" },
  { loc: "/blog/", changefreq: "weekly", priority: "0.8" },
  { loc: "/manifest.json", changefreq: "monthly", priority: "0.5" },
];

// Posts dinámicos desde content/posts/
const POSTS_DIR = resolve("content/posts");
if (existsSync(POSTS_DIR)) {
  const posts = readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md"));
  for (const p of posts) {
    const slug = p.replace(/\.md$/, "");
    urls.push({ loc: `/blog/${slug}/`, changefreq: "monthly", priority: "0.7" });
  }
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${BASE}${u.loc}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>
`;

const pub = resolve("public/sitemap.xml");
const dist = resolve("dist/sitemap.xml");

writeFileSync(pub, xml, "utf8");
writeFileSync(dist, xml, "utf8");
console.log(`sitemap.xml generado: ${urls.length} URLs (lastmod=${now})`);
