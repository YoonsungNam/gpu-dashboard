import { radius, text } from '../../tokens';
import { pct, utilColors } from '../../lib/util';

/** Threshold-colored utilization pill (good/warn/bad derived from value). */
export default function UtilBadge({
  value,
  digits = 1,
  minWidth = 48,
}: {
  value: number;
  digits?: number;
  minWidth?: number;
}) {
  const c = utilColors(value);
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
