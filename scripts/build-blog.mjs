#!/usr/bin/env node
// Genera HTML estático para cada post en content/posts/*.md
// Salida: dist/blog/index.html y dist/blog/<slug>/index.html

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { resolve, join } from "node:path";
import matter from "gray-matter";
import { marked } from "marked";

const POSTS_DIR = resolve("content/posts");
const OUT_DIR = resolve("dist/blog");
const BASE = "https://rafagandia.com/ironrank";
const OG_IMAGE = `${BASE}/og-landing.png`;

marked.setOptions({ gfm: true, breaks: false });

if (!existsSync(POSTS_DIR)) {
  console.error("✗ content/posts/ no existe. Crea la carpeta.");
  process.exit(1);
}

const files = readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md"));
if (files.length === 0) {
  console.log("No hay posts en content/posts/");
}

// Cleanup OUT_DIR (no el root dist/blog para no chocar con sitemap)
if (existsSync(OUT_DIR)) {
  rmSync(OUT_DIR, { recursive: true, force: true });
}
mkdirSync(OUT_DIR, { recursive: true });

const posts = files.map((file) => {
  const raw = readFileSync(join(POSTS_DIR, file), "utf8");
  const { data, content } = matter(raw);
  const html = marked.parse(content);
  return { ...data, html, file };
});

// Ordenar por fecha desc
posts.sort((a, b) => new Date(b.date) - new Date(a.date));

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function postTemplate(post, { withArticle = true } = {}) {
  const url = `${BASE}/blog/${post.slug}/`;
  const desc = escapeHtml(post.description || "");
  const title = `${post.title} · IronRank Blog`;

  const article = withArticle
    ? `
  <article class="post-body">
    ${post.html}
  </article>
  <footer class="post-footer">
    <a class="cta" href="https://rafagandia.com/ironrank/">Probar IronRank →</a>
    <a class="back" href="${BASE}/blog/">← Ver todos los posts</a>
  </footer>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": ${JSON.stringify(post.title)},
    "description": ${JSON.stringify(post.description || "")},
    "datePublished": "${new Date(post.date).toISOString()}",
    "dateModified": "${new Date(post.date).toISOString()}",
    "author": { "@type": "Organization", "name": "IronRank" },
    "publisher": {
      "@type": "Organization",
      "name": "IronRank",
      "logo": { "@type": "ImageObject", "url": "${BASE}/apple-touch-icon.png" }
    },
    "mainEntityOfPage": { "@type": "WebPage", "@id": "${url}" },
    "url": "${url}",
    "image": "${OG_IMAGE}",
    "inLanguage": "es-ES",
    "keywords": ${JSON.stringify(post.keywords || [])}
  }
  </script>`
    : "";

  return `<!doctype html>
<html lang="es" dir="ltr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${desc}" />
    <meta name="author" content="${escapeHtml(post.author || "IronRank")}" />
    <link rel="canonical" href="${url}" />

    <meta property="og:type" content="article" />
    <meta property="og:url" content="${url}" />
    <meta property="og:title" content="${escapeHtml(post.title)}" />
    <meta property="og:description" content="${desc}" />
    <meta property="og:image" content="${OG_IMAGE}" />
    <meta property="og:site_name" content="IronRank" />
    <meta property="og:locale" content="es_ES" />
    <meta property="article:published_time" content="${new Date(post.date).toISOString()}" />
    <meta property="article:author" content="${escapeHtml(post.author || "IronRank")}" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(post.title)}" />
    <meta name="twitter:description" content="${desc}" />
    <meta name="twitter:image" content="${OG_IMAGE}" />

    <link rel="icon" type="image/svg+xml" href="/ironrank/favicon.svg" />
    <link rel="apple-touch-icon" href="/ironrank/apple-touch-icon.png" />
    <link rel="stylesheet" href="/ironrank/landing/style.css" />
    <link rel="stylesheet" href="/ironrank/landing/badges.css" />
  </head>
  <body class="blog">
    <header class="blog-header">
      <a class="blog-brand" href="/ironrank/landing/">
        <span class="nav-logo-mark">IR</span>
        <span>IronRank</span>
      </a>
      <a class="blog-back" href="/ironrank/blog/">← Blog</a>
    </header>
    <main class="blog-main">
      <header class="post-header">
        <h1>${escapeHtml(post.title)}</h1>
        ${post.tldr ? `<p class="post-tldr"><strong>TL;DR:</strong> ${escapeHtml(post.tldr)}</p>` : ""}
        <div class="post-meta">
          <time datetime="${new Date(post.date).toISOString()}">${new Date(post.date).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}</time>
          <span>·</span>
          <span>${post.readingTime || 5} min lectura</span>
          <span>·</span>
          <span>${escapeHtml(post.author || "IronRank")}</span>
        </div>
      </header>${article}
    </main>
    <footer class="blog-footer">
      <p>IronRank · Tracker de gym con sistema de ligas · <a href="/ironrank/landing/">Volver a la landing</a></p>
    </footer>
  </body>
</html>`;
}

