// 지표 셀/배지 색상 임계는 별도 표가 아니라 등급 정책에서 파생됩니다 —
// lib/gradePolicy.ts의 policyLevel(task, purpose, metric, value)을 사용하세요.
// (2026-06-11 사용자 피드백: '임계 기준'과 '과제 등급 기준'의 이원화 해소)

export const pct = (n: number, digits = 1) => `${n.toFixed(digits)}%`;
export const num = (n: number) => n.toLocaleString('en-US');

/**
 * Compact token-count formatter for the 토큰 활용 현황 screen:
 * 593_000 → '593K' · 2_900_000 → '2.9M' · 402_000_000 → '402M' ·
 * 2_300_000_000 → '2.3B'. (1 decimal under 10 of a unit, none above.)
 */
export function fmtTokens(n: number): string {
  if (n >= 1_000_000_000) {
    const b = n / 1_000_000_000;
    return b < 10 ? `${b.toFixed(1).replace(/\.0$/, '')}B` : `${Math.round(b)}B`;
  }
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
