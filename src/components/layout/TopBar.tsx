import type { ReactNode } from 'react';
import { color, layout, space, text } from '../../tokens';

export default function TopBar({
  title,
  subtitle,
  actions,
}: {
  title: string;
  /** v2: page caption rendered inline right of the title (500/14 #565E66). */
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header
      style={{
        height: layout.topbarHeight,
        flexShrink: 0,
        background: color.cardBg,
        borderBottom: `1px solid ${color.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: space.lg }}>
        <span style={{ ...text.sectionTitle, color: color.textPrimary }}>{title}</span>
        {subtitle && (
          <span style={{ ...text.bodyM, color: color.textSecondary }}>{subtitle}</span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{actions}</div>
    </header>
  );
}
