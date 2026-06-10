import { radius } from '../../tokens';
import { num } from '../../lib/util';

interface Segment {
  key: string;
  value: number;
  color: string;
}

/**
 * 보유현황 horizontal stacked bar.
 * v2 (nodes 7104:14486/14499/14512/14525): every row's segment frame spans the FULL
 * 1277px track — bars are 100% filled and segment widths are PERCENTAGES of the row
 * total. (v1's absolute-magnitude partial fill — inner frames 1152/947/791/827 of
 * 1277, node 7001:47494 — is gone.) Wide segments still show their raw count in
 * white 700/11px. Near-rectangular (r2) on an #ECF1F5 track.
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
        return (
          <div
            key={seg.key}
            title={`${seg.key}: ${seg.value}`}
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
    </div>
  );
}
