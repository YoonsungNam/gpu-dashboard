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
        color: color.textSecondary,
      }}
    >
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          border: `1px solid ${color.border}`,
          borderRadius: radius.sm,
          padding: '4px 8px',
          background: color.cardBg,
          color: color.textPrimary,
          ...text.label,
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
          gap: space.xs,
          padding: '2px 10px',
          borderRadius: radius.pill,
          background: semantic.util.good.bg,
          color: semantic.util.good.text,
          ...text.label,
          fontWeight: 600,
        }}
      >
        <span
          style={{ width: 6, height: 6, borderRadius: radius.pill, background: semantic.delta.up }}
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
      <span style={{ ...text.label, color: color.brand, cursor: 'pointer' }}>ⓘ 지표 정의</span>
    </div>
  );
}

export default function App() {
  const [nav, setNav] = useState<NavKey>('overview');
  return (
    <AppShell
      active={nav}
      onNavigate={setNav}
      title={TITLES[nav]}
      actions={nav === 'resource' ? <ResourceTopActions /> : undefined}
    >
      {nav === 'gallery' && <Gallery />}
      {nav === 'overlay' && <OverlayCompare />}
      {nav === 'overview' && <OverviewPage />}
      {nav === 'resource' && <GpuResourcePage />}
      {nav === 'etc' && <Placeholder title={TITLES[nav]} />}
    </AppShell>
  );
}
