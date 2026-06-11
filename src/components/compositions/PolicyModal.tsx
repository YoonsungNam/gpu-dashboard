import { useEffect } from 'react';
import { color, shadow, text } from '../../tokens';

/**
 * '정책 안내' modal — opened from the sidebar bottom block.
 * No Figma spec exists for this dialog; it follows the kit modal pattern
 * (ServiceListModal): rgba(0,32,53,0.4) overlay, white r8 panel, 52px
 * header + X, Esc / overlay click close.
 * Body copy is placeholder text — swap in the real 운영 정책 when porting.
 */

const POLICY_LINES = [
  '본 대시보드는 사내 GPU 자원의 효율적 운영을 위해 과제별 할당 및 사용 현황을 집계하여 제공합니다.',
  'GPU Util이 4주 연속 10% 미만인 과제는 저활용 과제로 분류되며, 자원 운영 조직의 회수 검토 대상이 됩니다.',
  '신규 할당 및 증설 요청은 자원 운영 위원회의 월간 심의를 통해 승인되며, 승인 결과는 차주 월요일에 반영됩니다.',
  '회수된 슬롯은 대기 중인 전략 과제에 우선 재배정되고, 잔여 슬롯은 일반 과제 신청 순서에 따라 배분됩니다.',
  '지표 산출 기준 및 세부 운영 정책은 사내 GPU 자원 운영 가이드 문서를 참고하시기 바랍니다.',
];

export default function PolicyModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    /* Overlay — fixed inset 0, rgba(0,32,53,0.4); click closes. */
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,32,53,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 24,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="정책 안내"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 520,
          maxWidth: '100%',
          maxHeight: '80vh',
          background: color.white,
          borderRadius: 8,
          boxShadow: shadow.card,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* HEADER — 52px + 1px #E4E9ED border (kit modal pattern) */}
        <div
          style={{
            height: 52,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            borderBottom: `1px solid ${color.border}`,
          }}
        >
          <span style={{ fontSize: 16, lineHeight: '20px', fontWeight: 500, color: color.textSecondary }}>
            정책 안내
          </span>
          <button
            type="button"
            className="gd-clickable"
            aria-label="닫기"
            onClick={onClose}
            style={{
              width: 20,
              height: 20,
              padding: 0,
              border: 'none',
              background: 'transparent',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width={14} height={14} viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M2 2L12 12M12 2L2 12" stroke={color.textSecondary} strokeWidth="1.2" />
            </svg>
          </button>
        </div>

        {/* BODY — GPU 자원 운영 정책 placeholder copy */}
        <div style={{ padding: '24px 20px', overflowY: 'auto' }}>
          <div style={{ ...text.cardTitle, color: color.textTitle }}>GPU 자원 운영 정책</div>
          <ul
            style={{
              margin: '12px 0 0',
              padding: 0,
              listStyle: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {POLICY_LINES.map((line, i) => (
              <li
                key={i}
                style={{ display: 'flex', gap: 8, ...text.body, lineHeight: '22px', color: color.textSecondary }}
              >
                <span aria-hidden style={{ color: color.textDisabled }}>·</span>
                {line}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
