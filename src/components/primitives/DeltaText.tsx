import { semantic, text } from '../../tokens';

/** Trend delta: ▲/▼ + |value| (+ optional suffix), colored up/down by sign. */
export default function DeltaText({
  value,
  digits = 1,
  suffix = '',
}: {
  value: number;
  digits?: number;
  suffix?: string;
}) {
  const up = value >= 0;
  return (
    <span
      style={{
        ...text.numTiny,
        color: up ? semantic.delta.up : semantic.delta.down,
        whiteSpace: 'nowrap',
      }}
    >
      {up ? '▲' : '▼'}
      {Math.abs(value).toFixed(digits)}
      {suffix}
    </span>
  );
}
