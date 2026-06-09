import { useState } from 'react';
import AppShell from './components/layout/AppShell';
import type { NavKey } from './components/layout/Sidebar';
import Gallery from './dev/Gallery';
import OverlayCompare from './dev/OverlayCompare';
import OverviewPage from './screens/OverviewPage';
import GpuResourcePage from './screens/GpuResourcePage';
import { color, radius, semantic, space, text } from './tokens';
import { filters } from './mock/data';

const TITLES: Record<NavKey, string> = {
  overview: 'Overview',
  resource: 'GPU 자원',
  tokens: '추론 토큰',
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

/** Compact labeled select for the GPU 자원 app-bar filter cluster. */
function ToolbarSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: space.xs,
        ...text.label,
        color: '#3C444B', // Figma filter label color (nodes 7001:46448/46459/46470)
      }}
    >
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          border: `1px solid ${color.border}`,
          borderRadius: radius.cell,
          padding: '4px 8px',
          background: color.cardBg,
          color: '#3C444B', // Figma select value color (nodes 7001:46452/46463/46474)
          ...text.body,
        }}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

/**
 * App-bar filter cluster for GPU 자원 (Live pill + 기간/사업부/핵심 + 지표 정의).
 * Display-only in the kit; wire these to global filter state when porting.
 */
function ResourceTopActions() {
  const [period, setPeriod] = useState('최근 30일');
  const [division, setDivision] = useState('전체');
  const [critical, setCritical] = useState('전체');
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: space.md }}>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: space.xxs,
          padding: '2px 6px',
          borderRadius: radius.xl,
          // Figma Live tag: neutral pill #F2F6F9 + gray #454E56 text, green status dot only.
          background: '#F2F6F9',
          color: '#454E56',
          ...text.label,
          fontWeight: 400,
        }}
      >
        <span
          style={{ width: 8, height: 8, borderRadius: radius.pill, background: semantic.delta.up }}
        />
        Live
      </span>
      <ToolbarSelect
        label="기간"
        value={period}
        onChange={setPeriod}
        options={['최근 7일', '최근 30일', '최근 90일']}
      />
      <ToolbarSelect
        label="사업부"
        value={division}
        onChange={setDivision}
        options={['전체', ...filters.divisions]}
      />
      <ToolbarSelect
        label="핵심"
        value={critical}
        onChange={setCritical}
        options={['전체', ...filters.is_critical]}
      />
      <span
        style={{
          ...text.bodyM,
          fontWeight: 500,
          color: '#565E66', // Figma 지표 정의 ghost-button text (node I7001:46445;11162:48207)
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: space.xs,
        }}
      >
        <span style={{ ...text.label, color: color.textTertiary }}>ⓘ</span>
        지표 정의
      </span>
    </div>
  );
}

export default function App() {
  const [nav, setNav] = useState<NavKey>(() => {
    // ?screen= lets the screenshot harness target a specific screen deterministically.
    const p = new URLSearchParams(window.location.search).get('screen') as NavKey | null;
    const valid: NavKey[] = ['overview', 'resource', 'tokens', 'gallery', 'overlay'];
    return p && valid.includes(p) ? p : 'overview';
  });
  return (
    <AppShell
      active={nav}
      onNavigate={setNav}
      title={TITLES[nav]}
      actions={nav === 'resource' || nav === 'overview' ? <ResourceTopActions /> : undefined}
    >
      {nav === 'gallery' && <Gallery />}
      {nav === 'overlay' && <OverlayCompare />}
      {nav === 'overview' && <OverviewPage />}
      {nav === 'resource' && <GpuResourcePage />}
      {nav === 'tokens' && <Placeholder title={TITLES[nav]} />}
    </AppShell>
  );
}
