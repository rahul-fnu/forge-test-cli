#!/usr/bin/env node
import { evaluate } from "./evaluator.js";
import { tokenize } from "./tokenizer.js";

const args = process.argv.slice(2);
let precision: number | undefined;

if (args[0] === "--precision" && args.length >= 2) {
  precision = parseInt(args[1], 10);
  if (isNaN(precision) || precision < 0) {
    console.error("Error: --precision must be a non-negative integer");
    process.exit(1);
  }
  args.splice(0, 2);
}

const expr = args.join(" ");
if (!expr) {
  console.log("Usage: calc [--precision N] <expression>");
  console.log("Examples: calc 2 + 3, calc --precision 2 \"10 / 3\"");
  process.exit(1);
}

try {
  const tokens = tokenize(expr);
  const result = evaluate(tokens);
  if (precision !== undefined) {
    console.log(result.toFixed(precision));
  } else {
    console.log(result);
  }
} catch (err) {
  console.error(`Error: ${(err as Error).message}`);
  process.exit(1);
}
