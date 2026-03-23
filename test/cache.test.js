import { describe, it } from "node:test";
import assert from "node:assert";
import { execFileSync } from "node:child_process";
import { LRUCache } from "../dist/cache.js";

describe("LRUCache", () => {
  it("stores and retrieves values", () => {
    const cache = new LRUCache(10);
    cache.set("a", 1);
    assert.strictEqual(cache.get("a"), 1);
  });

  it("returns undefined for missing keys", () => {
    const cache = new LRUCache(10);
    assert.strictEqual(cache.get("missing"), undefined);
  });

  it("tracks cache hits", () => {
    const cache = new LRUCache(10);
    cache.set("a", 1);
    cache.get("a");
    cache.get("a");
    const s = cache.stats();
    assert.strictEqual(s.hits, 2);
    assert.strictEqual(s.misses, 0);
  });

  it("tracks cache misses", () => {
    const cache = new LRUCache(10);
    cache.get("x");
    cache.get("y");
    const s = cache.stats();
    assert.strictEqual(s.hits, 0);
    assert.strictEqual(s.misses, 2);
  });

  it("reports correct hit rate", () => {
    const cache = new LRUCache(10);
    cache.set("a", 1);
    cache.get("a"); // hit
    cache.get("b"); // miss
    const s = cache.stats();
    assert.strictEqual(s.hitRate, 0.5);
  });

  it("reports zero hit rate when empty", () => {
    const cache = new LRUCache(10);
    assert.strictEqual(cache.stats().hitRate, 0);
  });

  it("has() returns true for existing keys", () => {
    const cache = new LRUCache(10);
    cache.set("a", 1);
    assert.strictEqual(cache.has("a"), true);
    assert.strictEqual(cache.has("b"), false);
  });

  it("evicts least recently used when full", () => {
    const cache = new LRUCache(3);
    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("c", 3);
    cache.set("d", 4); // should evict "a"
    assert.strictEqual(cache.has("a"), false);
    assert.strictEqual(cache.get("b"), 2);
    assert.strictEqual(cache.get("c"), 3);
    assert.strictEqual(cache.get("d"), 4);
  });

  it("accessing a key makes it recently used", () => {
    const cache = new LRUCache(3);
    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("c", 3);
    cache.get("a"); // touch "a", making "b" the LRU
    cache.set("d", 4); // should evict "b"
    assert.strictEqual(cache.has("b"), false);
    assert.strictEqual(cache.has("a"), true);
  });

  it("clear resets cache and stats", () => {
    const cache = new LRUCache(10);
    cache.set("a", 1);
    cache.get("a");
    cache.clear();
    const s = cache.stats();
    assert.strictEqual(s.size, 0);
    assert.strictEqual(s.hits, 0);
    assert.strictEqual(s.misses, 0);
  });

  it("stats reports correct size and maxSize", () => {
    const cache = new LRUCache(100);
    cache.set("a", 1);
    cache.set("b", 2);
    const s = cache.stats();
    assert.strictEqual(s.size, 2);
    assert.strictEqual(s.maxSize, 100);
  });

  it("updating existing key does not increase size", () => {
    const cache = new LRUCache(3);
    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("a", 10);
    assert.strictEqual(cache.stats().size, 2);
    assert.strictEqual(cache.get("a"), 10);
  });
});

describe("CLI cache flags", () => {
  it("--cache-stats prints cache statistics", () => {
    const output = execFileSync("node", ["dist/index.js", "--cache-stats"], { encoding: "utf-8" });
    assert.ok(output.includes("Cache hits:"));
    assert.ok(output.includes("Cache misses:"));
    assert.ok(output.includes("Hit rate:"));
    assert.ok(output.includes("Size:"));
  });

  it("--no-cache --cache-stats reports disabled", () => {
    const output = execFileSync("node", ["dist/index.js", "--no-cache", "--cache-stats"], { encoding: "utf-8" });
    assert.ok(output.includes("Cache is disabled"));
  });

  it("--no-cache still evaluates expressions correctly", () => {
    const output = execFileSync("node", ["dist/index.js", "--no-cache", "2", "+", "3"], { encoding: "utf-8" }).trim();
    assert.strictEqual(output, "5");
  });
});
