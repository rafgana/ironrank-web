#!/usr/bin/env node
// product/ticket-classify.mjs — classify an incoming support message
// Categorías: bug, feature_request, question, complaint, other
// Output: classification + suggested response approach
// Uso: node scripts/product/ticket-classify.mjs "<message>"

const message = process.argv.slice(2).join(" ");
if (!message) {
  console.error("Uso: node scripts/product/ticket-classify.mjs \"<message>\"");
  process.exit(1);
}

const lower = message.toLowerCase();

// Heurística simple (keyword-based)
const categories = {
  bug: {
    keywords: ["no funciona", "no carga", "no me carga", "me carga", "error", "crash", "broken", "falla", "no puedo", "doesn't work", "bug", "fallo", "no abre", "se cierra", "se queda"],
    weight: 0,
  },
  feature_request: {
    keywords: ["sería genial", "necesito", "podrían añadir", "would be great", "feature", "añadir", "agregar", "implementar", "new"],
    weight: 0,
  },
  question: {
    keywords: ["cómo", "donde", "cuándo", "por qué", "how", "where", "when", "why", "?", "puedo", "necesito saber"],
    weight: 0,
  },
  complaint: {
    keywords: ["molesto", "frustrante", "horrible", "decepcionado", "pésimo", "awful", "terrible", "frustrating", "annoying", "lento", "slow"],
    weight: 0,
  },
  billing: {
    keywords: ["pago", "cobro", "tarjeta", "billing", "precio", "cuesta", "gratis", "subscription", "suscripción"],
    weight: 0,
  },
};

for (const cat of Object.keys(categories)) {
  for (const kw of categories[cat].keywords) {
    if (lower.includes(kw)) categories[cat].weight++;
  }
}

const ranked = Object.entries(categories)
  .map(([k, v]) => ({ cat: k, weight: v.weight }))
  .sort((a, b) => b.weight - a.weight);

const top = ranked[0];

console.log(`\n=== Ticket classification ===\n`);
console.log(`Message: "${message}"\n`);
console.log("Top categories:");
for (const r of ranked.slice(0, 3)) {
  if (r.weight > 0) console.log(`  ${r.cat}: ${r.weight} matches`);
}

if (top.weight === 0) {
  console.log("\n  → Category: other (no clear signal)");
  console.log("  → Approach: Ask for clarification, don't assume");
} else {
  console.log(`\n  → Category: ${top.cat}`);

  // Approach
  const approaches = {
    bug: "Acknowledge. Ask for repro steps. Confirm in our bug tracker. Provide workaround if known.",
    feature_request: "Thank. Ask about use case. Add to backlog if validated by product-manager.",
    question: "Direct answer. Link to docs. Avoid jargon.",
    complaint: "Validate the emotion. Apologize sincerely. Explain what we're doing. No excuses.",
    billing: "Direct. Honest. No 'as per policy' language. Spanish match.",
  };
  console.log(`  → Approach: ${approaches[top.cat]}`);
}

// Urgency (si menciona "urgente", "ahora", "inmediato")
const urgency = ["urgente", "ahora", "inmediato", "urgent", "asap", "immediately"].some((k) => lower.includes(k));
console.log(`\n  → Urgency: ${urgency ? "HIGH (respond within 2h)" : "NORMAL (respond within 24h)"}\n`);
