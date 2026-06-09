import { radius, text } from '../../tokens';
import { pct, utilColors, type UtilMetric } from '../../lib/util';

/**
 * Threshold-colored utilization pill. Color depends on the metric, because
 * GPU Util and Slot Util use different cutoffs (see lib/util.ts).
 */
export default function UtilBadge({
  value,
  metric = 'gpu',
  digits = 1,
  minWidth = 48,
}: {
  value: number;
  metric?: UtilMetric;
  digits?: number;
  minWidth?: number;
}) {
  const c = utilColors(value, metric);
  return (
    <span
      style={{
        display: 'inline-block',
        minWidth,
        textAlign: 'center',
        padding: '2px 8px',
        borderRadius: radius.cell,
        background: c.bg,
        border: `1px solid ${c.border}`,
        color: c.text,
        ...text.numTiny,
        fontWeight: 600,
      }}
    >
      {pct(value, digits)}
    </span>
  );
}
