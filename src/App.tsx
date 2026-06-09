import { useState } from 'react';
import AppShell from './components/layout/AppShell';
import type { NavKey } from './components/layout/Sidebar';
import Gallery from './dev/Gallery';
import OverlayCompare from './dev/OverlayCompare';
import { color, radius, space, text } from './tokens';

const TITLES: Record<NavKey, string> = {
  overview: 'Overview',
  resource: 'GPU 자원',
  etc: '그 외',
  gallery: '컴포넌트 갤러리',
  overlay: 'Figma 오버레이',
};

function Placeholder({ title }: { title: string }) {
  return (
    <div
      style={{
        padding: 40,
        background: color.cardBg,
        borderRadius: radius.card,
        border: `1px dashed ${color.borderStrong}`,
        ...text.body,
        color: color.textTertiary,
        display: 'grid',
        gap: space.sm,
      }}
    >
      <div style={{ ...text.cardTitle, color: color.textPrimary }}>{title}</div>
      Phase 3에서 구현 예정. 컴포넌트는 Phase 2(갤러리)에서 먼저 만들고 여기서 조립합니다.
    </div>
  );
}

export default function App() {
  const [nav, setNav] = useState<NavKey>('gallery');
  return (
    <AppShell active={nav} onNavigate={setNav} title={TITLES[nav]}>
      {nav === 'gallery' && <Gallery />}
      {nav === 'overlay' && <OverlayCompare />}
      {(nav === 'overview' || nav === 'resource' || nav === 'etc') && (
        <Placeholder title={TITLES[nav]} />
      )}
    </AppShell>
  );
}