function indexTemplate(posts) {
  const items = posts
    .map(
      (p) => `
    <article class="post-card">
      <a href="${BASE}/blog/${p.slug}/">
        <h2>${escapeHtml(p.title)}</h2>
        ${p.tldr ? `<p class="post-card-tldr">${escapeHtml(p.tldr)}</p>` : ""}
        <div class="post-card-meta">
          <time datetime="${new Date(p.date).toISOString()}">${new Date(p.date).toLocaleDateString("es-ES", { year: "numeric", month: "short", day: "numeric" })}</time>
          <span>·</span>
          <span>${p.readingTime || 5} min</span>
        </div>
      </a>
    </article>`,
    )
    .join("");

  return `<!doctype html>
<html lang="es" dir="ltr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>Blog · IronRank</title>
    <meta name="description" content="Posts sobre entrenamiento, sistema de ligas, comparativas y consejos para llevar tu gym tracker al siguiente nivel." />
    <link rel="canonical" href="${BASE}/blog/" />

    <meta property="og:type" content="website" />
    <meta property="og:url" content="${BASE}/blog/" />
    <meta property="og:title" content="Blog · IronRank" />
    <meta property="og:description" content="Posts sobre entrenamiento, sistema de ligas, comparativas y consejos para llevar tu gym tracker al siguiente nivel." />
    <meta property="og:image" content="${OG_IMAGE}" />
    <meta property="og:site_name" content="IronRank" />

    <link rel="icon" type="image/svg+xml" href="/ironrank/favicon.svg" />
    <link rel="apple-touch-icon" href="/ironrank/apple-touch-icon.png" />
    <link rel="stylesheet" href="/ironrank/landing/style.css" />
    <link rel="stylesheet" href="/ironrank/landing/badges.css" />
  </head>
  <body class="blog">
    <header class="blog-header">
      <a class="blog-brand" href="/ironrank/landing/">
        <span class="nav-logo-mark">IR</span>
        <span>IronRank</span>
      </a>
    </header>
    <main class="blog-main">
      <header class="blog-index-header">
        <h1>Blog de IronRank</h1>
        <p>Posts sobre entrenamiento, sistema de ligas, comparativas y consejos.</p>
      </header>
      <div class="post-grid">${items}
      </div>
    </main>
    <footer class="blog-footer">
      <p>IronRank · Tracker de gym con sistema de ligas · <a href="/ironrank/landing/">Volver a la landing</a></p>
    </footer>
  </body>
</html>`;
}

// Generar index
writeFileSync(join(OUT_DIR, "index.html"), indexTemplate(posts), "utf8");
console.log(`✓ Blog index: ${posts.length} posts`);

// Generar cada post
for (const post of posts) {
  const dir = join(OUT_DIR, post.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), postTemplate(post), "utf8");
}
console.log(`✓ ${posts.length} posts generados en dist/blog/`);
