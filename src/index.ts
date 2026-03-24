#!/usr/bin/env node
import { evaluate } from "./evaluator.js";
import { tokenize } from "./tokenizer.js";
import { startRepl } from "./repl.js";
import { ExpressionHistory } from "./history.js";
import { formatResult } from "./formatter.js";
import { MacroExpander } from "./macros.js";
import { loadConfig } from "./config.js";
import { green, red, setColorsEnabled } from "./colors.js";
import { profileExpression, benchmarkExpression } from "./profiler.js";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const args = process.argv.slice(2);

// Determine color mode
const noColorFlag = args.includes("--no-color");
const colorFlag = args.includes("--color");
if (noColorFlag) {
  args.splice(args.indexOf("--no-color"), 1);
  setColorsEnabled(false);
} else if (colorFlag) {
  args.splice(args.indexOf("--color"), 1);
  setColorsEnabled(true);
} else if (process.env.NO_COLOR !== undefined || !process.stdout.isTTY) {
  setColorsEnabled(false);
}

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
  --batch FILE        Run batch mode with summary report
  -o FILE             Write results to output file (use with -f or --batch)
  --benchmark EXPR    Benchmark expression (1000 iterations)
  --profile EXPR      Profile expression with time breakdown
  --color             Force colored output
  --no-color          Disable colored output

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
} else if (args.includes("--benchmark")) {
  const benchIndex = args.indexOf("--benchmark");
  const expr = args[benchIndex + 1];
  args.splice(benchIndex, 2);

  const formatIndex = args.indexOf("--format");
  let format = "plain" as "plain" | "json" | "table" | "csv";
  if (formatIndex !== -1) {
    format = (args[formatIndex + 1] || "plain") as "plain" | "json" | "table" | "csv";
    args.splice(formatIndex, 2);
  }

  const result = benchmarkExpression(expr);

  if (format === "json") {
    console.log(JSON.stringify({
      expression: expr,
      iterations: result.iterations,
      average: result.average,
      min: result.min,
      max: result.max,
      median: result.median,
      opsPerSecond: result.opsPerSecond,
    }));
  } else if (format === "csv") {
    console.log("metric,value");
    console.log(`average,${result.average.toFixed(2)}`);
    console.log(`min,${result.min.toFixed(2)}`);
    console.log(`max,${result.max.toFixed(2)}`);
    console.log(`median,${result.median.toFixed(2)}`);
    console.log(`ops/sec,${result.opsPerSecond.toFixed(2)}`);
  } else if (format === "table") {
    const rows = [
      ["Metric", "Value"],
      ["Iterations", String(result.iterations)],
      ["Average (μs)", result.average.toFixed(2)],
      ["Min (μs)", result.min.toFixed(2)],
      ["Max (μs)", result.max.toFixed(2)],
      ["Median (μs)", result.median.toFixed(2)],
      ["Ops/sec", result.opsPerSecond.toFixed(2)],
    ];
    const col0 = Math.max(...rows.map((r) => r[0].length));
    const col1 = Math.max(...rows.map((r) => r[1].length));
    const sep = `+-${"-".repeat(col0)}-+-${"-".repeat(col1)}-+`;
    console.log(sep);
    for (const [label, val] of rows) {
      console.log(`| ${label.padEnd(col0)} | ${val.padEnd(col1)} |`);
      if (label === "Metric") console.log(sep);
    }
    console.log(sep);
  } else {
    console.log(`Benchmark: ${expr}`);
    console.log(`Iterations: ${result.iterations}`);
    console.log(`Average: ${result.average.toFixed(2)} μs`);
    console.log(`Min: ${result.min.toFixed(2)} μs`);
    console.log(`Max: ${result.max.toFixed(2)} μs`);
    console.log(`Median: ${result.median.toFixed(2)} μs`);
    console.log(`Ops/sec: ${result.opsPerSecond.toFixed(2)}`);
  }
} else if (args.includes("--profile")) {
  const profIndex = args.indexOf("--profile");
  const expr = args[profIndex + 1];
  args.splice(profIndex, 2);

  const formatIndex = args.indexOf("--format");
  let format = "plain" as "plain" | "json" | "table" | "csv";
  if (formatIndex !== -1) {
    format = (args[formatIndex + 1] || "plain") as "plain" | "json" | "table" | "csv";
    args.splice(formatIndex, 2);
  }

  const { result, profile } = profileExpression(expr);

  if (format === "json") {
    console.log(JSON.stringify({
      expression: expr,
      result,
      tokenizeTime: profile.tokenizeTime,
      simplifyTime: profile.simplifyTime,
      evaluateTime: profile.evaluateTime,
      totalTime: profile.totalTime,
    }));
  } else if (format === "csv") {
    console.log("phase,time_us");
    console.log(`tokenize,${profile.tokenizeTime.toFixed(2)}`);
    console.log(`simplify,${profile.simplifyTime.toFixed(2)}`);
    console.log(`evaluate,${profile.evaluateTime.toFixed(2)}`);
    console.log(`total,${profile.totalTime.toFixed(2)}`);
  } else if (format === "table") {
    const rows = [
      ["Phase", "Time (μs)"],
      ["Tokenize", profile.tokenizeTime.toFixed(2)],
      ["Simplify", profile.simplifyTime.toFixed(2)],
      ["Evaluate", profile.evaluateTime.toFixed(2)],
      ["Total", profile.totalTime.toFixed(2)],
    ];
    const col0 = Math.max(...rows.map((r) => r[0].length));
    const col1 = Math.max(...rows.map((r) => r[1].length));
    const sep = `+-${"-".repeat(col0)}-+-${"-".repeat(col1)}-+`;
    console.log(sep);
    for (const [label, val] of rows) {
      console.log(`| ${label.padEnd(col0)} | ${val.padEnd(col1)} |`);
      if (label === "Phase") console.log(sep);
    }
    console.log(sep);
  } else {
    console.log(`Profile: ${expr} = ${result}`);
    console.log(`Tokenize: ${profile.tokenizeTime.toFixed(2)} μs`);
    console.log(`Simplify: ${profile.simplifyTime.toFixed(2)} μs`);
    console.log(`Evaluate: ${profile.evaluateTime.toFixed(2)} μs`);
    console.log(`Total: ${profile.totalTime.toFixed(2)} μs`);
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
      output.push(green(formatResult(trimmed, result, format)));
      successful++;
      values.push(result);
    } catch (err) {
      output.push(red(`Error: ${(err as Error).message}`));
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
        results.push(green(formatResult(trimmed, result, format)));
      } catch (err) {
        results.push(red(`Error: ${(err as Error).message}`));
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
        console.log(green(formatResult(expr, result, format)));
        const history = new ExpressionHistory();
        history.record(expr, result);
      } catch (err) {
        console.error(red(`Error: ${(err as Error).message}`));
        process.exit(1);
      }
    }
  }
}
