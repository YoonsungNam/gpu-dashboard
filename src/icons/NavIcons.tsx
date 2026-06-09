/**
 * Sidebar nav icons — transcribed from the actual Figma vectors
 * (nodes 7001:47233 / 47240 / 47252), with fills switched to `currentColor`
 * so the sidebar can recolor them (white when active, muted when not).
 */
type IconProps = { size?: number; color?: string };

/** Brand 'G' logo mark (Figma node 7001:47219) — a #99A8E3 ring-G + light corner square. */
export function LogoMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <path
        d="M11 5C7.68629 5 5 7.68629 5 11C5 14.3137 7.68629 17 11 17C13.6123 17 15.8334 15.3302 16.6572 13H12V8H22V11C22 17.0751 17.0751 22 11 22C4.92487 22 0 17.0751 0 11C0 4.92487 4.92487 0 11 0V5Z"
        fill="#99A8E3"
      />
      <rect x="17" width="5" height="5" fill="#E9EEF2" />
    </svg>
  );
}

export function OverviewIcon({ size = 16, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="1.5" width="12" height="3" rx="0.5" fill={color} />
      <rect x="1.5" y="4.5" width="4" height="9" rx="0.5" fill={color} />
      <rect x="5.5" y="4.5" width="8" height="9" rx="0.5" fill={color} />
    </svg>
  );
}

export function ResourceIcon({ size = 16, color = 'currentColor' }: IconProps) {
  const ys = [2, 5, 8, 11];
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      {ys.map((y) => (
        <rect key={`d${y}`} x="1.8" y={y} width="1.6" height="1.6" rx="0.8" fill={color} />
      ))}
      {ys.map((y) => (
        <rect key={`l${y}`} x="4.5" y={y + 0.2} width="9.5" height="1.1" rx="0.55" fill={color} />
      ))}
    </svg>
  );
}

export function TokensIcon({ size = 14, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={(size * 15) / 14} viewBox="0 0 14 15" fill="none">
      <path
        d="M7 1C7.27639 1.00006 7.52296 1.17466 7.61426 1.43555L9.18359 5.91992L12.5723 7.28906C12.8309 7.39353 13 7.64487 13 7.92383C13 8.20277 12.8309 8.45413 12.5723 8.55859L9.18359 9.92676L7.61426 14.4121C7.52295 14.673 7.27638 14.8476 7 14.8477C6.72359 14.8477 6.47709 14.673 6.38574 14.4121L4.81543 9.92676L1.42773 8.55859C1.16915 8.45411 1.00002 8.20273 1 7.92383C1 7.64492 1.16915 7.39356 1.42773 7.28906L4.81543 5.91992L6.38574 1.43555C6.47708 1.17466 6.72358 1 7 1Z"
        fill={color}
      />
    </svg>
  );
}
