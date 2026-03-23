#!/usr/bin/env node
import { evaluate } from "./evaluator.js";
import { tokenize } from "./tokenizer.js";
import { startRepl } from "./repl.js";
import { ExpressionHistory } from "./history.js";
import { formatResult } from "./formatter.js";
import { MacroExpander } from "./macros.js";
import { loadConfig } from "./config.js";
import { LRUCache } from "./cache.js";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const args = process.argv.slice(2);
const noCacheIndex = args.indexOf("--no-cache");
if (noCacheIndex !== -1) args.splice(noCacheIndex, 1);
const expressionCache = noCacheIndex !== -1 ? null : new LRUCache<string, number>(1000);

if (args.includes("--version")) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const pkg = JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf-8"));
  console.log(pkg.version);
  process.exit(0);
}

if (args.includes("--cache-stats")) {
  if (expressionCache) {
    const s = expressionCache.stats();
    console.log(`Cache hits: ${s.hits}`);
    console.log(`Cache misses: ${s.misses}`);
    console.log(`Hit rate: ${(s.hitRate * 100).toFixed(1)}%`);
    console.log(`Size: ${s.size}/${s.maxSize}`);
  } else {
    console.log("Cache is disabled");
  }
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
  --batch FILE        Run batch mode with summary report
  -o FILE             Write results to output file (use with -f or --batch)
  --cache-stats       Print cache statistics
  --no-cache          Disable expression caching

Examples:
  calc 2 + 3
  calc "(10 - 2) * 3"
  calc --format json "2+3"
  calc --batch input.txt
  calc --batch input.txt -o report.txt
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
} else if (args.includes("--batch")) {
  const batchIndex = args.indexOf("--batch");
  const batchFile = args[batchIndex + 1];
  args.splice(batchIndex, 2);

  const formatIndex = args.indexOf("--format");
  let format: "plain" | "json" | "table" | "csv" = "table";
  if (formatIndex !== -1) {
    format = (args[formatIndex + 1] || "table") as typeof format;
    args.splice(formatIndex, 2);
  }

  const outIndex = args.indexOf("-o");
  const outputFile = outIndex !== -1 ? (() => {
    const file = args[outIndex + 1];
    args.splice(outIndex, 2);
    return file;
  })() : undefined;

  const config = loadConfig();
  const macroExpander = new MacroExpander();
  if (config.macros) {
    for (const [name, template] of Object.entries(config.macros)) {
      macroExpander.register(name, template);
    }
  }

  const lines = readFileSync(batchFile, "utf-8").split("\n");
  const output: string[] = [];
  let successful = 0;
  let errors = 0;
  const values: number[] = [];
  const startTime = Date.now();

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const expanded = macroExpander.expandExpression(trimmed);
      const tokens = tokenize(expanded);
      const result = evaluate(tokens);
      output.push(formatResult(trimmed, result, format));
      successful++;
      values.push(result);
    } catch (err) {
      output.push(`Error: ${(err as Error).message}`);
      errors++;
    }
  }

  const duration = Date.now() - startTime;
  const total = successful + errors;

  const summaryLines: string[] = [
    "",
    "--- Summary ---",
    `Total expressions: ${total}`,
    `Successful: ${successful}`,
    `Errors: ${errors}`,
  ];

  if (values.length > 0) {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    summaryLines.push(`Min: ${min}`);
    summaryLines.push(`Max: ${max}`);
    summaryLines.push(`Average: ${avg}`);
  }

  summaryLines.push(`Duration: ${duration}ms`);

  const fullOutput = output.join("\n") + "\n" + summaryLines.join("\n") + "\n";

  if (outputFile) {
    writeFileSync(outputFile, fullOutput, "utf-8");
  } else {
    process.stdout.write(fullOutput);
  }

  if (errors > 0) process.exit(1);
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
        let result: number;
        if (expressionCache && expressionCache.has(expr)) {
          result = expressionCache.get(expr)!;
        } else {
          const tokens = tokenize(expr);
          result = evaluate(tokens);
          if (expressionCache) expressionCache.set(expr, result);
        }
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
