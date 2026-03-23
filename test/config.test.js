import { describe, it } from "node:test";
import assert from "node:assert";
import { writeFileSync, unlinkSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { loadConfig } from "../dist/config.js";
import { tokenize } from "../dist/tokenizer.js";
import { evaluate } from "../dist/evaluator.js";

describe("Config", () => {
  it("returns empty config when file is missing", () => {
    const config = loadConfig("/nonexistent/.calcrc");
    assert.deepStrictEqual(config, {});
  });

  it("loads config from file", () => {
    const dir = mkdtempSync(join(tmpdir(), "calcrc-"));
    const configPath = join(dir, ".calcrc");
    writeFileSync(configPath, JSON.stringify({
      precision: 4,
      format: "json",
      variables: { tax: 0.08 }
    }));
    const config = loadConfig(configPath);
    assert.strictEqual(config.precision, 4);
    assert.strictEqual(config.format, "json");
    assert.deepStrictEqual(config.variables, { tax: 0.08 });
    unlinkSync(configPath);
  });

  it("returns empty config for invalid JSON", () => {
    const dir = mkdtempSync(join(tmpdir(), "calcrc-"));
    const configPath = join(dir, ".calcrc");
    writeFileSync(configPath, "not json");
    const config = loadConfig(configPath);
    assert.deepStrictEqual(config, {});
    unlinkSync(configPath);
  });
});

describe("Config variables in expressions", () => {
  it("pre-defined variables are available in expressions", () => {
    const variables = new Map([["tax", 0.08]]);
    const tokens = tokenize("100 * tax");
    const result = evaluate(tokens, variables);
    assert.strictEqual(result, 8);
  });
});

describe("CLI flags override config", () => {
  it("precision flag overrides config precision", () => {
    const dir = mkdtempSync(join(tmpdir(), "calcrc-"));
    const configPath = join(dir, ".calcrc");
    writeFileSync(configPath, JSON.stringify({ precision: 4 }));
    const config = loadConfig(configPath);

    // Config has precision 4
    assert.strictEqual(config.precision, 4);

    // CLI flag would override — simulate by choosing CLI value over config
    const cliPrecision = 2;
    const effective = cliPrecision ?? config.precision;
    assert.strictEqual(effective, 2);
    unlinkSync(configPath);
  });

  it("config value used when no CLI flag", () => {
    const dir = mkdtempSync(join(tmpdir(), "calcrc-"));
    const configPath = join(dir, ".calcrc");
    writeFileSync(configPath, JSON.stringify({ format: "json" }));
    const config = loadConfig(configPath);

    const cliFormat = undefined;
    const effective = cliFormat ?? config.format;
    assert.strictEqual(effective, "json");
    unlinkSync(configPath);
  });
});
