#!/usr/bin/env node
import { evaluate } from "./evaluator.js";
import { tokenize } from "./tokenizer.js";
import { startRepl } from "./repl.js";
import { ExpressionHistory } from "./history.js";

const args = process.argv.slice(2);
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
