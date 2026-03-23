export type Token =
  | { type: "number"; value: number }
  | { type: "op"; value: "+" | "-" | "*" | "/" | "," }
  | { type: "paren"; value: "(" | ")" }
  | { type: "func"; value: string };

export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < input.length) {
    if (/\s/.test(input[i])) { i++; continue; }

    if (/\d/.test(input[i]) || (input[i] === "." && /\d/.test(input[i + 1]))) {
      let num = "";
      while (i < input.length && (/\d/.test(input[i]) || input[i] === ".")) {
        num += input[i++];
      }
      tokens.push({ type: "number", value: parseFloat(num) });
      continue;
    }

    if ("+-*/,".includes(input[i])) {
      tokens.push({ type: "op", value: input[i] as "+" | "-" | "*" | "/" | "," });
      i++;
      continue;
    }

    if (/[a-zA-Z]/.test(input[i])) {
      let name = "";
      while (i < input.length && /[a-zA-Z]/.test(input[i])) {
        name += input[i++];
      }
      tokens.push({ type: "func", value: name });
      continue;
    }

    if ("()".includes(input[i])) {
      tokens.push({ type: "paren", value: input[i] as "(" | ")" });
      i++;
      continue;
    }

    throw new Error(`Unexpected character: ${input[i]}`);
  }

  return tokens;
}
