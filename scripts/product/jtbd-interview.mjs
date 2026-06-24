#!/usr/bin/env node
// product/jtbd-interview.mjs — generate a Jobs-to-be-Done interview script
// Uso: node scripts/product/jtbd-interview.mjs "<topic>"

const topic = process.argv[2];
if (!topic) {
  console.error("Uso: node scripts/product/jtbd-interview.mjs \"<topic>\"");
  process.exit(1);
}

const script = `# JTBD interview script: ${topic}

## Pre-interview (5 min)
- Confirm recording consent
- Explain: "I'm not selling, I'm trying to understand"
- Set context: "We research how people ${topic}, no right answers"

## Section 1: Context (5 min)
- "Walk me through the last time you ${topic}. Where were you? What time of day? What triggered it?"
- "What were you doing 30 min before?"
- "What were you hoping to accomplish?"
- (Listen for: situational triggers, frequency)

## Section 2: Current solution (10 min)
- "When you ${topic} today, what do you actually do? Walk me step by step."
- "What tools do you use? Why those?"
- "How long does it take?"
- "What do you like about that?"
- "What frustrates you?"
- (Listen for: workarounds, pain points, hidden costs)

## Section 3: Desired outcome (5 min)
- "If a magic wand could fix one thing about ${topic}, what would it be?"
- "How would you know it was fixed? What would you see/feel/measure?"
- (Listen for: emotional + functional outcomes)

## Section 4: Tradeoffs (5 min)
- "What are you willing to give up to get that fix? (time, money, learning curve, privacy)"
- "What would make you NOT use the solution?"
- (Listen for: switching costs, deal-breakers)

## Closing (5 min)
- "Anything I should have asked but didn't?"
- "Anyone else I should talk to about this?"
- Thank and end recording

## After the interview
- Transcribe (or use auto-transcription with consent)
- Extract: trigger → action → outcome for each story
- Look for: shared triggers, common workarounds, emotional anchors
- Score: frequency (how often) × severity (how painful when fails)
- Update PERSONAS in RESEARCH.md
`;

console.log(script);

// Persist
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
const slug = topic.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
const path = resolve(`.harness/research/${slug}-interview.md`);
mkdirSync(resolve(".harness/research"), { recursive: true });
writeFileSync(path, script);
console.log(`\nSaved to ${path}`);
