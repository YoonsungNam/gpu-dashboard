import { radius } from '../../tokens';
import { utilColors, utilLevel, type UtilMetric } from '../../lib/util';

/**
 * Threshold-colored utilization chip. Color depends on the metric, because
 * GPU Util and Slot Util use different cutoffs (see lib/util.ts).
 * v2 sizes: 'sm' = table row chips (400/12, r2 — GPU 활용 현황 rows);
 * 'lg' = Overview rank-table badges (~60×28, 600/14, r4, bad bg #FFE3E1).
 */
export default function UtilBadge({
  value,
  metric = 'gpu',
  size = 'sm',
}: {
  value: number;
  metric?: UtilMetric;
  size?: 'sm' | 'lg';
}) {
  const c = utilColors(value, metric);
  const lvl = utilLevel(value, metric);
  const lg = size === 'lg';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: lg ? 60 : 48,
        padding: lg ? '4px 10px' : '2px 8px',
        borderRadius: lg ? radius.sm : radius.cell,
        // lg 'bad' uses the lighter #FFE3E1 sampled on the v2 Overview badges.
        background: lg && lvl === 'bad' ? '#FFE3E1' : c.bg,
        border: `1px solid ${c.border}`,
        color: c.text,
        fontSize: lg ? 14 : 12,
        lineHeight: lg ? '18px' : '14px',
        fontWeight: lg ? 600 : 400,
        whiteSpace: 'nowrap',
      }}
    >
      {value.toFixed(1)}%
    </span>
  );
}
