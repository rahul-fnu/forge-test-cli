export function formatResult(expression: string, value: number, format: "plain" | "json" | "table" | "csv"): string {
  switch (format) {
    case "json":
      return JSON.stringify({ expression, result: value });
    case "table": {
      const exprCol = Math.max("Expression".length, expression.length);
      const resStr = String(value);
      const resCol = Math.max("Result".length, resStr.length);
      const sep = `+-${"-".repeat(exprCol)}-+-${"-".repeat(resCol)}-+`;
      return [
        sep,
        `| ${"Expression".padEnd(exprCol)} | ${"Result".padEnd(resCol)} |`,
        sep,
        `| ${expression.padEnd(exprCol)} | ${resStr.padEnd(resCol)} |`,
        sep,
      ].join("\n");
    }
    case "csv":
      return `expression,result\n${expression},${value}`;
    default:
      return String(value);
  }
}
