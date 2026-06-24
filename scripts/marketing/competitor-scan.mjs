#!/usr/bin/env node
// competitor-scan.mjs — fetch a competitor URL and extract SEO + positioning signals
// Usage: node scripts/marketing/competitor-scan.mjs <url>

import { load } from "cheerio";

const url = process.argv[2];
if (!url) {
  console.error("Uso: node scripts/marketing/competitor-scan.mjs <url>");
  process.exit(1);
}

console.log(`Fetching ${url} ...`);

try {
  const res = await fetch(url, {
    headers: { "User-Agent": "IronRank-Research/1.0" },
  });
  if (!res.ok) {
    console.error(`✗ HTTP ${res.status}`);
    process.exit(1);
  }
  const html = await res.text();
  const $ = load(html);

  const title = $("title").text().trim();
  const metaDescription = $('meta[name="description"]').attr("content") || "";
  const h1 = $("h1").first().text().trim();
  const h2s = $("h2").map((_, el) => $(el).text().trim()).get().slice(0, 10);

  // JSON-LD
  const schemas = $('script[type="application/ld+json"]')
    .map((_, el) => {
      try {
        return JSON.parse($(el).html() || "{}")["@type"];
      } catch {
        return "invalid";
      }
    })
    .get();

  // Sitemap
  let sitemap = null;
  try {
    const sitemapUrl = new URL("/sitemap.xml", url).toString();
    const sr = await fetch(sitemapUrl);
    if (sr.ok) {
      const xml = await sr.text();
      sitemap = (xml.match(/<loc>/g) || []).length;
    }
  } catch {
    /* ignore */
  }

  // robots.txt
  let robots = { hasSitemap: false, hasAIBots: false };
  try {
    const robotsUrl = new URL("/robots.txt", url).toString();
    const rr = await fetch(robotsUrl);
    if (rr.ok) {
      const txt = await rr.text();
      robots.hasSitemap = txt.includes("Sitemap:");
      robots.hasAIBots = /GPTBot|ChatGPT-User|PerplexityBot|Applebot-Extended/i.test(txt);
    }
  } catch {
    /* ignore */
  }

  // OG image
  const ogImage = $('meta[property="og:image"]').attr("content") || "";

  // Word count
  const bodyText = $("body").text().replace(/\s+/g, " ").trim();
  const wordCount = bodyText.split(" ").length;

  const result = {
    url,
    title: title.slice(0, 80),
    metaDescription: metaDescription.slice(0, 160),
    h1: h1.slice(0, 80),
    h2s: h2s.slice(0, 5),
    schemas,
    sitemap,
    robots,
    ogImage: ogImage ? "yes" : "no",
    wordCount,
  };

  console.log("\n=== Competitor scan ===");
  for (const [k, v] of Object.entries(result)) {
    if (Array.isArray(v)) {
      console.log(`${k}: ${v.join(", ")}`);
    } else {
      console.log(`${k}: ${v}`);
    }
  }
} catch (e) {
  console.error(`✗ Error: ${e.message}`);
  process.exit(1);
}
