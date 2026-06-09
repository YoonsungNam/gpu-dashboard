import { useState, type ReactNode } from 'react';
import ov1 from '../../design/GPU_Overview1.png';
import ov2 from '../../design/GPU_Overview2.png';
import rs1 from '../../design/GPU_Resource1.png';
import rs2 from '../../design/GPU_Resource2.png';
import { color, radius, space, text } from '../tokens';

const FRAMES = [
  { id: 'ov1', label: 'Overview (1)', src: ov1 },
  { id: 'ov2', label: 'Overview (2)', src: ov2 },
  { id: 'rs1', label: 'GPU 자원 (1)', src: rs1 },
  { id: 'rs2', label: 'GPU 자원 (2)', src: rs2 },
];

/**
 * Pixel-matching harness: renders the built screen (children) and overlays the
 * Figma reference PNG on top at adjustable opacity. In Phase 3 each screen is
 * passed as children; for now it shows the reference alone.
 */
export default function OverlayCompare({ children }: { children?: ReactNode }) {
  const [frame, setFrame] = useState(0);
  const [opacity, setOpacity] = useState(0.5);
  const [show, setShow] = useState(true);

  return (
    <div style={{ display: 'grid', gap: space.lg }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: space.xl,
          padding: space.lg,
          background: color.cardBg,
          borderRadius: radius.card,
          border: `1px solid ${color.border}`,
          flexWrap: 'wrap',
        }}
      >
        <label style={{ ...text.label, color: color.textSecondary }}>
          프레임{' '}
          <select value={frame} onChange={(e) => setFrame(Number(e.target.value))}>
            {FRAMES.map((f, i) => (
              <option key={f.id} value={i}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
        <label style={{ ...text.label, color: color.textSecondary, display: 'flex', gap: 8, alignItems: 'center' }}>
          오버레이 투명도
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={opacity}
            onChange={(e) => setOpacity(Number(e.target.value))}
          />
          <span style={{ width: 36 }}>{Math.round(opacity * 100)}%</span>
        </label>
        <label style={{ ...text.label, color: color.textSecondary }}>
          <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} /> 오버레이 표시
        </label>
      </div>

      <div style={{ position: 'relative', width: '100%', border: `1px solid ${color.border}`, background: '#fff' }}>
        <div>
          {children ?? (
            <div style={{ padding: 40, ...text.body, color: color.textMuted }}>
              아직 화면이 없습니다. Phase 3에서 만든 화면을 이 아래에 깔고, 위 슬라이더로 Figma 원본과 겹쳐
              픽셀 단위로 맞춥니다.
            </div>
          )}
        </div>
        {show && (
          <img
            src={FRAMES[frame].src}
            alt={FRAMES[frame].label}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              opacity,
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
    </div>
  );
}
