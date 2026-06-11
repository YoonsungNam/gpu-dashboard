import { useEffect, type CSSProperties } from 'react';
import { color, shadow, text, tokenScreen } from '../../tokens';
import { fmtTokens, ioRatio } from '../../lib/util';
import type { TokenGroupSummary } from '../../mock/types';
import { MeterBar } from './TokenGroupTable';

/**
 * '서비스 전체' modal (form-modal 7104:4356/4357, 1000x744) — opened from the
 * 더보기 row. Lists EVERY service of the group (scrolls past ~11 rows).
 * Esc / overlay click / X / 닫기 all close.
 */

/** Figma column grid: No 32 / 서비스 340 / 점유율 150 / Input·Output·I:O·합계 110 each. */
const COLS = [32, 340, 150, 110, 110, 110, 110];

const HEADERS: { label: string; align: 'left' | 'center' }[] = [
  { label: 'No', align: 'left' },
  { label: '서비스', align: 'left' },
  { label: '토큰 점유율', align: 'left' },
  { label: '일평균 Input', align: 'center' },
  { label: '일평균 Output', align: 'center' },
  { label: 'I:O', align: 'center' },
  { label: '일평균 합계', align: 'center' },
];

export default function ServiceListModal({
  group,
  dayCount,
  onClose,
}: {
  group: TokenGroupSummary;
  /** TokenTotals.day_count — '최근 28일 기준' in the heading meta (7104:4624). */
  dayCount: number;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Header band 28px #FAFBFC + 1px #E4E9ED top/bottom borders.
  const th: CSSProperties = {
    height: 30,
    padding: '0 11px',
    background: tokenScreen.tableHeadBg,
    borderTop: `1px solid ${color.border}`,
    borderBottom: `1px solid ${color.border}`,
    ...text.caption, // 400/12
    color: color.textTertiary,
    fontWeight: 400,
    whiteSpace: 'nowrap',
  };
  // 51px rows = 50 + 1px #ECF1F5 border (nodes 7104:4369+).
  const td: CSSProperties = {
    height: 51,
    padding: '0 11px',
    borderBottom: '1px solid #ECF1F5',
    verticalAlign: 'middle',
    // Clip at the cell edge — values must never overlap the next column.
    overflow: 'hidden',
  };
  const num: CSSProperties = {
    ...td,
    ...text.body,
    color: color.textTitle,
    textAlign: 'center',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
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
        aria-label="서비스 전체"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 1000,
          maxWidth: '100%',
          maxHeight: 744,
          background: color.white,
          borderRadius: 8,
          boxShadow: shadow.card,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* HEADER — 52px + 1px #E4E9ED border (I7104:4357;1175:181666) */}
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
            서비스 전체
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
              {/* 10x10 X inside the 14x14 icon (Icon14-X10, nodes 221:53106/53107). */}
              <path d="M2 2L12 12M12 2L2 12" stroke={color.textSecondary} strokeWidth="1.2" />
            </svg>
          </button>
        </div>

        {/* BODY — group heading + stat strip + full service table. Scrolls
            both axes: vertically past ~11 rows, horizontally when the modal
            shrinks under the table's 962px design-grid minWidth. */}
        <div style={{ padding: '24px 20px', overflow: 'auto', flex: 1, minHeight: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div style={{ ...text.sectionTitle, color: color.textTitle }}>
                {group.service_group_name}
              </div>
              <div style={{ marginTop: 7, ...text.body, lineHeight: '22px', color: color.textSecondary }}>
                {group.division} · 서비스 {group.service_count}개 · 최근 {dayCount}일 기준
              </div>
            </div>
            {/* Right stat strip (7104:4625-4636): label 400/14 + value 600/20, 1x12 dividers */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Stat label="일평균 Input" value={fmtTokens(group.avg_input)} />
              <StatDivider />
              <Stat label="일평균 Output" value={fmtTokens(group.avg_output)} />
              <StatDivider />
              <Stat label="일평균 합계" value={fmtTokens(group.avg_total)} />
            </div>
          </div>

          <table
            style={{
              width: '100%',
              // Pin the Figma grid sum so the %-share columns never collapse
              // below their design widths; the modal body scrolls instead.
              minWidth: 962,
              borderCollapse: 'separate',
              borderSpacing: 0,
              tableLayout: 'fixed',
              marginTop: 16,
            }}
          >
            <colgroup>
              {COLS.map((w, i) => (
                <col key={i} style={{ width: `${(w / 962) * 100}%` }} />
              ))}
            </colgroup>
            <thead>
              <tr>
                {HEADERS.map((h) => (
                  <th
                    key={h.label}
                    style={{
                      ...th,
                      textAlign: h.align,
                      // 토큰 점유율 header label sits 6px in, matching the bar inset.
                      padding: h.label === '토큰 점유율' ? '0 6px' : th.padding,
                    }}
                  >
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {group.services.map((s, i) => (
                <tr key={s.service_id}>
                  <td style={{ ...td, ...text.body, color: color.textTertiary }}>{i + 1}</td>
                  <td style={{ ...td, padding: '0 12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                      <span
                        style={{
                          ...text.body,
                          color: color.textTitle,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {s.service_name}
                      </span>
                      <span style={{ ...text.caption, color: color.textSecondary }}>{s.model}</span>
                    </div>
                  </td>
                  <td style={{ ...td, padding: '0 6px' }}>
                    {/* 90px bar + 2px gap + 46px right-aligned % (Container 7104:4382). */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <MeterBar pct={s.share_pct} fill={tokenScreen.bar.group} width={90} />
                      <span
                        style={{
                          ...text.body,
                          color: color.textTitle,
                          width: 46,
                          textAlign: 'right',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {s.share_pct.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td style={num}>{fmtTokens(s.avg_input)}</td>
                  <td style={num}>{fmtTokens(s.avg_output)}</td>
                  <td style={num}>{ioRatio(s.avg_input, s.avg_output)}</td>
                  <td style={num}>{fmtTokens(s.avg_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Dialog footer hidden in the Figma instance — X / Esc / overlay click close. */}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
      <span style={{ ...text.body, lineHeight: '22px', color: color.textSecondary }}>{label}</span>
      <span style={{ ...text.sectionTitle, color: color.textSecondary }}>{value}</span>
    </span>
  );
}

function StatDivider() {
  return (
    <span
      aria-hidden
      style={{ width: 1, height: 12, background: color.textPrimary, margin: '0 16px' }}
    />
  );
}
