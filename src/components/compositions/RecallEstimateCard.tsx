import { color, radius, text } from '../../tokens';
import type { ReclaimBasis } from '../../mock/types';

const RED = '#D2362C';
const BAR_BELOW = '#FF4337';
const BAR_MET = '#A5ABB1';

const clamp = (v: number) => Math.max(0, Math.min(100, v));

/**
 * 저활용 회수 예상량 target-vs-current card (nodes 7104:11137-11159, 795×139
 * white r4). Top-left basis label 500/12 #767D84; '현재 X%' (value #D2362C
 * when below target) left / '목표 Y%' 400/14 #3C444B right; 7px r100 bar
 * (track #E4E9ED, fill #FF4337 below target / #A5ABB1 met) with an 8×5 ▼
 * #767D84 marker at target%; 1px #E4E9ED divider; footer either
 * '71개 회수(H100 기준) | 120개 → 잔여 49개' (count red) or '이 기준 회수 없음'.
 */
export default function RecallEstimateCard({
  basisLabel,
  basis,
}: {
  basisLabel: string;
  basis: ReclaimBasis;
}) {
  const below = basis.current_pct < basis.target_pct;
  const hasReclaim = basis.reclaim_count > 0;

  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        boxSizing: 'border-box',
        background: '#FFFFFF',
        borderRadius: radius.sm,
        padding: '16px 20px 14px',
      }}
    >
      {/* Basis caption */}
      <div style={{ ...text.label, color: color.textTertiary }}>{basisLabel}</div>

      {/* 현재 / 목표 row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 10,
          ...text.body,
        }}
      >
        <span style={{ color: color.textTertiary }}>
          현재 <span style={{ color: below ? RED : color.textTertiary }}>{basis.current_pct.toFixed(1)}%</span>
        </span>
        <span style={{ color: color.textTitle }}>목표 {basis.target_pct}%</span>
      </div>

      {/* ▼ target marker strip (8×5 #767D84 at target%) */}
      <div style={{ position: 'relative', height: 5, margin: '4px 0 2px' }}>
        <svg
          width={8}
          height={5}
          viewBox="0 0 8 5"
          aria-hidden
          style={{
            position: 'absolute',
            top: 0,
            left: `calc(${clamp(basis.target_pct)}% - 4px)`,
            display: 'block',
          }}
        >
          <path d="M0 0H8L4 5L0 0Z" fill="#767D84" />
        </svg>
      </div>

      {/* Track + current fill */}
      <div
        style={{
          height: 7,
          borderRadius: radius.pill,
          background: color.border,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${clamp(basis.current_pct)}%`,
            height: '100%',
            borderRadius: radius.pill,
            background: below ? BAR_BELOW : BAR_MET,
          }}
        />
      </div>

      {/* Full-bleed divider */}
      <div style={{ height: 1, background: color.border, margin: '14px -20px 12px' }} />

      {/* Footer */}
      {hasReclaim ? (
        <div style={{ display: 'flex', alignItems: 'center', ...text.body, color: color.textSecondary }}>
          <span>
            <span style={{ color: RED }}>{basis.reclaim_count}</span>개 회수(H100 기준)
          </span>
          <span style={{ width: 1, height: 12, background: '#2F363C', margin: '0 8px', flexShrink: 0 }} />
          <span>
            {basis.total_count}개 → 잔여 <span style={{ color: color.textPrimary }}>{basis.remaining_count}개</span>
          </span>
        </div>
      ) : (
        <div style={{ ...text.body, color: color.textSecondary }}>이 기준 회수 없음</div>
      )}
    </div>
  );
}
