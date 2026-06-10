import { color, radius, text } from '../../tokens';

/** Bordered text input with a left magnifier glyph. */
export default function SearchInput({
  value,
  onChange,
  placeholder,
  width,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  width?: number;
}) {
  return (
    <div style={{ position: 'relative', display: 'inline-block', width }}>
      <svg
        width={14}
        height={14}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color.textSecondary} // #565E66 — pixel-sampled magnifier strokes
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{
          position: 'absolute',
          right: 8, // Figma places the magnifier at the right end of the search box
          top: '50%',
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
        }}
      >
        <circle cx={11} cy={11} r={7} />
        <line x1={21} y1={21} x2={16.65} y2={16.65} />
      </svg>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{
          boxSizing: 'border-box',
          width: width ? '100%' : undefined,
          height: 28, // Figma search box 200x28 — same height as adjacent buttons
          padding: '0 28px 0 10px',
          border: `1px solid ${color.borderStrong}`, // #CCD1D6 (pixel-sampled)
          borderRadius: radius.cell, // r2 (node 11225:30970)
          background: color.cardBg,
          color: color.textPrimary,
          outline: 'none',
          ...text.body,
        }}
      />
    </div>
  );
}
