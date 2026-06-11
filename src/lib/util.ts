import { semantic } from '../tokens';

export type UtilMetric = 'gpu' | 'slot';

import type { TaskType } from '../mock/types';

/**
 * ★지표 셀 색상 임계 — 태스크별(2026-06-11 디자인 '모니터링 지표 정의' 표)★
 * 운영 정책에 따라 숫자만 바꾸면 테이블 셀 색, 하단 범례, 지표 정의 패널이
 * 함께 갱신됩니다. (과제 등급 기준은 lib/gradePolicy.ts)
 */
export const utilThresholds: Record<TaskType, Record<UtilMetric, { good: number; warn: number }>> = {
  추론: {
    gpu: { good: 20, warn: 10 }, // ≥20 정상 · 10-20 주의 · <10 저활용
    slot: { good: 80, warn: 70 },
  },
  학습: {
    gpu: { good: 40, warn: 20 },
    slot: { good: 75, warn: 65 },
  },
};

export type UtilLevel = 'good' | 'warn' | 'bad';

export function utilLevel(value: number, metric: UtilMetric = 'gpu', task: TaskType = '추론'): UtilLevel {
  const t = utilThresholds[task][metric];
  if (value >= t.good) return 'good';
  if (value >= t.warn) return 'warn';
  return 'bad';
}

export function utilColors(value: number, metric: UtilMetric = 'gpu', task: TaskType = '추론') {
  return semantic.util[utilLevel(value, metric, task)];
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
