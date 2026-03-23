import { describe, it } from "node:test";
import assert from "node:assert";
import { execFileSync } from "node:child_process";
import { tokenize } from "../dist/tokenizer.js";
import { evaluate } from "../dist/evaluator.js";
import { formatResult } from "../dist/formatter.js";

function calc(expr) {
  return evaluate(tokenize(expr));
}

describe("Calculator", () => {
  it("adds numbers", () => assert.strictEqual(calc("2 + 3"), 5));
  it("subtracts", () => assert.strictEqual(calc("10 - 4"), 6));
  it("multiplies", () => assert.strictEqual(calc("3 * 7"), 21));
  it("divides", () => assert.strictEqual(calc("20 / 4"), 5));
  it("respects precedence", () => assert.strictEqual(calc("2 + 3 * 4"), 14));
  it("handles parentheses", () => assert.strictEqual(calc("(2 + 3) * 4"), 20));
  it("handles decimals", () => assert.strictEqual(calc("1.5 + 2.5"), 4));
  it("negates a number", () => assert.strictEqual(calc("-5"), -5));
  it("negates a parenthesized expression", () => assert.strictEqual(calc("-(2+3)"), -5));
  it("unary minus with multiplication", () => assert.strictEqual(calc("-2 * 3"), -6));
  it("throws on division by zero", () => {
    assert.throws(() => calc("5 / 0"), /Division by zero/);
  });

  it("abs of negative", () => assert.strictEqual(calc("abs(-5)"), 5));
  it("abs of positive", () => assert.strictEqual(calc("abs(3)"), 3));
  it("sqrt", () => assert.strictEqual(calc("sqrt(16)"), 4));
  it("round", () => assert.strictEqual(calc("round(3.7)"), 4));
  it("round down", () => assert.strictEqual(calc("round(3.2)"), 3));
  it("function in expression", () => assert.strictEqual(calc("1 + abs(-5) * 2"), 11));
  it("throws on unknown function", () => {
    assert.throws(() => calc("foo(1)"), /Unknown function/);
  });
});

describe("Formatter", () => {
  it("plain format returns just the number", () => {
    assert.strictEqual(formatResult("2+3", 5, "plain"), "5");
  });

  it("json format returns valid JSON", () => {
    const output = formatResult("2+3", 5, "json");
    const parsed = JSON.parse(output);
    assert.deepStrictEqual(parsed, { expression: "2+3", result: 5 });
  });

  it("table format returns ASCII table", () => {
    const output = formatResult("2+3", 5, "table");
    assert.ok(output.includes("Expression"));
    assert.ok(output.includes("Result"));
    assert.ok(output.includes("2+3"));
    assert.ok(output.includes("5"));
    assert.ok(output.includes("+"));
    assert.ok(output.includes("|"));
  });

  it("csv format returns header and data row", () => {
    const output = formatResult("2+3", 5, "csv");
    const lines = output.split("\n");
    assert.strictEqual(lines[0], "expression,result");
    assert.strictEqual(lines[1], "2+3,5");
  });
});

describe("CLI flags", () => {
  const bin = "node dist/index.js";

  it("--version prints version from package.json", () => {
    const output = execFileSync("node", ["dist/index.js", "--version"], { encoding: "utf-8" }).trim();
    assert.strictEqual(output, "1.0.0");
  });

  it("--help prints usage information", () => {
    const output = execFileSync("node", ["dist/index.js", "--help"], { encoding: "utf-8" });
    assert.ok(output.includes("Usage:"));
    assert.ok(output.includes("--help"));
    assert.ok(output.includes("--version"));
    assert.ok(output.includes("Examples:"));
  });

  it("--format json outputs JSON", () => {
    const output = execFileSync("node", ["dist/index.js", "--format", "json", "2+3"], { encoding: "utf-8" }).trim();
    const parsed = JSON.parse(output);
    assert.strictEqual(parsed.result, 5);
    assert.strictEqual(parsed.expression, "2+3");
  });

  it("--format csv outputs CSV", () => {
    const output = execFileSync("node", ["dist/index.js", "--format", "csv", "2+3"], { encoding: "utf-8" }).trim();
    const lines = output.split("\n");
    assert.strictEqual(lines[0], "expression,result");
    assert.strictEqual(lines[1], "2+3,5");
  });

  it("--format table outputs ASCII table", () => {
    const output = execFileSync("node", ["dist/index.js", "--format", "table", "2+3"], { encoding: "utf-8" });
    assert.ok(output.includes("Expression"));
    assert.ok(output.includes("Result"));
    assert.ok(output.includes("2+3"));
  });

  it("default format is plain (backward compatible)", () => {
    const output = execFileSync("node", ["dist/index.js", "2+3"], { encoding: "utf-8" }).trim();
    assert.strictEqual(output, "5");
  });
});
