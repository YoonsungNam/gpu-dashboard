import { useState } from 'react';
import AppShell from './components/layout/AppShell';
import type { NavKey } from './components/layout/Sidebar';
import Gallery from './dev/Gallery';
import OverlayCompare from './dev/OverlayCompare';
import OverviewPage from './screens/OverviewPage';
import GpuResourcePage from './screens/GpuResourcePage';
import TokenUsagePage from './screens/TokenUsagePage';
import { color, radius, semantic, space, text } from './tokens';
import { InfoIcon } from './icons/FigureIcons';
import { filters } from './mock/data';
import MetricDefsModal from './components/compositions/MetricDefsModal';

const TITLES: Record<NavKey, string> = {
  overview: 'Overview',
  resource: 'GPU 활용 현황',
  tokens: '토큰 활용 현황',
  gallery: '컴포넌트 갤러리',
  overlay: 'Figma 오버레이',
};

/** v2: inline page captions shown right of the top-bar title. */
const SUBTITLES: Partial<Record<NavKey, string>> = {
  overview: '전체 자원 활용을 한눈에',
  resource: '과제별 GPU 자원 배분 및 사용율',
  tokens: '과제별 일평균 토큰 사용량',
};


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
        gap: space.sm, // Figma Frames 50/51/52 gap6.0
        ...text.label,
        color: '#3C444B', // Figma filter label color (nodes 7001:46448/46459/46470)
      }}
    >
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: 120, // Figma 'title, button' fixed 120x28 (nodes 7104:14063/14074/14085)
          height: 28,
          boxSizing: 'border-box',
          border: '1px solid #CCD1D6', // pixel-sampled select border (f2_ov_topbar.png)
          borderRadius: radius.cell,
          padding: '4px 26px 4px 8px',
          background: color.cardBg,
          // Custom 14px #565E66 chevron, right-aligned 6px from the box edge
          // (Figma Icon14-Chevron_Down; native arrow suppressed below).
          appearance: 'none',
          WebkitAppearance: 'none',
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 14 14' fill='none'%3E%3Cpath d='M3.5 5.25L7 8.75L10.5 5.25' stroke='%23565E66' stroke-width='1.2'/%3E%3C/svg%3E\")",
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 6px center',
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
  const [period, setPeriod] = useState('최근 28일');
  const [division, setDivision] = useState('전체');
  const [critical, setCritical] = useState('전체');
  const [defsOpen, setDefsOpen] = useState(false);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 13 /* Figma Frame 52 gap13.0 */ }}>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: space.xxs,
          height: 20, // Figma pill 52x20
          boxSizing: 'border-box',
          padding: '0 6px',
          borderRadius: radius.xl,
          // Figma Live tag: neutral pill #F2F6F9 + gray #454E56 text, green status dot only.
          background: '#F2F6F9',
          border: '1px solid #E4E9ED', // pixel-verified 1px ring on the pill
          color: '#454E56',
          ...text.label,
          fontWeight: 400,
          marginRight: 3, // pill→기간 measures ~16px in Figma (13px gap + 3)
        }}
      >
        {/* 8px dot centered in a 16x16 icon slot (Figma BG pad 2/6 gap2) */}
        <span
          style={{
            width: 16,
            height: 16,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{ width: 8, height: 8, borderRadius: radius.pill, background: semantic.delta.up }}
          />
        </span>
        Live
      </span>
      <ToolbarSelect
        label="기간"
        value={period}
        onChange={setPeriod}
        options={['최근 1일', '최근 3일', '최근 7일', '최근 14일', '최근 28일']}
      />
      <ToolbarSelect
        label="사업부"
        value={division}
        onChange={setDivision}
        options={['전체', ...filters.divisions]}
      />
      <ToolbarSelect
        label="과제 구분"
        value={critical}
        onChange={setCritical}
        options={['전체', '전략', '일반']}
      />
      <button
        type="button"
        className="gd-clickable"
        onClick={() => setDefsOpen(true)}
        style={{
          ...text.bodyM,
          fontWeight: 500,
          color: '#565E66', // Figma 지표 정의 ghost-button text (node I7001:46445;11162:48207)
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: space.xs,
          padding: '4px 8px', // btn_ghost pad 4/8 (node 7104:14059)
          border: 'none',
          background: 'transparent',
          fontFamily: 'inherit',
        }}
      >
        {/* 14x14 square-i info icon in a 16x16 slot (nodes 221:53776-53778) */}
        <span
          style={{
            width: 16,
            height: 16,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <InfoIcon size={14} />
        </span>
        지표 정의
      </button>
      {defsOpen && <MetricDefsModal onClose={() => setDefsOpen(false)} />}
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
      subtitle={SUBTITLES[nav]}
      actions={
        nav === 'resource' || nav === 'overview' || nav === 'tokens' ? (
          <ResourceTopActions />
        ) : undefined
      }
    >
      {nav === 'gallery' && <Gallery />}
      {nav === 'overlay' && <OverlayCompare />}
      {nav === 'overview' && <OverviewPage />}
      {nav === 'resource' && <GpuResourcePage />}
      {nav === 'tokens' && <TokenUsagePage />}
    </AppShell>
  );
}
