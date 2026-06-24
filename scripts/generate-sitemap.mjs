#!/usr/bin/env node
// Genera public/sitemap.xml con lastmod = fecha actual
// Se ejecuta antes de cada build para que lastmod sea siempre real

import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const BASE = "https://rafagandia.com/ironrank";
const now = new Date().toISOString().slice(0, 10);

const urls = [
  { loc: "/", changefreq: "weekly", priority: "1.0" },
  { loc: "/landing/", changefreq: "weekly", priority: "0.9" },
  { loc: "/manifest.json", changefreq: "monthly", priority: "0.5" },
];

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

const out = resolve("public/sitemap.xml");
writeFileSync(out, xml, "utf8");
console.log(`sitemap.xml generado: ${urls.length} URLs (lastmod=${now})`);

if (existsSync("dist/sitemap.xml")) {
  writeFileSync("dist/sitemap.xml", xml, "utf8");
  console.log("Copiado a dist/sitemap.xml");
}
