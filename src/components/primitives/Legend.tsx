import { color, radius, space, text } from '../../tokens';

/** Horizontal wrapping legend: colored swatch + label per item. */
export default function Legend({
  items,
  size = 8,
}: {
  items: { label: string; color: string }[];
  size?: number;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: space.lg,
      }}
    >
      {items.map((item, i) => (
        <div
          key={i}
          style={{ display: 'flex', alignItems: 'center', gap: space.sm }}
        >
          <span
            style={{
              width: size,
              height: size,
              borderRadius: radius.cell,
              background: item.color,
              flexShrink: 0,
            }}
          />
          <span style={{ ...text.tiny, color: color.textSecondary }}>
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
