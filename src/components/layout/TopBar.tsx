import type { ReactNode } from 'react';
import { color, layout, text } from '../../tokens';

export default function TopBar({
  title,
  actions,
}: {
  title: string;
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
      <div style={{ ...text.sectionTitle, color: color.textPrimary }}>{title}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{actions}</div>
    </header>
  );
}
