import { useState, type ComponentType } from 'react';
import { color, font, layout, text } from '../../tokens';
import { LogoMark, OverviewIcon, ResourceIcon, TokensIcon } from '../../icons/NavIcons';
import PolicyModal from '../compositions/PolicyModal';
import UserMenu from '../compositions/UserMenu';

export type NavKey = 'overview' | 'resource' | 'tokens' | 'gallery' | 'overlay';

type IconC = ComponentType<{ size?: number; color?: string }>;

const NAV: { key: NavKey; label: string; Icon: IconC }[] = [
  { key: 'overview', label: 'Overview', Icon: OverviewIcon },
  { key: 'resource', label: 'GPU 활용 현황', Icon: ResourceIcon },
  { key: 'tokens', label: '토큰 활용 현황', Icon: TokensIcon },
];

const DEV: { key: NavKey; label: string }[] = [
  { key: 'gallery', label: '컴포넌트 갤러리' },
  { key: 'overlay', label: 'Figma 오버레이' },
];

// Dev-harness links are not in the Figma design (Frame 2615547) — hide them
// unless explicitly requested via ?dev so fidelity screenshots match the spec.
const SHOW_DEV = new URLSearchParams(window.location.search).has('dev');

/** Collapsed icon-rail width (no Figma spec — 64px rail, icons centered). */
const COLLAPSED_WIDTH = 64;

/** Left navigation — v2 spec Frame 2615547 [7104:14097] (originally v1 7001:47228). */
export default function Sidebar({
  active,
  onNavigate,
}: {
  active: NavKey;
  onNavigate: (k: NavKey) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <aside
      style={{
        width: collapsed ? COLLAPSED_WIDTH : layout.sidebarWidth,
        flexShrink: 0,
        background: color.sidebarBg,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        borderRight: '1px solid rgba(255,255,255,0.2)',
      }}
    >
      {/* Logo header band (56px) + 1px bottom divider (v2 Rectangle 12 [7104:14103]) */}
      <div
        style={{
          height: 56,
          flexShrink: 0,
          padding: collapsed ? 0 : '0 0 0 20px', // right pad 0 so the collapse strip sits flush
          display: 'flex',
          alignItems: 'center',
          gap: collapsed ? 0 : 12, // Figma Frame 2615552 gap12.0
          borderBottom: '1px solid rgba(255,255,255,0.2)',
        }}
      >
        {collapsed ? (
          /* Collapsed: logo mark only, centered in the rail (no wordmark) */
          <span style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LogoMark size={22} />
          </span>
        ) : (
          <>
            <LogoMark size={22} />
            <span style={{ fontFamily: font.brand, fontWeight: 700, fontSize: 19, color: '#fff' }}>
              GPU Monitor
            </span>
          </>
        )}
        {/* LNB collapse strip (Figma 'LNB _Header-scale_button' 7104:14102, 19x55,
            #334551 left divider + white triangle). Toggles the icon rail. */}
        <button
          type="button"
          aria-label={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
          aria-expanded={!collapsed}
          className="gd-clickable"
          onClick={() => setCollapsed((c) => !c)}
          style={{
            marginLeft: collapsed ? 0 : 'auto',
            alignSelf: 'stretch',
            width: 19,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            background: 'transparent',
            border: 'none',
            borderLeft: '1px solid #334551',
            cursor: 'pointer',
          }}
        >
          <svg width={5} height={8} viewBox="0 0 5 8" aria-hidden>
            {collapsed ? (
              <path d="M0 0L5 4L0 8Z" fill="#FFFFFF" />
            ) : (
              <path d="M5 0L0 4L5 8Z" fill="#FFFFFF" />
            )}
          </svg>
        </button>
      </div>

      {/* Primary nav (44px rows, icon + label, active = #3392D3).
          20px gap below the header + 1px row gaps (Figma 2615553 gap1.0).
          Collapsed: icon-only rows, centered. */}
      <nav style={{ display: 'flex', flexDirection: 'column', paddingTop: 20, gap: 1 }}>
        {NAV.map(({ key, label, Icon }) => {
          const on = key === active;
          return (
            <button
              key={key}
              className="gd-clickable gd-nav-item"
              title={collapsed ? label : undefined}
              onClick={() => onNavigate(key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : undefined,
                gap: collapsed ? 0 : 7,
                height: 44,
                padding: collapsed ? 0 : '0 20px',
                border: 'none',
                background: on ? color.sidebarItemActive : 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'inherit',
              }}
            >
              <span
                style={{
                  width: 16,
                  height: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: on ? '#fff' : '#E4E9ED', // inactive icon #E4E9ED (nodes 7104:14127-14130)
                }}
              >
                <Icon size={16} color="currentColor" />
              </span>
              {!collapsed && <span style={{ ...text.bodyM, color: '#fff' }}>{label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Dev-harness links (not in Figma) — only with ?dev in the URL */}
      {SHOW_DEV && !collapsed && (
        <>
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
                    fontFamily: 'inherit',
                  }}
                >
                  ◆ {label}
                </button>
              );
            })}
          </nav>
        </>
      )}

      {/* Bottom block — Figma order: divider → v0.35(beta) → 정책 안내 → profile
          (divider 7104:14146 sits ABOVE the version label). Hidden when collapsed. */}
      {!collapsed && (
        <div
          style={{ marginTop: 'auto', padding: '0 20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          {/* Full-bleed 224x1 divider — escape the 20px padding */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.2)', margin: '0 -20px' }} />
          <div style={{ ...text.caption, color: '#B2B6BB' }}>v0.35(beta)</div>
          <button
            type="button"
            className="gd-clickable"
            onClick={() => setPolicyOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: 0,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: 'inherit',
              ...text.body,
              color: '#B2B6BB',
            }}
          >
            정책 안내{' '}
            {/* Boxed external-link glyph (Icon/Icon8-Arrow_R_up-#Neu15, 7104:14149) */}
            <svg width={14} height={14} viewBox="0 0 14 14" fill="none" aria-hidden>
              <path
                d="M11 7.5V11.5C11 12.0523 10.5523 12.5 10 12.5H2.5C1.94772 12.5 1.5 12.0523 1.5 11.5V4C1.5 3.44772 1.94772 3 2.5 3H6.5"
                stroke="#B2B6BB"
              />
              <path d="M8.5 1.5H12.5V5.5" stroke="#B2B6BB" />
              <path d="M12.5 1.5L7 7" stroke="#B2B6BB" />
            </svg>
          </button>
          {/* ~28px from the 정책 안내 row to the name row (container gap 12 + 16).
              position:relative anchors the profile popover above this block. */}
          <div
            style={{
              marginTop: 16,
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              gap: 2 /* Frame 2615597 gap2.0 */,
            }}
          >
            <button
              type="button"
              className="gd-clickable"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: 0,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'inherit',
                ...text.body,
                color: '#DADFE4',
              }}
            >
              김삼성
              {/* Thin stroked chevron (Icon/Icon14-Chevron-S_Down-#d, 7104:14153) */}
              <svg width={14} height={14} viewBox="0 0 14 14" fill="none" aria-hidden>
                <path d="M4 6L7 9L10 6" stroke="#DADFE4" strokeWidth="1.2" />
              </svg>
            </button>
            <div style={{ ...text.caption, color: '#DADFE4' }}>Samsung.Kim@samsung.com</div>
            {menuOpen && <UserMenu onClose={() => setMenuOpen(false)} />}
          </div>
        </div>
      )}

      {policyOpen && <PolicyModal onClose={() => setPolicyOpen(false)} />}
    </aside>
  );
}
