import { useEffect, type CSSProperties } from 'react';
import { color, radius, semantic, shadow, text, tokenScreen } from '../../tokens';

/**
 * '지표 정의' modal — opened from the app-bar ⓘ 지표 정의 button.
 * No Figma spec; follows the kit modal pattern (ServiceListModal):
 * rgba(0,32,53,0.4) overlay, white r8 panel, 52px header + X,
 * Esc / overlay click close. Threshold chips reuse the semantic.util
 * pill colors so the legend matches the table badges 1:1.
 */

const DEFS: { name: string; def: string }[] = [
  { name: 'GPU Util', def: '전체 시간 평균 GPU 사용률' },
  { name: 'GPU Util WH', def: '근무시간(09~18시) 평균 GPU 사용률' },
  { name: 'GPU Util AH', def: '비근무시간 평균 GPU 사용률' },
  { name: 'Slot Util', def: '할당 슬롯 점유율' },
];

type Tone = keyof typeof semantic.util; // 'good' | 'warn' | 'bad'

const THRESHOLDS: { metric: string; chips: { label: string; tone: Tone }[] }[] = [
  {
    metric: 'GPU Util',
    chips: [
      { label: '≥ 20% 정상', tone: 'good' },
      { label: '10~20% 주의', tone: 'warn' },
      { label: '< 10% 저활용', tone: 'bad' },
    ],
  },
  {
    metric: 'Slot Util',
    chips: [
      { label: '≥ 80% 정상', tone: 'good' },
      { label: '70~80% 주의', tone: 'warn' },
      { label: '< 70% 저활용', tone: 'bad' },
    ],
  },
];

export default function MetricDefsModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Header band + row styles mirror the ServiceListModal table.
  const th: CSSProperties = {
    height: 30,
    padding: '0 11px',
    background: tokenScreen.tableHeadBg,
    borderTop: `1px solid ${color.border}`,
    borderBottom: `1px solid ${color.border}`,
    ...text.caption, // 400/12
    color: color.textTertiary,
    fontWeight: 400,
    textAlign: 'left',
    whiteSpace: 'nowrap',
  };
  const td: CSSProperties = {
    height: 40,
    padding: '0 11px',
    borderBottom: '1px solid #ECF1F5',
    verticalAlign: 'middle',
  };

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
        aria-label="지표 정의"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 560,
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
            지표 정의
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

        {/* BODY — definitions table + threshold legend */}
        <div style={{ padding: '24px 20px', overflowY: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'separate',
              borderSpacing: 0,
              tableLayout: 'fixed',
            }}
          >
            <colgroup>
              <col style={{ width: 140 }} />
              <col />
            </colgroup>
            <thead>
              <tr>
                <th style={th}>지표</th>
                <th style={th}>정의</th>
              </tr>
            </thead>
            <tbody>
              {DEFS.map((d) => (
                <tr key={d.name}>
                  <td style={{ ...td, ...text.bodyM, color: color.textTitle }}>{d.name}</td>
                  <td style={{ ...td, ...text.body, color: color.textSecondary }}>{d.def}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Threshold legend — semantic.util chip colors (Badge Color guide) */}
          <div style={{ marginTop: 20, ...text.label, color: color.textTertiary }}>판정 기준</div>
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {THRESHOLDS.map(({ metric, chips }) => (
              <div key={metric} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 80, ...text.bodyM, color: color.textTitle }}>{metric}</span>
                {chips.map(({ label, tone }) => {
                  const c = semantic.util[tone];
                  return (
                    <span
                      key={label}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        height: 20,
                        boxSizing: 'border-box',
                        padding: '0 6px',
                        borderRadius: radius.cell,
                        background: c.bg,
                        border: `1px solid ${c.border}`,
                        color: c.text,
                        ...text.label,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {label}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
