import { Fragment, useState, type CSSProperties, type ReactNode } from 'react';
import { color, text, tokenScreen } from '../../tokens';
import { fmtTokens, ioBarPct, ioRatio } from '../../lib/util';
import { ChevronRightIcon } from '../../icons/FigureIcons';
import type { TokenGroupSummary, TokenServiceItem } from '../../mock/types';

/**
 * 토큰 활용 현황 grouped table (Frame 26096792 [7104:2774], 1640 wide, r6).
 * Purpose-built — DataTable cannot express the 2-level group/service rows,
 * spacer rows and the full-width chart panel. No pagination exists in this
 * design: groups render in full and each block ends with a 2px #E4E9ED rule.
 */

/** Figma column grid 32/660/234/160/160/234/160 (sum 1640) → % for fluid width. */
const COLS = [32, 660, 234, 160, 160, 234, 160];
const TOTAL = COLS.reduce((s, w) => s + w, 0);

const HEADERS: { label: string; align: 'left' | 'right' }[] = [
  { label: '', align: 'left' },
  { label: '서비스 그룹 · 서비스', align: 'left' },
  { label: '토큰 점유율', align: 'left' },
  { label: '일평균 Input', align: 'right' },
  { label: '일평균 Output', align: 'right' },
  { label: 'I:O', align: 'left' },
  { label: '일평균 합계', align: 'right' },
];

/** Hairline above the 더보기 row (border_under I7104:3181;1258:9796). */
const MORE_HAIRLINE = '#EFF4F8';

/** Static stacked sort triangles (5x5 each, #B9BBBE — node 648:2907). */
export function SortGlyphs() {
  return (
    <svg width={5} height={10} viewBox="0 0 5 10" aria-hidden style={{ marginLeft: 4, flexShrink: 0 }}>
      <path d="M2.5 0L5 4H0L2.5 0Z" fill={tokenScreen.sortGlyph} />
      <path d="M2.5 10L0 6H5L2.5 10Z" fill={tokenScreen.sortGlyph} />
    </svg>
  );
}

/** 6px-high rounded meter on the #E4E9ED track (chart nodes 7104:3546-3548). */
export function MeterBar({ pct, fill, width = 120 }: { pct: number; fill: string; width?: number }) {
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-block',
        width,
        height: 6,
        borderRadius: 8,
        background: tokenScreen.bar.track,
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          display: 'block',
          width: `${Math.min(100, Math.max(0, pct))}%`,
          height: '100%',
          borderRadius: 8,
          background: fill,
        }}
      />
    </span>
  );
}

/** 1x23 #DADFE4 stick on the left edge of cols 3-7 (nodes 7104:3541/3554). */
function DividerStick() {
  return (
    <span
      aria-hidden
      style={{
        position: 'absolute',
        left: 0,
        top: '50%',
        transform: 'translateY(-50%)',
        width: 1,
        height: 23,
        background: color.borderSubtle,
      }}
    />
  );
}

/** '{N}개 서비스 더보기 →' ghost button (7104:3186, hover underline). */
function MoreButton({ label, onClick }: { label: string; onClick: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      className="gd-clickable"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        border: 'none',
        background: 'transparent',
        padding: '3px 6px',
        borderRadius: 2,
        ...text.caption,
        color: color.textSecondary,
        textDecoration: hover ? 'underline' : 'none',
      }}
    >
      {label}
    </button>
  );
}

/** Full-width 10px white spacer row (the 1640x11 'Divider' frames). */
function SpacerRow({ borderBottom }: { borderBottom?: string }) {
  return (
    <tr>
      <td colSpan={COLS.length} style={{ height: 10, padding: 0, background: color.white, borderBottom }} />
    </tr>
  );
}

export interface TokenGroupTableProps {
  groups: TokenGroupSummary[];
  /** Single-open accordion: id of the expanded group (null = all collapsed). */
  expandedGroupId: string | null;
  onToggleGroup: (groupId: string) => void;
  /** 더보기 click → open the 서비스 전체 modal for this group. */
  onMoreServices: (groupId: string) => void;
  /** Chart panel rendered in a colSpan row right under the expanded group row. */
  renderExpandedPanel: (group: TokenGroupSummary) => ReactNode;
  emptyText?: string;
}

