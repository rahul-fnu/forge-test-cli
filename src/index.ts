#!/usr/bin/env node
import { evaluate } from "./evaluator.js";
import { tokenize } from "./tokenizer.js";
import { startRepl } from "./repl.js";
import { addEntry } from "./history.js";
import * as readline from "node:readline";

const expr = process.argv.slice(2).join(" ");
if (expr) {
  try {
    const tokens = tokenize(expr);
    const result = evaluate(tokens);
    console.log(result);
  } catch (err) {
    console.error(`Error: ${(err as Error).message}`);
    process.exit(1);
  }
} else if (!process.stdin.isTTY) {
  const rl = readline.createInterface({ input: process.stdin });
  const lines: string[] = [];
  rl.on("line", (line) => lines.push(line));
  rl.on("close", () => {
    let hasError = false;
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const tokens = tokenize(trimmed);
        const result = evaluate(tokens);
        addEntry(trimmed, String(result));
        console.log(result);
      } catch (err) {
        hasError = true;
        addEntry(trimmed, `Error: ${(err as Error).message}`);
        console.log(`Error: ${(err as Error).message}`);
      }
    }
    if (hasError) process.exit(1);
  });
} else {
  startRepl();
}
