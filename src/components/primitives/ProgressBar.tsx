import { color as tcolor, radius } from '../../tokens';

/** Horizontal bar used in the 활용현황 cards. Fill color is caller-controlled. */
export default function ProgressBar({
  value,
  color = '#55C961',
  trackColor = tcolor.border,
  height = 8,
}: {
  value: number;
  color?: string;
  trackColor?: string;
  height?: number;
}) {
  return (
    <div
      style={{
        flex: 1,
        height,
        borderRadius: radius.pill,
        background: trackColor,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${Math.max(0, Math.min(100, value))}%`,
          height: '100%',
          borderRadius: radius.pill,
          background: color,
        }}
      />
    </div>
  );
}
