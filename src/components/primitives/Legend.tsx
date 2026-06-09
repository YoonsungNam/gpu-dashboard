import { color, space } from '../../tokens';

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
              borderRadius: 1,
              background: item.color,
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 12, lineHeight: '14px', fontWeight: 500, color: color.textTertiary }}>
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
