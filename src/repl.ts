import * as readline from "node:readline";
import { tokenize } from "./tokenizer.js";
import { evaluate } from "./evaluator.js";
import { MacroExpander } from "./macros.js";

export function handleCommand(
  command: string,
  variables: Map<string, number>
): string | null {
  switch (command) {
    case ".help":
      return [
        "Commands:",
        "  .help   Show this help message",
        "  .vars   Show defined variables",
        "  .clear  Clear all variables",
        "  .exit   Exit the REPL",
      ].join("\n");
    case ".vars":
      if (variables.size === 0) return "No variables defined.";
      return [...variables.entries()]
        .map(([k, v]) => `  ${k} = ${v}`)
        .join("\n");
    case ".clear":
      variables.clear();
      return "Variables cleared.";
    case ".exit":
      return null;
    default:
      return null;
  }
}

export function hasUnmatchedParens(input: string): boolean {
  let depth = 0;
  for (const ch of input) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
  }
  return depth > 0;
}

export function evaluateLine(
  input: string,
  variables: Map<string, number>,
  macroExpander?: MacroExpander
): string {
  const expanded = macroExpander ? macroExpander.expandExpression(input) : input;
  const assignMatch = expanded.match(/^([a-zA-Z]\w*)\s*=\s*(.+)$/);
  if (assignMatch) {
    const [, name, expr] = assignMatch;
    const tokens = tokenize(expr);
    const result = evaluate(tokens, variables);
    variables.set(name, result);
    return String(result);
  }
  const tokens = tokenize(expanded);
  const result = evaluate(tokens, variables);
  return String(result);
}

export function startRepl(macroExpander?: MacroExpander): void {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "calc> ",
  });

  const variables = new Map<string, number>();
  let buffer = "";

  rl.prompt();

  rl.on("line", (line: string) => {
    const trimmed = line.trim();

    if (!buffer && trimmed.startsWith(".")) {
      if (trimmed === ".exit") {
        rl.close();
        return;
      }
      const result = handleCommand(trimmed, variables);
      if (result !== null) console.log(result);
      rl.prompt();
      return;
    }

    buffer += (buffer ? " " : "") + trimmed;

    if (hasUnmatchedParens(buffer)) {
      rl.setPrompt("... ");
      rl.prompt();
      return;
    }

    if (buffer) {
      try {
        const result = evaluateLine(buffer, variables, macroExpander);
        console.log(result);
      } catch (err) {
        console.error(`Error: ${(err as Error).message}`);
      }
    }

    buffer = "";
    rl.setPrompt("calc> ");
    rl.prompt();
  });

  rl.on("close", () => {
    console.log("Goodbye!");
  });
}
