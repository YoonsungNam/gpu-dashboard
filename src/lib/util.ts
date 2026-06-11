import { semantic } from '../tokens';

export type UtilMetric = 'gpu' | 'slot';

/**
 * Real threshold cutoffs taken from the Figma legend (metric-SPECIFIC).
 * GPU Util and Slot Util use DIFFERENT scales. Change them here only — every
 * threshold-colored cell/badge derives from this.
 */
export const utilThresholds: Record<UtilMetric, { good: number; warn: number }> = {
  gpu: { good: 20, warn: 10 }, // GPU Util: ≥20 good · 10–20 warn · <10 bad
  slot: { good: 80, warn: 70 }, // Slot Util: ≥80 good · 70–80 warn · <70 bad
};

export type UtilLevel = 'good' | 'warn' | 'bad';

export function utilLevel(value: number, metric: UtilMetric = 'gpu'): UtilLevel {
  const t = utilThresholds[metric];
  if (value >= t.good) return 'good';
  if (value >= t.warn) return 'warn';
  return 'bad';
}

export function utilColors(value: number, metric: UtilMetric = 'gpu') {
  return semantic.util[utilLevel(value, metric)];
}

// 과제 등급 규칙은 lib/gradePolicy.ts(GRADE_POLICY)로 이동 — 운영 정책 단일 소스.

export const pct = (n: number, digits = 1) => `${n.toFixed(digits)}%`;
export const num = (n: number) => n.toLocaleString('en-US');

/**
 * Compact token-count formatter for the 토큰 활용 현황 screen:
 * 593_000 → '593K' · 2_900_000 → '2.9M' · 402_000_000 → '402M'.
 * (1 decimal for M-values under 10M, none above; K below 1M.)
 */
export function fmtTokens(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return m < 10 ? `${m.toFixed(1).replace(/\.0$/, '')}M` : `${Math.round(m)}M`;
  }
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(Math.round(n));
}

/** I:O ratio normalized to Output = 1 — 'N:1' (e.g. input 2.9M / output 1.7M → '1.7:1'). */
export function ioRatio(input: number, output: number): string {
  if (output <= 0) return input > 0 ? '∞:1' : '-';
  return `${(input / output).toFixed(1).replace(/\.0$/, '')}:1`;
}

/** Input share of total I/O traffic, for the I:O bar width (0–100). */
export const ioBarPct = (input: number, output: number) =>
  input + output > 0 ? (input / (input + output)) * 100 : 0;
