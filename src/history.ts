import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

interface HistoryEntry {
  expr: string;
  result: number;
  timestamp: string;
}

const MAX_ENTRIES = 100;

export class ExpressionHistory {
  private entries: HistoryEntry[] = [];
  private filePath: string;

  constructor(filePath?: string) {
    this.filePath = filePath ?? path.join(os.homedir(), ".calc_history.json");
    this.load();
  }

  private load(): void {
    try {
      const data = fs.readFileSync(this.filePath, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        this.entries = parsed;
      }
    } catch {
      this.entries = [];
    }
  }

  private save(): void {
    fs.writeFileSync(this.filePath, JSON.stringify(this.entries, null, 2));
  }

  record(expr: string, result: number): void {
    this.entries.push({
      expr,
      result,
      timestamp: new Date().toISOString(),
    });
    if (this.entries.length > MAX_ENTRIES) {
      this.entries = this.entries.slice(this.entries.length - MAX_ENTRIES);
    }
    this.save();
  }

  getHistory(): Array<{ expr: string; result: number; timestamp: string }> {
    return [...this.entries];
  }

  getLast(): { expr: string; result: number } | undefined {
    if (this.entries.length === 0) return undefined;
    const last = this.entries[this.entries.length - 1];
    return { expr: last.expr, result: last.result };
  }

  clear(): void {
    this.entries = [];
    this.save();
  }
}
