import { readFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

export interface CalcConfig {
  macros: Record<string, string>;
}

export function loadConfig(): CalcConfig {
  const defaultConfig: CalcConfig = { macros: {} };
  const configPath = join(homedir(), ".calcrc");
  try {
    const raw = readFileSync(configPath, "utf-8");
    const parsed = JSON.parse(raw);
    return { ...defaultConfig, ...parsed };
  } catch {
    return defaultConfig;
  }
}
