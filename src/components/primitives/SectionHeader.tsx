import type { ReactNode } from 'react';
import { color, radius, space, text } from '../../tokens';
import { CaretDownIcon } from '../../icons/FigureIcons';

/**
 * White 24×24 secondary-button marker that precedes every section title.
 * Mirrors the Figma `btn_2ndary` instance (fill #FFFFFF, r2, 14px chevron glyph);
 * the magenta `#FF54EE` square in the node tree is a design-system guide overlay,
 * not part of the rendered output.
 *
 * When `onToggle` is provided it renders as a real <button> that collapses /
 * expands the section: chevron points down when open, right when collapsed.
 */
function SectionMarker({
  collapsed = false,
  onToggle,
}: {
  collapsed?: boolean;
  onToggle?: () => void;
}) {
  const boxStyle = {
    width: 24,
    height: 24,
    flexShrink: 0,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    background: color.cardBg,
    border: `1px solid ${color.borderSubtle}`, // #DADFE4 (btn_2ndary edge, re-verified)
    borderRadius: radius.cell,
  } as const;
  const chevron = (
    <span
      style={{
        display: 'inline-flex',
        transform: collapsed ? 'rotate(-90deg)' : 'none',
        transition: 'transform 0.15s ease',
      }}
    >
      <CaretDownIcon size={14} color={color.textSecondary} />
    </span>
  );
  if (!onToggle) return <span style={boxStyle}>{chevron}</span>;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={!collapsed}
      title={collapsed ? '섹션 펼치기' : '섹션 접기'}
      style={{ ...boxStyle, cursor: 'pointer' }}
    >
      {chevron}
    </button>
  );
}

/** Section header row above each Overview section: marker + title + caption, optional right-aligned content. */
export default function SectionHeader({
  title,
  caption,
  right,
  icon,
  collapsed,
  onToggle,
}: {
  title: string;
  caption?: string;
  right?: ReactNode;
  /** Overrides the default chevron marker. */
  icon?: ReactNode;
  /** Collapse state shown by the marker chevron (down = open, right = collapsed). */
  collapsed?: boolean;
  /** When provided, the marker becomes a button that toggles the section. */
  onToggle?: () => void;
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
        {icon ?? <SectionMarker collapsed={collapsed} onToggle={onToggle} />}
        <span style={{ ...text.sectionTitle, color: color.textTitle }}>{title}</span>
        {caption && <span style={{ ...text.body, color: color.textSecondary }}>{caption}</span>}
      </div>
      {right}
    </div>
  );
}
