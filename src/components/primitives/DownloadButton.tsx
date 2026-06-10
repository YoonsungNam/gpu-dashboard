import { color, radius, text } from '../../tokens';

/** Outlined download button (purely presentational). */
export default function DownloadButton({
  onClick,
  label = '다운로드',
}: {
  onClick?: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      className="gd-clickable"
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4, // Figma btn pad 4.0/8.0 gap4.0 (node 7104:3383, 85x28)
        height: 28,
        padding: '0 8px',
        border: `1px solid ${color.borderSubtle}`, // #DADFE4 (pixel-sampled)
        borderRadius: radius.cell,
        background: color.cardBg,
        color: '#3C444B', // Figma 다운로드 label (node I7001:50019;11162:36388)
        ...text.bodyM,
        fontWeight: 500,
        fontFamily: 'inherit',
      }}
    >
      {/* Bare green letter-X Excel glyph (Figma Icon14-Excel_down, vectors
          325:25806-25808 — two crossing diagonal bars + short foot bar,
          all fill #3C724B, no document container). */}
      <svg width={14} height={14} viewBox="0 0 14 14" fill="none" aria-hidden="true" style={{ display: 'block' }}>
        <path d="M3 2.5H4.6L11.1 11.5H9.5L3 2.5Z" fill="#3C724B" />
        <path d="M11.1 2.5H9.5L3 11.5H4.6L11.1 2.5Z" fill="#3C724B" />
        <rect x="8.6" y="11.5" width="4" height="1" fill="#3C724B" />
      </svg>
      {label}
    </button>
  );
}