export default function TokenGroupTable({
  groups,
  expandedGroupId,
  onToggleGroup,
  onMoreServices,
  renderExpandedPanel,
  emptyText = '조건에 맞는 서비스 그룹이 없습니다',
}: TokenGroupTableProps) {
  // Sticky header band: 28px #FAFBFC + 1px #E4E9ED top/bottom borders = 30px.
  const th: CSSProperties = {
    position: 'sticky',
    top: 0,
    zIndex: 2,
    height: 30,
    padding: '0 8px',
    background: tokenScreen.tableHeadBg,
    borderTop: `1px solid ${color.border}`,
    borderBottom: `1px solid ${color.border}`,
    ...text.label, // 500/12
    color: color.textTertiary,
    whiteSpace: 'nowrap',
  };

  return (
    <table
      style={{
        width: '100%',
        // 'separate' keeps the th borders attached while the header sticks.
        borderCollapse: 'separate',
        borderSpacing: 0,
        tableLayout: 'fixed',
      }}
    >
      <colgroup>
        {COLS.map((w, i) => (
          <col key={i} style={{ width: `${(w / TOTAL) * 100}%` }} />
        ))}
      </colgroup>

      <thead>
        <tr>
          {HEADERS.map((h, i) => (
            <th
              key={i}
              style={{
                ...th,
                textAlign: h.align,
                // 1x28 cell divider #E6E7E8 at the right edge of each cell.
                borderRight: i < HEADERS.length - 1 ? `1px solid ${tokenScreen.headDivider}` : undefined,
                paddingRight: h.align === 'right' ? 12 : 8,
              }}
            >
              {h.label && (
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: h.align === 'right' ? 'flex-end' : 'flex-start',
                  }}
                >
                  {h.label}
                  <SortGlyphs />
                </span>
              )}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {groups.length === 0 ? (
          <tr>
            <td
              colSpan={COLS.length}
              style={{ padding: '24px 10px', textAlign: 'center', ...text.body, color: color.textTertiary }}
            >
              {emptyText}
            </td>
          </tr>
        ) : (
          groups.map((g, gi) => {
            const expanded = g.service_group_id === expandedGroupId;
            // Per the build spec: first 3 children collapsed / 5 expanded,
            // rest behind the 더보기 row.
            const shown = g.services.slice(0, expanded ? 5 : 3);
            const hasMore = g.service_count > shown.length;
            return (
              <Fragment key={g.service_group_id}>
                <GroupRow
                  group={g}
                  index={gi + 1}
                  expanded={expanded}
                  onToggle={() => onToggleGroup(g.service_group_id)}
                />
                {/* Expanded chart panel — full-width row right under the group row. */}
                {expanded && (
                  <tr>
                    <td colSpan={COLS.length} style={{ padding: 0 }}>
                      {renderExpandedPanel(g)}
                    </td>
                  </tr>
                )}
                <SpacerRow />
                {shown.map((s, si) => (
                  <ServiceRow key={s.service_id} service={s} indexInGroup={si} />
                ))}
                {hasMore ? (
                  <>
                    <SpacerRow borderBottom={`1px solid ${MORE_HAIRLINE}`} />
                    <tr>
                      <td
                        colSpan={COLS.length}
                        style={{
                          height: 41,
                          padding: 0,
                          textAlign: 'center',
                          background: color.white,
                          // Group block separator (border_under 7104:3187).
                          borderBottom: `2px solid ${color.border}`,
                        }}
                      >
                        <MoreButton
                          label={`${g.service_count}개 서비스 더보기 →`}
                          onClick={() => onMoreServices(g.service_group_id)}
                        />
                      </td>
                    </tr>
                  </>
                ) : (
                  // Group block separator when no 더보기 row (7104:2906).
                  <SpacerRow borderBottom={`2px solid ${color.border}`} />
                )}
              </Fragment>
            );
          })
        )}
      </tbody>
    </table>
  );
}

/**
 * 61px group row (60 + 1px #ECF1F5 border — nodes 7104:3527-3564). The whole
 * row toggles expansion; the expanded state tints it per tokenScreen.selected
 * (7104:3606-3640: bg #F3F8FD, badge #E6F1FA/#3392D3, text #0077C8/#3392D3 —
 * bar fills stay #515E94).
 */
function GroupRow({
  group: g,
  index,
  expanded,
  onToggle,
}: {
  group: TokenGroupSummary;
  index: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const sel = tokenScreen.selected;
  const valueColor = expanded ? sel.text : color.textTitle;
  const td: CSSProperties = {
    height: 61,
    padding: 0,
    borderBottom: '1px solid #ECF1F5',
    background: expanded ? sel.rowBg : undefined,
    verticalAlign: 'middle',
    position: 'relative',
  };
  const num: CSSProperties = {
    ...td,
    textAlign: 'right',
    paddingRight: 20,
    ...text.body,
    color: valueColor,
  };

  return (
    <tr className="gd-row" style={{ cursor: 'pointer' }} onClick={onToggle}>
      {/* col1 — expand chevron, rotates down when open */}
      <td style={{ ...td, textAlign: 'center' }}>
        <span
          aria-hidden
          style={{
            display: 'inline-flex',
            color: color.textSecondary,
            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 120ms ease',
            lineHeight: 0,
          }}
        >
          <ChevronRightIcon size={16} />
        </span>
      </td>

      {/* col2 — index badge + name/meta stack */}
      <td style={{ ...td, padding: '0 6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 22,
              height: 22,
              flexShrink: 0,
              borderRadius: 2,
              background: expanded ? sel.badgeBg : '#ECF1F5',
              ...text.tiny, // 400/11
              color: expanded ? sel.meta : color.textSecondary,
            }}
          >
            {index}
          </span>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
            <span
              style={{
                ...text.bodyM, // 500/14
                color: expanded ? sel.text : color.textTitle,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {g.service_group_name}
            </span>
            <span style={{ ...text.caption, color: expanded ? sel.meta : color.textSecondary }}>
              {g.division} · 서비스 {g.service_count}개
            </span>
          </span>
        </div>
      </td>

      {/* col3 — 토큰 점유율 bar + pct */}
      <td style={td}>
        <DividerStick />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingLeft: 6 }}>
          <MeterBar pct={g.share_pct} fill={tokenScreen.bar.group} />
          <span style={{ ...text.body, color: valueColor }}>{g.share_pct.toFixed(1)}%</span>
        </div>
      </td>

      {/* col4/col5 — 일평균 Input / Output */}
      <td style={num}>
        <DividerStick />
        {fmtTokens(g.avg_input)}
      </td>
      <td style={num}>
        <DividerStick />
        {fmtTokens(g.avg_output)}
      </td>

      {/* col6 — I:O bar + ratio */}
      <td style={td}>
        <DividerStick />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingLeft: 12 }}>
          <MeterBar pct={ioBarPct(g.avg_input, g.avg_output)} fill={tokenScreen.bar.group} />
          <span style={{ ...text.body, color: valueColor }}>{ioRatio(g.avg_input, g.avg_output)}</span>
        </div>
      </td>

      {/* col7 — 일평균 합계 */}
      <td style={num}>
        <DividerStick />
        {fmtTokens(g.avg_total)}
      </td>
    </tr>
  );
}

