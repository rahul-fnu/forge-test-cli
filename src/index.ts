#!/usr/bin/env node
import { evaluate } from "./evaluator.js";
import { tokenize } from "./tokenizer.js";
import { startRepl } from "./repl.js";
import { ExpressionHistory } from "./history.js";
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

const historyFlagIndex = args.indexOf("--history");

if (historyFlagIndex !== -1) {
  const n = parseInt(args[historyFlagIndex + 1], 10) || 10;
  const history = new ExpressionHistory();
  const entries = history.getHistory().slice(-n);
  for (const entry of entries) {
    console.log(`${entry.expr} = ${entry.result}  (${entry.timestamp})`);
  }
} else {
  const expr = args.join(" ");
  if (!expr) {
    startRepl();
  } else {
    try {
      const tokens = tokenize(expr);
      const result = evaluate(tokens);
      console.log(result);
      const history = new ExpressionHistory();
      history.record(expr, result);
    } catch (err) {
      console.error(`Error: ${(err as Error).message}`);
      process.exit(1);
    }
  }
}
