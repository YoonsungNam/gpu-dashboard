import type { ReactNode } from 'react';
import { color, radius, space, text } from '../../tokens';
import { CaretDownIcon } from '../../icons/FigureIcons';

/**
 * White 24×24 secondary-button marker that precedes every section title.
 * Mirrors the Figma `btn_2ndary` instance (fill #FFFFFF, r2, 14px chevron glyph);
 * the magenta `#FF54EE` square in the node tree is a design-system guide overlay,
 * not part of the rendered output.
 */
function SectionMarker() {
  return (
    <span
      style={{
        width: 24,
        height: 24,
        flexShrink: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: color.cardBg,
        border: `1px solid ${color.borderSubtle}`, // #DADFE4 (btn_2ndary edge, re-verified)
        borderRadius: radius.cell,
      }}
    >
      <CaretDownIcon size={14} color={color.textSecondary} />
    </span>
  );
}

/** Section header row above each Overview section: marker + title + caption, optional right-aligned content. */
export default function SectionHeader({
  title,
  caption,
  right,
  icon,
}: {
  title: string;
  caption?: string;
  right?: ReactNode;
  /** Overrides the default chevron marker. */
  icon?: ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        // v2 exports show NO underline — the tree's 1696×1 #CCD1D6 'border' rect
        // (7104:14386 et al.) is hidden in the design. 20px to the card top.
        marginBottom: 20,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: space.lg }}>
        {icon ?? <SectionMarker />}
        <span style={{ ...text.sectionTitle, color: color.textTitle }}>{title}</span>
        {caption && <span style={{ ...text.body, color: color.textSecondary }}>{caption}</span>}
      </div>
      {right}
    </div>
  );
}
