import type { ReactNode } from 'react';
import { color, layout } from '../../tokens';
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
        <main style={{ flex: 1, overflow: 'auto', padding: '16px 28px' /* v2: 28px gutters, 16px top (frames x=252..1892) */ }}>
          <div style={{ maxWidth: layout.contentMaxWidth, margin: '0 auto' }}>{children}</div>
        </main>
      </div>
    </div>
  );
}
