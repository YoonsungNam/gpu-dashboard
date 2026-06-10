import { radius } from '../../tokens';
import { utilColors, utilLevel, type UtilMetric } from '../../lib/util';

/**
 * Threshold-colored utilization chip. Color depends on the metric, because
 * GPU Util and Slot Util use different cutoffs (see lib/util.ts).
 * v2 sizes: 'sm' = table row chips (400/12, r2, 60px wide — GPU 활용 현황 rows);
 * 'lg' = Overview rank-table badges (60×22, 600/12, r2, bad bg #FFE3E1).
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
        minWidth: 60, // both sizes measure 60px wide in the v2 rasters
        padding: lg ? '2px 10px' : '2px 8px',
        borderRadius: radius.cell,
        // lg 'bad' uses the lighter #FFE3E1 sampled on the v2 Overview badges.
        background: lg && lvl === 'bad' ? '#FFE3E1' : c.bg,
        border: `1px solid ${c.border}`,
        color: c.text,
        fontSize: 12,
        lineHeight: lg ? '16px' : '14px',
        fontWeight: lg ? 600 : 400,
        whiteSpace: 'nowrap',
      }}
    >
      {value.toFixed(1)}%
    </span>
  );
}
