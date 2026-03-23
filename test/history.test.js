import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { ExpressionHistory } from "../dist/history.js";

function tmpHistoryPath() {
  return path.join(os.tmpdir(), `calc_history_test_${Date.now()}_${Math.random().toString(36).slice(2)}.json`);
}

describe("ExpressionHistory", () => {
  let filePath;
  let history;

  beforeEach(() => {
    filePath = tmpHistoryPath();
    history = new ExpressionHistory(filePath);
  });

  afterEach(() => {
    try { fs.unlinkSync(filePath); } catch {}
  });

  it("records and retrieves entries", () => {
    history.record("2 + 3", 5);
    history.record("10 * 2", 20);
    const entries = history.getHistory();
    assert.strictEqual(entries.length, 2);
    assert.strictEqual(entries[0].expr, "2 + 3");
    assert.strictEqual(entries[0].result, 5);
    assert.strictEqual(entries[1].expr, "10 * 2");
    assert.strictEqual(entries[1].result, 20);
  });

  it("entries have timestamps", () => {
    history.record("1 + 1", 2);
    const entries = history.getHistory();
    assert.ok(entries[0].timestamp);
    assert.ok(!isNaN(Date.parse(entries[0].timestamp)));
  });

  it("getLast returns the most recent entry", () => {
    history.record("1 + 1", 2);
    history.record("3 + 4", 7);
    const last = history.getLast();
    assert.deepStrictEqual(last, { expr: "3 + 4", result: 7 });
  });

  it("getLast returns undefined when empty", () => {
    assert.strictEqual(history.getLast(), undefined);
  });

  it("clear removes all entries", () => {
    history.record("1 + 1", 2);
    history.record("2 + 2", 4);
    history.clear();
    assert.strictEqual(history.getHistory().length, 0);
    assert.strictEqual(history.getLast(), undefined);
  });

  it("persists across invocations", () => {
    history.record("5 + 5", 10);
    const history2 = new ExpressionHistory(filePath);
    const entries = history2.getHistory();
    assert.strictEqual(entries.length, 1);
    assert.strictEqual(entries[0].expr, "5 + 5");
    assert.strictEqual(entries[0].result, 10);
  });

  it("enforces limit of 100 entries", () => {
    for (let i = 0; i < 110; i++) {
      history.record(`${i} + 1`, i + 1);
    }
    const entries = history.getHistory();
    assert.strictEqual(entries.length, 100);
    assert.strictEqual(entries[0].expr, "10 + 1");
    assert.strictEqual(entries[0].result, 11);
    assert.strictEqual(entries[99].expr, "109 + 1");
    assert.strictEqual(entries[99].result, 110);
  });

  it("clear persists across invocations", () => {
    history.record("1 + 1", 2);
    history.clear();
    const history2 = new ExpressionHistory(filePath);
    assert.strictEqual(history2.getHistory().length, 0);
  });
});
