import { useState } from 'react';
import { radius } from '../../tokens';
import { num } from '../../lib/util';

interface Segment {
  key: string;
  value: number;
  color: string;
}

interface Hover {
  key: string;
  value: number;
  share: number;
  color: string;
  x: number;
  y: number;
}

/**
 * 보유현황 horizontal stacked bar.
 * v2 (nodes 7104:14486/14499/14512/14525): every row's segment frame spans the FULL
 * 1277px track — bars are 100% filled and segment widths are PERCENTAGES of the row
 * total. (v1's absolute-magnitude partial fill — inner frames 1152/947/791/827 of
 * 1277, node 7001:47494 — is gone.) Wide segments still show their raw count in
 * white 700/11px. Near-rectangular (r2) on an #ECF1F5 track.
 *
 * Hovering a segment shows a cursor-following tooltip (swatch + model + count +
 * share) — with 9 model hues, color alone isn't tellable from the legend.
 * Tooltip styling matches the kit's dark chart tooltip (rgba(40,48,55,0.9), r6).
 */
export default function StackedBar({
  segments,
  maxTotal,
  height = 22,
}: {
  segments: Segment[];
  /** Optional absolute-scale denominator (v1 behavior). Omit for the v2
   *  normalized full-fill bar (denominator = row total). */
  maxTotal?: number;
  height?: number;
}) {
  const [hover, setHover] = useState<Hover | null>(null);
  const rowTotal = segments.reduce((s, seg) => s + seg.value, 0);
  const denom = maxTotal ?? rowTotal;
  return (
    <div
      style={{
        width: '100%',
        height,
        borderRadius: radius.cell,
        background: '#ECF1F5',
        overflow: 'hidden',
        display: 'flex',
      }}
    >
      {segments.map((seg) => {
        const w = denom > 0 ? (seg.value / denom) * 100 : 0;
        const share = rowTotal > 0 ? (seg.value / rowTotal) * 100 : 0;
        return (
          <div
            key={seg.key}
            onMouseMove={(e) =>
              setHover({
                key: seg.key,
                value: seg.value,
                share,
                color: seg.color,
                x: e.clientX,
                y: e.clientY,
              })
            }
            onMouseLeave={() => setHover(null)}
            style={{
              width: `${w}%`,
              background: seg.color,
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {w >= 6 && (
              <span
                style={{
                  fontSize: 11,
                  lineHeight: '13px',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  whiteSpace: 'nowrap',
                }}
              >
                {num(seg.value)}
              </span>
            )}
          </div>
        );
      })}
      {hover && (
        /* position:fixed escapes the bar's overflow:hidden; pointerEvents none
           so the tooltip never steals the hover. */
        <div
          style={{
            position: 'fixed',
            left: hover.x + 12,
            top: hover.y - 36,
            zIndex: 1000,
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 10px',
            borderRadius: 6,
            background: 'rgba(40,48,55,0.9)',
            color: '#FAFBFC',
            fontSize: 12,
            lineHeight: '14px',
            fontWeight: 400,
            whiteSpace: 'nowrap',
          }}
        >
          <span
            style={{ width: 10, height: 10, borderRadius: 1, background: hover.color, flexShrink: 0 }}
          />
          <span style={{ fontWeight: 500 }}>{hover.key}</span>
          <span>
            {num(hover.value)}장 ({hover.share.toFixed(1)}%)
          </span>
        </div>
      )}
    </div>
  );
}
