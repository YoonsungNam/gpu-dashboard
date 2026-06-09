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
        gap: 4,
        padding: '6px 12px',
        border: `1px solid ${color.borderStrong}`,
        borderRadius: radius.sm,
        background: color.cardBg,
        color: color.textSecondary,
        ...text.label,
      }}
    >
      <svg
        width={12}
        height={12}
        viewBox="0 0 12 12"
        fill="none"
        aria-hidden="true"
        style={{ display: 'block' }}
      >
        <path
          d="M6 1v6.5M3 5l3 3 3-3M2 10.5h8"
          stroke="currentColor"
          strokeWidth={1.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {label}
    </button>
  );
}
