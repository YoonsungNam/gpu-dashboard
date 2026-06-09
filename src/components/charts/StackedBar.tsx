import { color, radius, space, text } from '../../tokens';

interface Segment {
  key: string;
  value: number;
  color: string;
}

interface Row {
  label: string;
  segments: Segment[];
}

/**
 * 보유현황 점유율 — full-width horizontal stacked bars.
 * Each row: fixed left label + a flex of colored divs sized by value proportion.
 * Crisp/Figma-like (no chart lib), pill ends, optional % labels inside segments.
 */
export default function StackedBar({
  rows,
  height = 18,
  showValues = false,
}: {
  rows: Row[];
  height?: number;
  showValues?: boolean;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: space.lg }}>
      {rows.map((row, ri) => {
        const total = row.segments.reduce((sum, s) => sum + s.value, 0);
        return (
          <div key={ri} style={{ display: 'flex', alignItems: 'center', gap: space.lg }}>
            <div
              style={{
                ...text.label,
                color: color.textSecondary,
                width: 96,
                flex: '0 0 96px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {row.label}
            </div>
            <div
              style={{
                display: 'flex',
                flex: 1,
                height,
                borderRadius: radius.pill,
                overflow: 'hidden',
                background: color.cardBgAlt,
              }}
            >
              {row.segments.map((seg, si) => {
                const ratio = total > 0 ? seg.value / total : 0;
                const percent = ratio * 100;
                return (
                  <div
                    key={seg.key}
                    title={`${seg.key}: ${seg.value}`}
                    style={{
                      flex: `${ratio} ${ratio} 0`,
                      minWidth: ratio > 0 ? 1 : 0,
                      background: seg.color,
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      borderTopLeftRadius: si === 0 ? radius.pill : 0,
                      borderBottomLeftRadius: si === 0 ? radius.pill : 0,
                      borderTopRightRadius: si === row.segments.length - 1 ? radius.pill : 0,
                      borderBottomRightRadius: si === row.segments.length - 1 ? radius.pill : 0,
                    }}
                  >
                    {showValues && percent >= 8 && (
                      <span
                        style={{
                          ...text.tiny,
                          fontWeight: 600,
                          color: color.white,
                          whiteSpace: 'nowrap',
                          padding: `0 ${space.xs}px`,
                        }}
                      >
                        {`${percent.toFixed(0)}%`}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
