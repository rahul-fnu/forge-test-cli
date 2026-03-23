import { describe, it } from "node:test";
import assert from "node:assert";
import { MacroExpander } from "../dist/macros.js";
import { tokenize } from "../dist/tokenizer.js";
import { evaluate } from "../dist/evaluator.js";

function calcWithMacros(expr, macroExpander) {
  const expanded = macroExpander.expandExpression(expr);
  return evaluate(tokenize(expanded));
}

describe("MacroExpander", () => {
  it("registers and expands a macro", () => {
    const expander = new MacroExpander();
    expander.register("double", "x * 2");
    const result = expander.expand("double", ["5"]);
    assert.strictEqual(result, "5 * 2");
  });

  it("expands macro with multiple parameters", () => {
    const expander = new MacroExpander();
    expander.register("circle_area", "PI * r * r");
    const result = expander.expand("circle_area", ["3"]);
    assert.strictEqual(result, "PI * 3 * 3");
  });

  it("evaluates double(5) to 10", () => {
    const expander = new MacroExpander();
    expander.register("double", "x * 2");
    const result = calcWithMacros("double(5)", expander);
    assert.strictEqual(result, 10);
  });

  it("evaluates circle_area(3) using PI", () => {
    const expander = new MacroExpander();
    expander.register("circle_area", "PI * r * r");
    const result = calcWithMacros("circle_area(3)", expander);
    assert.ok(Math.abs(result - Math.PI * 9) < 0.0001);
  });

  it("expands nested macros", () => {
    const expander = new MacroExpander();
    expander.register("double", "x * 2");
    expander.register("quadruple", "double(x) * 2");
    const result = calcWithMacros("quadruple(3)", expander);
    assert.strictEqual(result, 12);
  });

  it("throws on unknown macro", () => {
    const expander = new MacroExpander();
    assert.throws(() => expander.expand("nonexistent", ["1"]), /Unknown macro/);
  });

  it("expandExpression leaves non-macro functions unchanged", () => {
    const expander = new MacroExpander();
    expander.register("double", "x * 2");
    const result = calcWithMacros("abs(-5)", expander);
    assert.strictEqual(result, 5);
  });

  it("macro in larger expression", () => {
    const expander = new MacroExpander();
    expander.register("double", "x * 2");
    const result = calcWithMacros("1 + double(5)", expander);
    assert.strictEqual(result, 11);
  });
});
