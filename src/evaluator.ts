import { Token } from "./tokenizer.js";

const CONSTANTS: Record<string, number> = {
  PI: Math.PI,
  E: Math.E,
};

/**
 * Simple recursive descent parser/evaluator.
 * Supports +, -, *, / with standard precedence and parentheses.
 */
export function evaluate(tokens: Token[], variables?: Map<string, number>): number {
  let pos = 0;

  function peek(): Token | undefined { return tokens[pos]; }
  function advance(): Token { return tokens[pos++]; }

  function parseExpression(): number {
    let left = parseTerm();
    while (peek()?.type === "op" && (peek()?.value === "+" || peek()?.value === "-")) {
      const op = advance().value;
      const right = parseTerm();
      left = op === "+" ? left + right : left - right;
    }
    return left;
  }

  function parseTerm(): number {
    let left = parseFactor();
    while (peek()?.type === "op" && (peek()?.value === "*" || peek()?.value === "/")) {
      const op = advance().value;
      const right = parseFactor();
      if (op === "/" && right === 0) throw new Error("Division by zero");
      left = op === "*" ? left * right : left / right;
    }
    return left;
  }

  function parseFactor(): number {
    const token = peek();
    if (!token) throw new Error("Unexpected end of expression");

    if (token.type === "op" && token.value === "-") {
      advance();
      return -parseFactor();
    }

    if (token.type === "func") {
      const name = token.value as string;
      advance();
      if (peek()?.type !== "paren" || peek()?.value !== "(") {
        if (name in CONSTANTS) {
          return CONSTANTS[name];
        }
        if (variables && variables.has(name)) {
          return variables.get(name)!;
        }
        throw new Error(`Unknown variable: ${name}`);
      }
      advance();
      const arg = parseExpression();
      if (peek()?.type !== "paren" || peek()?.value !== ")") {
        throw new Error("Missing closing parenthesis");
      }
      advance();
      switch (name) {
        case "abs": return Math.abs(arg);
        case "sqrt": return Math.sqrt(arg);
        case "round": return Math.round(arg);
        default: throw new Error(`Unknown function: ${name}`);
      }
    }

    if (token.type === "number") {
      advance();
      return token.value;
    }

    if (token.type === "paren" && token.value === "(") {
      advance();
      const result = parseExpression();
      if (peek()?.type !== "paren" || peek()?.value !== ")") {
        throw new Error("Missing closing parenthesis");
      }
      advance();
      return result;
    }

    throw new Error(`Unexpected token: ${JSON.stringify(token)}`);
  }

  const result = parseExpression();
  if (pos < tokens.length) {
    throw new Error(`Unexpected token after expression: ${JSON.stringify(tokens[pos])}`);
  }
  return result;
}
