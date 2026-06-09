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

export const pct = (n: number, digits = 1) => `${n.toFixed(digits)}%`;
export const num = (n: number) => n.toLocaleString('en-US');
