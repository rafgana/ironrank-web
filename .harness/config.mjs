// .harness/config.mjs — carga y valida .harness/config.json
// Uso: import { config } from "./.harness/config.mjs";

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const CONFIG_PATH = resolve(".harness/config.json");

export function loadConfig() {
  if (!existsSync(CONFIG_PATH)) {
    throw new Error(`.harness/config.json not found at ${CONFIG_PATH}. Run: scripts/harness/init-config.mjs`);
  }
  return JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
}

// Helper: get nested value with default
export function get(obj, path, defaultValue = null) {
  const keys = path.split(".");
  let cur = obj;
  for (const k of keys) {
    if (cur == null) return defaultValue;
    cur = cur[k];
  }
  return cur ?? defaultValue;
}

// CLI: dump config
if (import.meta.url === `file://${process.argv[1]}`) {
  const config = loadConfig();
  const action = process.argv[2] || "show";
  if (action === "show") {
    console.log(JSON.stringify(config, null, 2));
  } else if (action === "get") {
    const path = process.argv[3];
    if (!path) {
      console.error("Usage: config.mjs get <path> (e.g., 'project.name')");
      process.exit(1);
    }
    console.log(get(config, path));
  } else {
    console.error("Usage: config.mjs [show|get <path>]");
    process.exit(1);
  }
}
