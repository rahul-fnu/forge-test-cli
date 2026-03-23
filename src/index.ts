#!/usr/bin/env node
import { evaluate } from "./evaluator.js";
import { tokenize } from "./tokenizer.js";
import { startRepl } from "./repl.js";
import { ExpressionHistory } from "./history.js";
import { loadConfig } from "./config.js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const args = process.argv.slice(2);
const config = loadConfig();

if (args.includes("--version")) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const pkg = JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf-8"));
  console.log(pkg.version);
  process.exit(0);
}

if (args.includes("--help")) {
  console.log(`Usage: calc [expression] [options]

Options:
  --help       Show this help message
  --version    Show version number
  --history N  Show last N history entries

Examples:
  calc 2 + 3
  calc "(10 - 2) * 3"
  calc --version
  calc --help`);
  process.exit(0);
}

const precisionFlagIndex = args.indexOf("--precision");
const precision = precisionFlagIndex !== -1
  ? parseInt(args[precisionFlagIndex + 1], 10)
  : config.precision;

const formatFlagIndex = args.indexOf("--format");
const format = formatFlagIndex !== -1
  ? args[formatFlagIndex + 1]
  : config.format;

const variables = new Map<string, number>();
if (config.variables) {
  for (const [k, v] of Object.entries(config.variables)) {
    variables.set(k, v);
  }
}

// Remove flag arguments from expression args
const exprArgs = args.filter((_, i) => {
  if (i === precisionFlagIndex || i === precisionFlagIndex + 1) return false;
  if (i === formatFlagIndex || i === formatFlagIndex + 1) return false;
  return true;
});

function formatResult(value: number): string {
  const rounded = precision != null ? parseFloat(value.toFixed(precision)) : value;
  if (format === "json") {
    return JSON.stringify({ result: rounded });
  }
  return String(rounded);
}

const historyFlagIndex = exprArgs.indexOf("--history");

if (historyFlagIndex !== -1) {
  const n = parseInt(exprArgs[historyFlagIndex + 1], 10) || 10;
  const history = new ExpressionHistory();
  const entries = history.getHistory().slice(-n);
  for (const entry of entries) {
    console.log(`${entry.expr} = ${entry.result}  (${entry.timestamp})`);
  }
} else {
  const expr = exprArgs.join(" ");
  if (!expr) {
    startRepl(variables);
  } else {
    try {
      const tokens = tokenize(expr);
      const result = evaluate(tokens, variables);
      console.log(formatResult(result));
      const history = new ExpressionHistory();
      history.record(expr, result);
    } catch (err) {
      console.error(`Error: ${(err as Error).message}`);
      process.exit(1);
    }
  }
}
