import type { CSSProperties } from 'react';
import { color, text } from '../../tokens';

/** Big hero number with optional label/sublabel (e.g. 521 / 36 Projects). */
export default function StatHero({
  value,
  label,
  sublabel,
  valueStyle,
}: {
  value: string | number;
  label?: string;
  sublabel?: string;
  valueStyle?: CSSProperties;
}) {
  return (
    <div>
      <div style={{ ...text.metricXl, color: color.textPrimary, ...valueStyle }}>{value}</div>
      {label && <div style={{ ...text.label, color: color.textTertiary, marginTop: 2 }}>{label}</div>}
      {sublabel && <div style={{ ...text.caption, color: color.textMuted }}>{sublabel}</div>}
    </div>
  );
}
