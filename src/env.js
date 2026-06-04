import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

export function parseEnvText(text) {
  const env = {};

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    if (key) {
      env[key] = value;
    }
  }

  return env;
}

export function loadEnvFile(baseDir) {
  const envPath = path.join(baseDir, ".env");

  if (!existsSync(envPath)) {
    return;
  }

  const envValues = parseEnvText(readFileSync(envPath, "utf-8"));

  for (const [key, value] of Object.entries(envValues)) {
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}
