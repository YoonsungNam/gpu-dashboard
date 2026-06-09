import type { CSSProperties, ReactNode } from 'react';
import { color, radius, shadow, space, text } from '../../tokens';

export default function Card({
  title,
  headerRight,
  padding = space.xl,
  style,
  children,
}: {
  title?: ReactNode;
  headerRight?: ReactNode;
  padding?: number;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        background: color.cardBg,
        borderRadius: radius.card,
        boxShadow: shadow.card,
        border: `1px solid ${color.border}`,
        ...style,
      }}
    >
      {(title || headerRight) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: `${space.lg}px ${padding}px`,
            borderBottom: `1px solid ${color.border}`,
          }}
        >
          <div style={{ ...text.cardTitle, color: color.textPrimary }}>{title}</div>
          {headerRight}
        </div>
      )}
      <div style={{ padding }}>{children}</div>
    </div>
  );
}
