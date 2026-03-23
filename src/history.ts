export interface HistoryEntry {
  expression: string;
  result: string;
}

const history: HistoryEntry[] = [];

export function addEntry(expression: string, result: string): void {
  history.push({ expression, result });
}

export function getHistory(): HistoryEntry[] {
  return [...history];
}

export function clearHistory(): void {
  history.length = 0;
}
