import { describe, it } from "node:test";
import assert from "node:assert";
import { tokenize } from "../dist/tokenizer.js";
import { evaluate } from "../dist/evaluator.js";

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
