import type { ReactNode } from 'react';
import { color } from '../../tokens';
import Sidebar, { type NavKey } from './Sidebar';
import TopBar from './TopBar';

export default function AppShell({
  active,
  onNavigate,
  title,
  subtitle,
  actions,
  children,
}: {
  active: NavKey;
  onNavigate: (k: NavKey) => void;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div style={{ display: 'flex', height: '100vh', background: color.pageBg }}>
      <Sidebar active={active} onNavigate={onNavigate} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar title={title} subtitle={subtitle} actions={actions} />
        <main style={{ flex: 1, overflow: 'auto', padding: '16px 28px' /* 디자인 가이드: 콘텐츠 좌우 margin 28px */ }}>
          {/* 2026-06-11 디자인 피드백: 사이드바 접힘 시 콘텐츠가 반응형으로
              확장되어야 함 — 고정 maxWidth 캡 제거, 28px 거터만 유지.
              (펼침 1920 기준 폭은 기존과 동일한 1640) */}
          {children}
        </main>
      </div>
    </div>
  );
}
