import type { ReactNode } from 'react';
import { color } from '../../tokens';

export interface SummaryCell {
  label: string;
  /** Optional 20px glyph before the label (GPU 활용 현황 과제 셀의 task 아이콘). */
  icon?: ReactNode;
  value: string;
  unit?: string;
  sub?: string;
}

/**
 * 상단 Summary 카드 (2026-06-16 design, nodes 7198:8982 'GPU자원' / 7198:16295 'GPU토큰').
 * 단일 흰 카드(r6 + 그림자) 안에 셀들을 #E4E9ED 세로 구분선으로 나눈 KPI 행.
 * 각 셀 = 라벨(14/400, 아이콘 옵션) 위 → 큰 숫자(30/600) + 단위(16/400) →
 * 서브라인(12/400). 좌측 정렬, 셀 폭 고정 200px. GPU 활용 현황·토큰 활용 현황 공용.
 */
export default function SummaryCard({ cells }: { cells: SummaryCell[] }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'stretch',
        background: color.cardBg,
        borderRadius: 6,
        // Badge/card shadow from the Figma node (DROP_SHADOW 0/1 + 0/0, blur2, #283037 @12%).
        boxShadow: '0 1px 2px rgba(40,48,55,0.12), 0 0 2px rgba(40,48,55,0.12)',
      }}
    >
      {cells.map((c, i) => (
        <div key={c.label} style={{ display: 'flex', alignItems: 'stretch' }}>
          {i > 0 && (
            <span aria-hidden style={{ width: 1, background: color.border, margin: '16px 0', flexShrink: 0 }} />
          )}
          <div
            style={{
              width: 200,
              boxSizing: 'border-box',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 14,
                lineHeight: '20px',
                fontWeight: 400,
                color: color.textTitle,
                whiteSpace: 'nowrap',
              }}
            >
              {c.icon}
              {c.label}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 3, marginTop: 8 }}>
              <span style={{ fontSize: 30, lineHeight: '34px', fontWeight: 600, color: color.textTitle }}>
                {c.value}
              </span>
              {c.unit && (
                <span style={{ fontSize: 16, lineHeight: '20px', fontWeight: 400, color: color.textSecondary }}>
                  {c.unit}
                </span>
              )}
            </span>
            {c.sub && (
              <span style={{ marginTop: 4, fontSize: 12, lineHeight: '16px', fontWeight: 400, color: color.textTertiary }}>
                {c.sub}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
