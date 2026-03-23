import { readFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

export interface CalcConfig {
  precision?: number;
  format?: string;
  variables?: Record<string, number>;
  macros?: Record<string, string>;
}

export function loadConfig(filePath?: string): CalcConfig {
  const configPath = filePath ?? join(homedir(), ".calcrc");
  try {
    const data = readFileSync(configPath, "utf-8");
    return JSON.parse(data) as CalcConfig;
  } catch {
    return {};
  }
}
