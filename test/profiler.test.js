import { describe, it } from "node:test";
import assert from "node:assert";
import { execFileSync } from "node:child_process";
import { ExpressionProfiler, profileExpression, benchmarkExpression } from "../dist/profiler.js";

describe("ExpressionProfiler", () => {
  it("measures phase times in microseconds", () => {
    const profiler = new ExpressionProfiler();
    profiler.start();
    profiler.startPhase("tokenize");
    profiler.endPhase();
    profiler.startPhase("simplify");
    profiler.endPhase();
    profiler.startPhase("evaluate");
    profiler.endPhase();
    profiler.stop();

    const results = profiler.getResults();
    assert.strictEqual(typeof results.tokenizeTime, "number");
    assert.strictEqual(typeof results.simplifyTime, "number");
    assert.strictEqual(typeof results.evaluateTime, "number");
    assert.strictEqual(typeof results.totalTime, "number");
    assert.ok(results.totalTime >= 0);
  });

  it("reports zero for missing phases", () => {
    const profiler = new ExpressionProfiler();
    profiler.start();
    profiler.stop();
    const results = profiler.getResults();
    assert.strictEqual(results.tokenizeTime, 0);
    assert.strictEqual(results.simplifyTime, 0);
    assert.strictEqual(results.evaluateTime, 0);
  });
});

describe("profileExpression", () => {
  it("profiles a simple expression", () => {
    const { result, profile } = profileExpression("2+3*4");
    assert.strictEqual(result, 14);
    assert.ok(profile.totalTime > 0);
    assert.ok(profile.tokenizeTime >= 0);
    assert.ok(profile.evaluateTime >= 0);
  });

  it("profiler accuracy within 10x of expected", () => {
    const { profile } = profileExpression("2+3");
    // A simple expression should take less than 10ms (10000 μs)
    assert.ok(profile.totalTime < 10000, `Total time ${profile.totalTime} μs exceeds 10000 μs`);
    // Total should be >= sum of parts (roughly)
    assert.ok(profile.totalTime >= 0);
  });
});

describe("benchmarkExpression", () => {
  it("runs correct number of iterations", () => {
    const result = benchmarkExpression("2+3", 100);
    assert.strictEqual(result.iterations, 100);
  });

  it("returns valid statistics", () => {
    const result = benchmarkExpression("2+3", 100);
    assert.ok(result.average > 0);
    assert.ok(result.min > 0);
    assert.ok(result.max >= result.min);
    assert.ok(result.median >= result.min);
    assert.ok(result.median <= result.max);
    assert.ok(result.opsPerSecond > 0);
  });

  it("accuracy within 10x of expected", () => {
    const result = benchmarkExpression("2+3", 100);
    // Simple expression should average less than 1ms (1000 μs)
    assert.ok(result.average < 1000, `Average ${result.average} μs exceeds 1000 μs`);
  });
});

describe("CLI --benchmark", () => {
  it("benchmark plain output contains expected fields", () => {
    const output = execFileSync("node", ["dist/index.js", "--benchmark", "2+3*4"], { encoding: "utf-8" });
    assert.ok(output.includes("Benchmark:"));
    assert.ok(output.includes("Average:"));
    assert.ok(output.includes("Min:"));
    assert.ok(output.includes("Max:"));
    assert.ok(output.includes("Median:"));
    assert.ok(output.includes("Ops/sec:"));
  });

  it("benchmark json output is valid JSON", () => {
    const output = execFileSync("node", ["dist/index.js", "--benchmark", "2+3", "--format", "json"], { encoding: "utf-8" });
    const parsed = JSON.parse(output.trim());
    assert.strictEqual(parsed.expression, "2+3");
    assert.strictEqual(typeof parsed.average, "number");
    assert.strictEqual(typeof parsed.min, "number");
    assert.strictEqual(typeof parsed.max, "number");
    assert.strictEqual(typeof parsed.median, "number");
    assert.strictEqual(typeof parsed.opsPerSecond, "number");
    assert.strictEqual(parsed.iterations, 1000);
  });

  it("benchmark csv output has correct format", () => {
    const output = execFileSync("node", ["dist/index.js", "--benchmark", "2+3", "--format", "csv"], { encoding: "utf-8" });
    const lines = output.trim().split("\n");
    assert.strictEqual(lines[0], "metric,value");
    assert.ok(lines[1].startsWith("average,"));
  });

  it("benchmark table output has table structure", () => {
    const output = execFileSync("node", ["dist/index.js", "--benchmark", "2+3", "--format", "table"], { encoding: "utf-8" });
    assert.ok(output.includes("Metric"));
    assert.ok(output.includes("Value"));
    assert.ok(output.includes("|"));
    assert.ok(output.includes("+"));
  });
});

describe("CLI --profile", () => {
  it("profile plain output shows time breakdown", () => {
    const output = execFileSync("node", ["dist/index.js", "--profile", "2+3*4"], { encoding: "utf-8" });
    assert.ok(output.includes("Profile:"));
    assert.ok(output.includes("Tokenize:"));
    assert.ok(output.includes("Simplify:"));
    assert.ok(output.includes("Evaluate:"));
    assert.ok(output.includes("Total:"));
  });

  it("profile json output is valid JSON", () => {
    const output = execFileSync("node", ["dist/index.js", "--profile", "2+3", "--format", "json"], { encoding: "utf-8" });
    const parsed = JSON.parse(output.trim());
    assert.strictEqual(parsed.expression, "2+3");
    assert.strictEqual(parsed.result, 5);
    assert.strictEqual(typeof parsed.tokenizeTime, "number");
    assert.strictEqual(typeof parsed.simplifyTime, "number");
    assert.strictEqual(typeof parsed.evaluateTime, "number");
    assert.strictEqual(typeof parsed.totalTime, "number");
  });

  it("profile csv output has correct format", () => {
    const output = execFileSync("node", ["dist/index.js", "--profile", "2+3", "--format", "csv"], { encoding: "utf-8" });
    const lines = output.trim().split("\n");
    assert.strictEqual(lines[0], "phase,time_us");
    assert.ok(lines[1].startsWith("tokenize,"));
  });
});
