import { describe, it } from "node:test";
import assert from "node:assert";
import { tokenize } from "../dist/tokenizer.js";
import { evaluate } from "../dist/evaluator.js";
import { PluginRegistry } from "../dist/plugins.js";
import { mathPlugin } from "../dist/plugins/math.js";

const registry = new PluginRegistry();
registry.register(mathPlugin);

function calc(expr) {
  return evaluate(tokenize(expr), registry);
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

  // Multi-arg functions
  it("min of two numbers", () => assert.strictEqual(calc("min(3, 7)"), 3));
  it("max of two numbers", () => assert.strictEqual(calc("max(3, 7)"), 7));
  it("min with expressions", () => assert.strictEqual(calc("min(2 + 1, 5 - 1)"), 3));
  it("max with expressions", () => assert.strictEqual(calc("max(2 * 3, 10 / 2)"), 6));

  // Constants
  it("PI constant", () => assert.strictEqual(calc("PI()"), Math.PI));
  it("E constant", () => assert.strictEqual(calc("E()"), Math.E));
  it("PI in expression", () => assert.ok(Math.abs(calc("PI() * 2") - Math.PI * 2) < 1e-10));

  // Trig functions
  it("sin(0)", () => assert.strictEqual(calc("sin(0)"), 0));
  it("cos(0)", () => assert.strictEqual(calc("cos(0)"), 1));
  it("tan(0)", () => assert.strictEqual(calc("tan(0)"), 0));
  it("sin of PI", () => assert.ok(Math.abs(calc("sin(PI())")) < 1e-10));

  // Other math functions
  it("floor", () => assert.strictEqual(calc("floor(3.7)"), 3));
  it("ceil", () => assert.strictEqual(calc("ceil(3.2)"), 4));
  it("log", () => assert.strictEqual(calc("log(1)"), 0));
  it("exp", () => assert.strictEqual(calc("exp(0)"), 1));
});
