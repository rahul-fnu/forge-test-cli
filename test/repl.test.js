import { describe, it } from "node:test";
import assert from "node:assert";
import { handleCommand, hasUnmatchedParens, evaluateLine } from "../dist/repl.js";

describe("REPL commands", () => {
  it(".help returns help text", () => {
    const vars = new Map();
    const result = handleCommand(".help", vars);
    assert.ok(result.includes(".help"));
    assert.ok(result.includes(".vars"));
    assert.ok(result.includes(".exit"));
  });

  it(".vars shows no variables when empty", () => {
    const vars = new Map();
    const result = handleCommand(".vars", vars);
    assert.strictEqual(result, "No variables defined.");
  });

  it(".vars shows defined variables", () => {
    const vars = new Map([["x", 42], ["y", 7]]);
    const result = handleCommand(".vars", vars);
    assert.ok(result.includes("x = 42"));
    assert.ok(result.includes("y = 7"));
  });

  it(".clear removes all variables", () => {
    const vars = new Map([["x", 42]]);
    const result = handleCommand(".clear", vars);
    assert.strictEqual(result, "Variables cleared.");
    assert.strictEqual(vars.size, 0);
  });
});

describe("Variable persistence", () => {
  it("variables persist across evaluations", () => {
    const vars = new Map();
    evaluateLine("x = 10", vars);
    assert.strictEqual(vars.get("x"), 10);
    const result = evaluateLine("x + 5", vars);
    assert.strictEqual(result, "15");
  });

  it("variables can be overwritten", () => {
    const vars = new Map();
    evaluateLine("x = 10", vars);
    evaluateLine("x = 20", vars);
    assert.strictEqual(vars.get("x"), 20);
  });

  it("can use variables in assignment expressions", () => {
    const vars = new Map();
    evaluateLine("x = 3", vars);
    evaluateLine("y = x + 2", vars);
    assert.strictEqual(vars.get("y"), 5);
  });
});

describe("Multi-line detection", () => {
  it("detects unmatched open paren", () => {
    assert.strictEqual(hasUnmatchedParens("(1 + 2"), true);
  });

  it("matched parens are not unmatched", () => {
    assert.strictEqual(hasUnmatchedParens("(1 + 2)"), false);
  });

  it("no parens are not unmatched", () => {
    assert.strictEqual(hasUnmatchedParens("1 + 2"), false);
  });
});
