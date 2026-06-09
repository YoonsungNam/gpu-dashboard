import { radius } from '../../tokens';
import { num } from '../../lib/util';

interface Segment {
  key: string;
  value: number;
  color: string;
}

/**
 * 보유현황 horizontal magnitude bar (Figma node 7001:47492 etc.).
 * Segments are sized by ABSOLUTE count against a shared `maxTotal`, so each row's
 * filled length encodes its real magnitude and the remaining #ECF1F5 track stays
 * visible. Wide segments show their raw count in white 700/11px. Near-rectangular (r2).
 */
export default function StackedBar({
  segments,
  maxTotal,
  height = 22,
}: {
  segments: Segment[];
  /** Common denominator across all rows (usually the largest row total). */
  maxTotal: number;
  height?: number;
}) {
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
        const w = maxTotal > 0 ? (seg.value / maxTotal) * 100 : 0;
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
