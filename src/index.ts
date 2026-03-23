#!/usr/bin/env node
import { evaluate } from "./evaluator.js";
import { tokenize } from "./tokenizer.js";
import { startRepl } from "./repl.js";

const expr = process.argv.slice(2).join(" ");
if (!expr) {
  startRepl();
} else {
  try {
    const tokens = tokenize(expr);
    const result = evaluate(tokens);
    console.log(result);
  } catch (err) {
    console.error(`Error: ${(err as Error).message}`);
    process.exit(1);
  }
}
