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
        gap: 6,
        height: 28,
        padding: '0 12px',
        border: `1px solid ${color.borderStrong}`,
        borderRadius: radius.cell,
        background: color.cardBg,
        color: '#3C444B', // Figma 다운로드 label (node I7001:50019;11162:36388)
        ...text.bodyM,
        fontWeight: 500,
      }}
    >
      {/* Green Excel-export glyph (Figma Icon14-Excel_down, fill #3C724B) */}
      <svg width={14} height={14} viewBox="0 0 14 14" fill="none" aria-hidden="true" style={{ display: 'block' }}>
        <path
          d="M2.25 2.25a1 1 0 0 1 1-1h4.4L11 4.6V11a1 1 0 0 1-1 1H3.25a1 1 0 0 1-1-1V2.25z"
          fill="#3C724B"
        />
        <path d="M7.5 1.4v3.1a.6.6 0 0 0 .6.6h2.8" fill="#2E5B3B" />
        <path
          d="M4.5 5.9 6 7.9 4.5 9.9M7.5 5.9 6 7.9 7.5 9.9"
          stroke="#FFFFFF"
          strokeWidth={0.9}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {label}
    </button>
  );
}
