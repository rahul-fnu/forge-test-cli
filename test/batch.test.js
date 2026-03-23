import { describe, it } from "node:test";
import assert from "node:assert";
import { execFileSync } from "node:child_process";
import { writeFileSync, readFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

describe("Batch mode (--batch)", () => {
  const inputFile = join(tmpdir(), "calc-batch-input.txt");
  const outputFile = join(tmpdir(), "calc-batch-output.txt");

  function cleanup() {
    try { unlinkSync(inputFile); } catch {}
    try { unlinkSync(outputFile); } catch {}
  }

  it("runs all expressions and prints summary", () => {
    cleanup();
    writeFileSync(inputFile, "2 + 3\n10 * 4\n7 - 2\n", "utf-8");
    const output = execFileSync("node", ["dist/index.js", "--batch", inputFile], { encoding: "utf-8" });
    assert.ok(output.includes("--- Summary ---"));
    assert.ok(output.includes("Total expressions: 3"));
    assert.ok(output.includes("Successful: 3"));
    assert.ok(output.includes("Errors: 0"));
    assert.ok(output.includes("Duration:"));
    cleanup();
  });

  it("reports min/max/average in summary", () => {
    cleanup();
    writeFileSync(inputFile, "2 + 3\n10 * 4\n7 - 2\n", "utf-8");
    const output = execFileSync("node", ["dist/index.js", "--batch", inputFile], { encoding: "utf-8" });
    assert.ok(output.includes("Min: 5"));
    assert.ok(output.includes("Max: 40"));
    assert.ok(output.includes("Average: "));
    cleanup();
  });

  it("counts errors correctly", () => {
    cleanup();
    writeFileSync(inputFile, "2 + 3\nbadexpr!!\n4 * 2\n", "utf-8");
    let output;
    try {
      output = execFileSync("node", ["dist/index.js", "--batch", inputFile], { encoding: "utf-8" });
      assert.fail("Should have exited with code 1");
    } catch (err) {
      output = err.stdout;
      assert.strictEqual(err.status, 1);
    }
    assert.ok(output.includes("Total expressions: 3"));
    assert.ok(output.includes("Successful: 2"));
    assert.ok(output.includes("Errors: 1"));
    cleanup();
  });

  it("uses table format by default", () => {
    cleanup();
    writeFileSync(inputFile, "2 + 3\n", "utf-8");
    const output = execFileSync("node", ["dist/index.js", "--batch", inputFile], { encoding: "utf-8" });
    assert.ok(output.includes("Expression"));
    assert.ok(output.includes("Result"));
    assert.ok(output.includes("|"));
    cleanup();
  });

  it("respects --format flag", () => {
    cleanup();
    writeFileSync(inputFile, "2 + 3\n", "utf-8");
    const output = execFileSync("node", ["dist/index.js", "--batch", inputFile, "--format", "json"], { encoding: "utf-8" });
    const lines = output.split("\n");
    const parsed = JSON.parse(lines[0]);
    assert.strictEqual(parsed.result, 5);
    cleanup();
  });

  it("saves full report to file with -o", () => {
    cleanup();
    writeFileSync(inputFile, "2 + 3\n10 * 4\n", "utf-8");
    execFileSync("node", ["dist/index.js", "--batch", inputFile, "-o", outputFile], { encoding: "utf-8" });
    const content = readFileSync(outputFile, "utf-8");
    assert.ok(content.includes("--- Summary ---"));
    assert.ok(content.includes("Total expressions: 2"));
    assert.ok(content.includes("Successful: 2"));
    cleanup();
  });

  it("skips blank lines", () => {
    cleanup();
    writeFileSync(inputFile, "2 + 3\n\n\n4 + 1\n", "utf-8");
    const output = execFileSync("node", ["dist/index.js", "--batch", inputFile], { encoding: "utf-8" });
    assert.ok(output.includes("Total expressions: 2"));
    cleanup();
  });
});
