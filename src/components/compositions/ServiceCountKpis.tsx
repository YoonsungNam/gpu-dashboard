import { fmtTokens, num } from '../../lib/util';
import type { TokenTotals } from '../../mock/types';
import SummaryCard, { type SummaryCell } from './SummaryCard';

/**
 * 토큰 활용 현황 상단 Summary (2026-06-16 design, node 7198:16295):
 * 단일 카드 3셀 — [서비스 그룹 / N개] | [서비스 / N개] |
 * [일평균 토큰 합계 / N(M·B) / Input N · Output N]. 아이콘 없음(06-16 재디자인).
 */

/** '402M' / '2.4B' / '593K' → { value:'402', unit:'M' } (숫자 30px · 단위 16px). */
function splitTokens(n: number): { value: string; unit?: string } {
  const s = fmtTokens(n);
  const m = s.match(/^([\d.,]+)([KMB])?$/);
  return m ? { value: m[1], unit: m[2] } : { value: s };
}

export default function ServiceCountKpis({ totals }: { totals: TokenTotals }) {
  const sum = splitTokens(totals.avg_total);
  const cells: SummaryCell[] = [
    { label: '서비스 그룹', value: num(totals.group_count), unit: '개' },
    { label: '서비스', value: num(totals.service_count), unit: '개' },
    {
      label: '일평균 토큰 합계',
      value: sum.value,
      unit: sum.unit,
      sub: `Input ${fmtTokens(totals.avg_input)} · Output ${fmtTokens(totals.avg_output)}`,
    },
  ];
  return <SummaryCard cells={cells} />;
}
