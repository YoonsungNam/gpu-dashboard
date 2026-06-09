import { semantic } from '../tokens';

/**
 * Utilization → severity level.
 * NOTE: thresholds are PLACEHOLDER values (real cutoffs TBD). Change them here
 * only — every threshold-colored cell/badge derives from this one function.
 */
export const utilThresholds = {
  good: 80, // value >= good  -> good (green)
  warn: 30, // value >= warn  -> warn (amber); below warn -> bad (red)
};

export type UtilLevel = 'good' | 'warn' | 'bad';

export function utilLevel(value: number): UtilLevel {
  if (value >= utilThresholds.good) return 'good';
  if (value >= utilThresholds.warn) return 'warn';
  return 'bad';
}

export function utilColors(value: number) {
  return semantic.util[utilLevel(value)];
}

export const pct = (n: number, digits = 1) => `${n.toFixed(digits)}%`;
export const num = (n: number) => n.toLocaleString('en-US');
