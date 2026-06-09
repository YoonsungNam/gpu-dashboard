import type { ReactNode } from 'react';
import { color, space, text } from '../../tokens';

/** Section header row used above each Overview section: icon + title + caption, optional right-aligned content. */
export default function SectionHeader({
  title,
  caption,
  right,
  icon,
}: {
  title: string;
  caption?: string;
  right?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: space.lg,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: space.md }}>
        {icon && (
          <span style={{ display: 'flex', alignItems: 'center', alignSelf: 'center' }}>{icon}</span>
        )}
        <span style={{ ...text.sectionTitle, color: color.textPrimary }}>{title}</span>
        {caption && (
          <span style={{ ...text.caption, color: color.textTertiary }}>{caption}</span>
        )}
      </div>
      {right}
    </div>
  );
}
