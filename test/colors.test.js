import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import { execFileSync } from "node:child_process";
import { green, red, yellow, bold, setColorsEnabled, isColorsEnabled } from "../dist/colors.js";

describe("Color functions", () => {
  beforeEach(() => {
    setColorsEnabled(true);
  });

  it("green wraps text with ANSI green code", () => {
    assert.strictEqual(green("hello"), "\x1b[32mhello\x1b[0m");
  });

  it("red wraps text with ANSI red code", () => {
    assert.strictEqual(red("error"), "\x1b[31merror\x1b[0m");
  });

  it("yellow wraps text with ANSI yellow code", () => {
    assert.strictEqual(yellow("warn"), "\x1b[33mwarn\x1b[0m");
  });

  it("bold wraps text with ANSI bold code", () => {
    assert.strictEqual(bold("strong"), "\x1b[1mstrong\x1b[0m");
  });

  it("returns plain text when colors are disabled", () => {
    setColorsEnabled(false);
    assert.strictEqual(green("hello"), "hello");
    assert.strictEqual(red("error"), "error");
    assert.strictEqual(yellow("warn"), "warn");
    assert.strictEqual(bold("strong"), "strong");
  });

  it("isColorsEnabled reflects current state", () => {
    setColorsEnabled(true);
    assert.strictEqual(isColorsEnabled(), true);
    setColorsEnabled(false);
    assert.strictEqual(isColorsEnabled(), false);
  });
});

describe("CLI color flags", () => {
  it("--no-color flag disables colored output", () => {
    const output = execFileSync("node", ["dist/index.js", "--no-color", "2+3"], { encoding: "utf-8" }).trim();
    assert.strictEqual(output, "5");
    assert.ok(!output.includes("\x1b["));
  });

  it("--color flag enables colored output", () => {
    const output = execFileSync("node", ["dist/index.js", "--color", "2+3"], { encoding: "utf-8" }).trim();
    assert.ok(output.includes("\x1b[32m"));
    assert.ok(output.includes("5"));
  });

  it("NO_COLOR env var disables colors", () => {
    const output = execFileSync("node", ["dist/index.js", "2+3"], {
      encoding: "utf-8",
      env: { ...process.env, NO_COLOR: "1" },
    }).trim();
    assert.strictEqual(output, "5");
    assert.ok(!output.includes("\x1b["));
  });

  it("piped output (non-TTY) has no colors by default", () => {
    const output = execFileSync("node", ["dist/index.js", "2+3"], { encoding: "utf-8" }).trim();
    assert.strictEqual(output, "5");
    assert.ok(!output.includes("\x1b["));
  });

  it("--color flag overrides non-TTY detection", () => {
    const output = execFileSync("node", ["dist/index.js", "--color", "2+3"], { encoding: "utf-8" }).trim();
    assert.ok(output.includes("\x1b[32m"));
  });

  it("--no-color produces plain error output", () => {
    try {
      execFileSync("node", ["dist/index.js", "--no-color", "badexpr!!"], { encoding: "utf-8" });
      assert.fail("Should have exited with code 1");
    } catch (err) {
      assert.ok(!err.stderr.includes("\x1b["));
      assert.ok(err.stderr.includes("Error:"));
    }
  });

  it("--color produces colored error output", () => {
    try {
      execFileSync("node", ["dist/index.js", "--color", "badexpr!!"], { encoding: "utf-8" });
      assert.fail("Should have exited with code 1");
    } catch (err) {
      assert.ok(err.stderr.includes("\x1b[31m"));
    }
  });
});
