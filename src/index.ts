#!/usr/bin/env node
import { evaluate } from "./evaluator.js";
import { tokenize } from "./tokenizer.js";

const expr = process.argv.slice(2).join(" ");
if (!expr) {
  console.log("Usage: calc <expression>");
  console.log("Examples: calc 2 + 3, calc 10 * (4 + 2)");
  process.exit(1);
}

try {
  const tokens = tokenize(expr);
  const result = evaluate(tokens);
  console.log(result);
} catch (err) {
  console.error(`Error: ${(err as Error).message}`);
  process.exit(1);
}
