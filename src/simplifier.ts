import { Token } from "./tokenizer.js";

type ASTNode =
  | { type: "number"; value: number }
  | { type: "binop"; op: string; left: ASTNode; right: ASTNode }
  | { type: "unary"; op: string; operand: ASTNode }
  | { type: "func"; name: string; arg: ASTNode }
  | { type: "var"; name: string };

function parseAST(tokens: Token[]): ASTNode {
  let pos = 0;
  function peek(): Token | undefined { return tokens[pos]; }
  function advance(): Token { return tokens[pos++]; }

  function parseExpression(): ASTNode {
    let left = parseTerm();
    while (peek()?.type === "op" && (peek()?.value === "+" || peek()?.value === "-")) {
      const op = advance().value as string;
      const right = parseTerm();
      left = { type: "binop", op, left, right };
    }
    return left;
  }

  function parseTerm(): ASTNode {
    let left = parseFactor();
    while (peek()?.type === "op" && (peek()?.value === "*" || peek()?.value === "/")) {
      const op = advance().value as string;
      const right = parseFactor();
      left = { type: "binop", op, left, right };
    }
    return left;
  }

  function parseFactor(): ASTNode {
    const token = peek();
    if (!token) throw new Error("Unexpected end of expression");

    if (token.type === "op" && token.value === "-") {
      advance();
      return { type: "unary", op: "-", operand: parseFactor() };
    }

    if (token.type === "func") {
      const name = token.value as string;
      advance();
      if (peek()?.type !== "paren" || peek()?.value !== "(") {
        return { type: "var", name };
      }
      advance();
      const arg = parseExpression();
      if (peek()?.type !== "paren" || peek()?.value !== ")") {
        throw new Error("Missing closing parenthesis");
      }
      advance();
      return { type: "func", name, arg };
    }

    if (token.type === "number") {
      advance();
      return { type: "number", value: token.value };
    }

    if (token.type === "paren" && token.value === "(") {
      advance();
      const node = parseExpression();
      if (peek()?.type !== "paren" || peek()?.value !== ")") {
        throw new Error("Missing closing parenthesis");
      }
      advance();
      return node;
    }

    throw new Error(`Unexpected token: ${JSON.stringify(token)}`);
  }

  return parseExpression();
}

function isNum(node: ASTNode, value?: number): node is { type: "number"; value: number } {
  if (node.type !== "number") return false;
  if (value !== undefined) return node.value === value;
  return true;
}

function simplifyPass(node: ASTNode): { node: ASTNode; changed: boolean } {
  if (node.type === "binop") {
    const lr = simplifyPass(node.left);
    const rr = simplifyPass(node.right);
    const left = lr.node;
    const right = rr.node;
    const childChanged = lr.changed || rr.changed;

    if (childChanged) {
      return { node: { type: "binop", op: node.op, left, right }, changed: true };
    }

    if (node.op === "+" && isNum(right, 0)) return { node: left, changed: true };
    if (node.op === "+" && isNum(left, 0)) return { node: right, changed: true };
    if (node.op === "-" && isNum(right, 0)) return { node: left, changed: true };
    if (node.op === "*" && isNum(right, 1)) return { node: left, changed: true };
    if (node.op === "*" && isNum(left, 1)) return { node: right, changed: true };
    if (node.op === "*" && (isNum(right, 0) || isNum(left, 0))) {
      return { node: { type: "number", value: 0 }, changed: true };
    }
    if (node.op === "/" && isNum(right, 1)) return { node: left, changed: true };

    if (isNum(left) && isNum(right)) {
      switch (node.op) {
        case "+": return { node: { type: "number", value: left.value + right.value }, changed: true };
        case "-": return { node: { type: "number", value: left.value - right.value }, changed: true };
        case "*": return { node: { type: "number", value: left.value * right.value }, changed: true };
        case "/":
          if (right.value !== 0) {
            return { node: { type: "number", value: left.value / right.value }, changed: true };
          }
          break;
      }
    }

    return { node: { type: "binop", op: node.op, left, right }, changed: false };
  }

  if (node.type === "unary") {
    const r = simplifyPass(node.operand);
    if (isNum(r.node)) {
      return { node: { type: "number", value: -r.node.value }, changed: true };
    }
    return { node: { type: "unary", op: node.op, operand: r.node }, changed: r.changed };
  }

  if (node.type === "func") {
    const r = simplifyPass(node.arg);
    return { node: { type: "func", name: node.name, arg: r.node }, changed: r.changed };
  }

  return { node, changed: false };
}

function astToString(node: ASTNode): string {
  switch (node.type) {
    case "number":
      return node.value < 0 ? `(${node.value})` : String(node.value);
    case "var":
      return node.name;
    case "unary":
      return `-${astToString(node.operand)}`;
    case "func":
      return `${node.name}(${astToString(node.arg)})`;
    case "binop": {
      const l = astToString(node.left);
      const r = astToString(node.right);
      return `${l}${node.op}${r}`;
    }
  }
}

function astToTokens(node: ASTNode): Token[] {
  switch (node.type) {
    case "number":
      return [{ type: "number", value: node.value }];
    case "var":
      return [{ type: "func", value: node.name }];
    case "unary":
      return [
        { type: "op", value: "-" } as Token,
        ...astToTokens(node.operand),
      ];
    case "func":
      return [
        { type: "func", value: node.name },
        { type: "paren", value: "(" },
        ...astToTokens(node.arg),
        { type: "paren", value: ")" },
      ];
    case "binop":
      return [
        ...astToTokens(node.left),
        { type: "op", value: node.op } as Token,
        ...astToTokens(node.right),
      ];
  }
}

export function simplify(tokens: Token[]): Token[] {
  let ast = parseAST(tokens);
  let changed = true;
  while (changed) {
    const result = simplifyPass(ast);
    ast = result.node;
    changed = result.changed;
  }
  return astToTokens(ast);
}

export function showSteps(tokens: Token[]): string[] {
  let ast = parseAST(tokens);
  const steps: string[] = [astToString(ast)];
  let changed = true;
  while (changed) {
    const result = simplifyPass(ast);
    ast = result.node;
    changed = result.changed;
    if (changed) {
      steps.push(astToString(ast));
    }
  }
  return steps;
}
