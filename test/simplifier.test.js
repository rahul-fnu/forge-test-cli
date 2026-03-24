import { describe, it } from "node:test";
import assert from "node:assert";
import { execFileSync } from "node:child_process";
import { tokenize } from "../dist/tokenizer.js";
import { evaluate } from "../dist/evaluator.js";
import { simplify, showSteps } from "../dist/simplifier.js";

function simplifyExpr(expr) {
  return evaluate(simplify(tokenize(expr)));
}

function stepsFor(expr) {
  return showSteps(tokenize(expr));
}

describe("Simplifier - algebraic rules", () => {
  it("x+0 -> x", () => {
    const tokens = simplify(tokenize("5+0"));
    assert.deepStrictEqual(tokens, [{ type: "number", value: 5 }]);
  });

  it("0+x -> x", () => {
    const tokens = simplify(tokenize("0+5"));
    assert.deepStrictEqual(tokens, [{ type: "number", value: 5 }]);
  });

  it("x-0 -> x", () => {
    const tokens = simplify(tokenize("5-0"));
    assert.deepStrictEqual(tokens, [{ type: "number", value: 5 }]);
  });

  it("x*1 -> x", () => {
    const tokens = simplify(tokenize("5*1"));
    assert.deepStrictEqual(tokens, [{ type: "number", value: 5 }]);
  });

  it("x*0 -> 0", () => {
    const tokens = simplify(tokenize("5*0"));
    assert.deepStrictEqual(tokens, [{ type: "number", value: 0 }]);
  });

  it("x/1 -> x", () => {
    const tokens = simplify(tokenize("5/1"));
    assert.deepStrictEqual(tokens, [{ type: "number", value: 5 }]);
  });
});

describe("Simplifier - constant folding", () => {
  it("folds 2+3 to 5", () => {
    assert.strictEqual(simplifyExpr("2+3"), 5);
  });

  it("folds 4*3 to 12", () => {
    assert.strictEqual(simplifyExpr("4*3"), 12);
  });

  it("folds nested constants", () => {
    assert.strictEqual(simplifyExpr("2+3*4"), 14);
  });

  it("preserves division by zero", () => {
    assert.strictEqual(simplifyExpr("1/0"), Infinity);
  });
});

describe("Simplifier - show steps", () => {
  it("shows steps for expression with x*0", () => {
    const steps = stepsFor("2+3*0+5");
    assert.ok(steps.length >= 2, `Expected at least 2 steps, got ${steps.length}`);
    assert.strictEqual(steps[0], "2+3*0+5");
    assert.ok(steps.some(s => s.includes("0") && !s.includes("3*0")), "Should show intermediate simplification");
  });

  it("simple constant folding shows steps", () => {
    const steps = stepsFor("2+3");
    assert.strictEqual(steps[0], "2+3");
    assert.strictEqual(steps[steps.length - 1], "5");
  });

  it("no steps needed for single number", () => {
    const steps = stepsFor("42");
    assert.deepStrictEqual(steps, ["42"]);
  });
});

describe("CLI --show-steps flag", () => {
  it("outputs simplification steps", () => {
    const output = execFileSync("node", ["dist/index.js", "--show-steps", "2+3*0+5"], {
      encoding: "utf-8",
    }).trim();
    assert.ok(output.includes("=>"), "Should contain => separator");
    assert.ok(output.startsWith("2+3*0+5"), "Should start with original expression");
    assert.ok(output.endsWith("7"), "Should end with final result");
  });
});

describe("CLI --no-simplify flag", () => {
  it("still produces correct result without simplification", () => {
    const output = execFileSync("node", ["dist/index.js", "--no-simplify", "2+3*0+5"], {
      encoding: "utf-8",
    }).trim();
    assert.strictEqual(output, "7");
  });
});
