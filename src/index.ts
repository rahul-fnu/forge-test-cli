#!/usr/bin/env node
import { evaluate } from "./evaluator.js";
import { tokenize } from "./tokenizer.js";
import { startRepl } from "./repl.js";
import { ExpressionHistory } from "./history.js";
import { formatResult } from "./formatter.js";
import { readFileSync, writeFileSync } from "node:fs";
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
  -f FILE             Read expressions from file (one per line)
  -o FILE             Write results to output file (use with -f)

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

  const fileIndex = args.indexOf("-f");
  const outIndex = args.indexOf("-o");

  if (fileIndex !== -1) {
    const inputFile = args[fileIndex + 1];
    args.splice(fileIndex, 2);
    const outputFile = outIndex !== -1 ? (() => {
      const idx = args.indexOf("-o");
      const file = args[idx + 1];
      args.splice(idx, 2);
      return file;
    })() : undefined;

    const lines = readFileSync(inputFile, "utf-8").split("\n");
    const results: string[] = [];
    let hasError = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const tokens = tokenize(trimmed);
        const result = evaluate(tokens);
        results.push(formatResult(trimmed, result, format));
      } catch (err) {
        results.push(`Error: ${(err as Error).message}`);
        hasError = true;
      }
    }

    const output = results.join("\n") + "\n";
    if (outputFile) {
      writeFileSync(outputFile, output, "utf-8");
    } else {
      process.stdout.write(output);
    }

    if (hasError) process.exit(1);
  } else {
    if (outIndex !== -1) {
      args.splice(outIndex, 2);
    }

    const expr = args.join(" ");
    if (!expr) {
      startRepl();
    } else {
      try {
        const tokens = tokenize(expr);
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
}