/**
 * 41px child service row (nodes 7104:2816-2896): borderless, name indented to
 * x=106 (child grid 106/586/... — 7104:3566), all text #767D84, #99A8E3 bars.
 */
function ServiceRow({ service: s }: { service: TokenServiceItem; indexInGroup: number }) {
  const td: CSSProperties = {
    height: 41,
    padding: 0,
    background: color.white,
    verticalAlign: 'middle',
  };
  const num: CSSProperties = {
    ...td,
    textAlign: 'right',
    paddingRight: 20,
    ...text.body,
    color: color.textTertiary,
  };

  return (
    <tr>
      <td colSpan={2} style={{ ...td, paddingLeft: 106 }}>
        <span
          style={{
            ...text.bodyM, // 500/14 #767D84
            color: color.textTertiary,
            display: 'block',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {s.service_name}
        </span>
      </td>
      <td style={td}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingLeft: 6 }}>
          <MeterBar pct={s.share_pct} fill={tokenScreen.bar.service} />
          <span style={{ ...text.body, color: color.textTertiary }}>{s.share_pct.toFixed(1)}%</span>
        </div>
      </td>
      <td style={num}>{fmtTokens(s.avg_input)}</td>
      <td style={num}>{fmtTokens(s.avg_output)}</td>
      <td style={td}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingLeft: 12 }}>
          <MeterBar pct={ioBarPct(s.avg_input, s.avg_output)} fill={tokenScreen.bar.service} />
          <span style={{ ...text.body, color: color.textTertiary }}>
            {ioRatio(s.avg_input, s.avg_output)}
          </span>
        </div>
      </td>
      <td style={num}>{fmtTokens(s.avg_total)}</td>
    </tr>
  );
}
