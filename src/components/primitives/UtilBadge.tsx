import { radius, semantic } from '../../tokens';
import { policyLevel, type PolicyMetric } from '../../lib/gradePolicy';
import type { TaskType } from '../../mock/types';

/**
 * Policy-colored utilization chip. The color is the GRADE_POLICY rule for the
 * row's (task, 용도) evaluated on this metric: red = that metric's 저활용
 * condition holds, green = the 우수 condition holds, yellow = neither.
 * Metrics the policy never judges for that 용도 (e.g. GPU Util AH) render as
 * a neutral gray chip — "참고 지표, 판정 미사용".
 * v2 sizes: 'sm' = table row chips (400/12, r2, 60px wide — GPU 활용 현황 rows);
 * 'lg' = Overview rank-table badges (60×22, 600/12, r2, bad bg #FFE3E1).
 */

/** Neutral chip for policy-unused metrics ('none'). */
const NONE_CHIP = { bg: '#F7F9FA', border: '#E4E9ED', text: '#767D84' };

export default function UtilBadge({
  value,
  metric = 'gpu',
  task = '추론',
  purpose = null,
  size = 'sm',
}: {
  value: number;
  metric?: PolicyMetric;
  /** 임계가 (태스크 × 용도)별로 다름 — 행의 용도를 넘기면 그 규칙으로 판정. */
  task?: TaskType;
  /** null = 집계(평균) 맥락: 어느 용도 규칙이든 저활용 조건에 걸리면 빨강. */
  purpose?: string | null;
  size?: 'sm' | 'lg';
}) {
  const lvl = policyLevel(task, purpose, metric, value);
  const c = lvl === 'none' ? NONE_CHIP : semantic.util[lvl];
  const lg = size === 'lg';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        verticalAlign: 'top', // keep the chip off the text baseline so 41px rows don't grow by 1px
        minWidth: 60, // both sizes measure 60px wide in the v2 rasters
        padding: lg ? '2px 10px' : '2px 8px',
        borderRadius: radius.cell,
        // lg 'bad' uses the lighter #FFE3E1 sampled on the v2 Overview badges.
        background: lg && lvl === 'bad' ? '#FFE3E1' : c.bg,
        border: `1px solid ${c.border}`,
        color: c.text,
        fontSize: 12,
        lineHeight: lg ? '16px' : '14px',
        fontWeight: lg ? 600 : 400,
        whiteSpace: 'nowrap',
      }}
    >
      {value.toFixed(1)}%
    </span>
  );
}
