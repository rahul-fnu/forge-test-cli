#!/usr/bin/env node
import { evaluate } from "./evaluator.js";
import { tokenize } from "./tokenizer.js";
import { startRepl } from "./repl.js";
import { ExpressionHistory } from "./history.js";
import { formatResult } from "./formatter.js";
import { loadConfig } from "./config.js";
import { MacroExpander } from "./macros.js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const args = process.argv.slice(2);

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
  --help              Show this help message
  --version           Show version number
  --history N         Show last N history entries
  --format FORMAT     Output format: plain, json, table, csv (default: plain)

Examples:
  calc 2 + 3
  calc "(10 - 2) * 3"
  calc --format json "2+3"
  calc --version
  calc --help`);
  process.exit(0);
}

const historyFlagIndex = args.indexOf("--history");

if (historyFlagIndex !== -1) {
  const n = parseInt(args[historyFlagIndex + 1], 10) || 10;
  const history = new ExpressionHistory();
  const entries = history.getHistory().slice(-n);
  for (const entry of entries) {
    console.log(`${entry.expr} = ${entry.result}  (${entry.timestamp})`);
  }
} else {
  const formatIndex = args.indexOf("--format");
  let format: "plain" | "json" | "table" | "csv" = "plain";
  if (formatIndex !== -1) {
    format = (args[formatIndex + 1] || "plain") as typeof format;
    args.splice(formatIndex, 2);
  }

  const config = loadConfig();
  const macroExpander = new MacroExpander();
  for (const [name, template] of Object.entries(config.macros)) {
    macroExpander.register(name, template);
  }

  const expr = args.join(" ");
  if (!expr) {
    startRepl(macroExpander);
  } else {
    try {
      const expanded = macroExpander.expandExpression(expr);
      const tokens = tokenize(expanded);
      const result = evaluate(tokens);
      console.log(formatResult(expr, result, format));
      const history = new ExpressionHistory();
      history.record(expr, result);
    } catch (err) {
      console.error(`Error: ${(err as Error).message}`);
      process.exit(1);
    }
  }
}
