import { tokenize } from "./tokenizer.js";
import { evaluate } from "./evaluator.js";

export interface ProfileResult {
  tokenizeTime: number;
  simplifyTime: number;
  evaluateTime: number;
  totalTime: number;
}

export interface BenchmarkResult {
  average: number;
  min: number;
  max: number;
  median: number;
  opsPerSecond: number;
  iterations: number;
}

function microtime(): number {
  const [s, ns] = process.hrtime();
  return s * 1_000_000 + ns / 1_000;
}

export class ExpressionProfiler {
  private startTime = 0;
  private endTime = 0;
  private phases: { name: string; start: number; end: number }[] = [];
  private currentPhase: { name: string; start: number } | null = null;

  start(): void {
    this.startTime = microtime();
    this.endTime = 0;
    this.phases = [];
    this.currentPhase = null;
  }

  startPhase(name: string): void {
    this.currentPhase = { name, start: microtime() };
  }

  endPhase(): void {
    if (this.currentPhase) {
      this.phases.push({ ...this.currentPhase, end: microtime() });
      this.currentPhase = null;
    }
  }

  stop(): void {
    this.endTime = microtime();
  }

  getResults(): ProfileResult {
    const getPhaseTime = (name: string): number => {
      const phase = this.phases.find((p) => p.name === name);
      return phase ? phase.end - phase.start : 0;
    };

    return {
      tokenizeTime: getPhaseTime("tokenize"),
      simplifyTime: getPhaseTime("simplify"),
      evaluateTime: getPhaseTime("evaluate"),
      totalTime: this.endTime - this.startTime,
    };
  }
}

export function profileExpression(expression: string): { result: number; profile: ProfileResult } {
  const profiler = new ExpressionProfiler();

  profiler.start();

  profiler.startPhase("tokenize");
  const tokens = tokenize(expression);
  profiler.endPhase();

  profiler.startPhase("simplify");
  // Simplification phase placeholder - currently a no-op
  profiler.endPhase();

  profiler.startPhase("evaluate");
  const result = evaluate(tokens);
  profiler.endPhase();

  profiler.stop();

  return { result, profile: profiler.getResults() };
}

export function benchmarkExpression(expression: string, iterations = 1000): BenchmarkResult {
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = microtime();
    const tokens = tokenize(expression);
    evaluate(tokens);
    const end = microtime();
    times.push(end - start);
  }

  times.sort((a, b) => a - b);

  const sum = times.reduce((a, b) => a + b, 0);
  const average = sum / times.length;
  const min = times[0];
  const max = times[times.length - 1];
  const mid = Math.floor(times.length / 2);
  const median = times.length % 2 === 0 ? (times[mid - 1] + times[mid]) / 2 : times[mid];
  const opsPerSecond = 1_000_000 / average;

  return { average, min, max, median, opsPerSecond, iterations };
}
