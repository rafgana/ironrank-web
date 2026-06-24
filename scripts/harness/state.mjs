#!/usr/bin/env node
// state.sh — read/write harness state files
// Usage:
//   ./scripts/harness/state.sh read <file>
//   ./scripts/harness/state.sh write <file> <json>
//   ./scripts/harness/state.sh init

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const [, , cmd, file, ...rest] = process.argv;
const STATE_DIR = resolve(".harness/state");
mkdirSync(STATE_DIR, { recursive: true });

const defaultState = {
  schemaVersion: 1,
  lastVerifiedAt: null,
  lastCommitSha: null,
  lastTestPass: 0,
  lastTestFail: 0,
};

const defaultPlan = {
  version: 1,
  queue: [],
  current: null,
};

const defaultQuery = {
  ts: new Date().toISOString(),
  scope: "agent-turn",
  context: {},
};

if (cmd === "init") {
  if (!existsSync(`${STATE_DIR}/state.json`)) writeFileSync(`${STATE_DIR}/state.json`, JSON.stringify(defaultState, null, 2));
  if (!existsSync(`${STATE_DIR}/plan.json`)) writeFileSync(`${STATE_DIR}/plan.json`, JSON.stringify(defaultPlan, null, 2));
  if (!existsSync(`${STATE_DIR}/query.json`)) writeFileSync(`${STATE_DIR}/query.json`, JSON.stringify(defaultQuery, null, 2));
  console.log("initialized:", `${STATE_DIR}/{state,plan,query}.json`);
  process.exit(0);
}

if (cmd === "read") {
  if (!file) {
    console.error("Usage: state.sh read <state|plan|query>");
    process.exit(1);
  }
  const path = `${STATE_DIR}/${file}.json`;
  if (!existsSync(path)) {
    console.error(`missing: ${path}`);
    process.exit(1);
  }
  console.log(readFileSync(path, "utf8"));
  process.exit(0);
}

if (cmd === "write") {
  if (!file || rest.length === 0) {
    console.error("Usage: state.sh write <state|plan|query> <json>");
    process.exit(1);
  }
  const json = rest.join(" ");
  JSON.parse(json);
  const path = `${STATE_DIR}/${file}.json`;
  writeFileSync(path, json);
  console.log(`wrote: ${path}`);
  process.exit(0);
}

console.error("Usage: state.sh {read|write|init} [file] [json]");
process.exit(1);
