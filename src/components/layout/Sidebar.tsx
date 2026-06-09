import type { ComponentType } from 'react';
import { color, font, layout, text } from '../../tokens';
import { OverviewIcon, ResourceIcon, TokensIcon } from '../../icons/NavIcons';

export type NavKey = 'overview' | 'resource' | 'tokens' | 'gallery' | 'overlay';

type IconC = ComponentType<{ size?: number; color?: string }>;

const NAV: { key: NavKey; label: string; Icon: IconC }[] = [
  { key: 'overview', label: 'Overview', Icon: OverviewIcon },
  { key: 'resource', label: 'GPU 자원', Icon: ResourceIcon },
  { key: 'tokens', label: '추론 토큰', Icon: TokensIcon },
];

const DEV: { key: NavKey; label: string }[] = [
  { key: 'gallery', label: '컴포넌트 갤러리' },
  { key: 'overlay', label: 'Figma 오버레이' },
];

/** Left navigation — rebuilt from Figma node 7001:47228 ('Aside'). */
export default function Sidebar({
  active,
  onNavigate,
}: {
  active: NavKey;
  onNavigate: (k: NavKey) => void;
}) {
  return (
    <aside
      style={{
        width: layout.sidebarWidth,
        flexShrink: 0,
        background: color.sidebarBg,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        borderRight: '1px solid rgba(255,255,255,0.2)',
      }}
    >
      {/* Logo */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{ width: 18, height: 18, borderRadius: 4, background: color.accentCyan, display: 'inline-block' }}
        />
        <span style={{ fontFamily: font.brand, fontWeight: 700, fontSize: 19, color: '#fff' }}>
          GPU Monitor
        </span>
      </div>

      {/* Primary nav (44px rows, icon + label, active = #3392D3) */}
      <nav style={{ display: 'flex', flexDirection: 'column' }}>
        {NAV.map(({ key, label, Icon }) => {
          const on = key === active;
          return (
            <button
              key={key}
              className="gd-clickable gd-nav-item"
              onClick={() => onNavigate(key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                height: 44,
                padding: '0 20px',
                border: 'none',
                background: on ? color.sidebarItemActive : 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span
                style={{
                  width: 16,
                  height: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: on ? '#fff' : '#9AA6B2',
                }}
              >
                <Icon size={16} color="currentColor" />
              </span>
              <span style={{ ...text.bodyM, color: '#fff' }}>{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Dev-harness links (not in Figma) */}
      <div
        style={{
          margin: '12px 20px 4px',
          paddingTop: 12,
          borderTop: '1px solid rgba(255,255,255,0.08)',
          ...text.tiny,
          color: 'rgba(255,255,255,0.4)',
        }}
      >
        DEV
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column' }}>
        {DEV.map(({ key, label }) => {
          const on = key === active;
          return (
            <button
              key={key}
              className="gd-clickable gd-nav-item"
              onClick={() => onNavigate(key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                height: 34,
                padding: '0 20px',
                border: 'none',
                background: on ? color.sidebarItemActive : 'transparent',
                color: '#fff',
                ...text.caption,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              ◆ {label}
            </button>
          );
        })}
      </nav>

      {/* Bottom: version + policy link + user profile */}
      <div
        style={{ marginTop: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        <div style={{ ...text.caption, color: '#B2B6BB' }}>v0.35(beta)</div>
        <div style={{ height: 1, background: 'rgba(255,255,255,0.2)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, ...text.body, color: '#B2B6BB' }}>
          정책 안내 <span style={{ fontSize: 11 }}>↗</span>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, ...text.body, color: '#DADFE4' }}>
            김삼성 <span style={{ fontSize: 10 }}>▾</span>
          </div>
          <div style={{ ...text.caption, color: '#DADFE4' }}>Samsung.Kim@samsung.com</div>
        </div>
      </div>
    </aside>
  );
}
