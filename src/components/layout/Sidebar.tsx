import { color, font, layout, text } from '../../tokens';

export type NavKey = 'overview' | 'resource' | 'etc' | 'gallery' | 'overlay';

const NAV: { key: NavKey; label: string; group?: 'app' | 'dev' }[] = [
  { key: 'overview', label: 'Overview', group: 'app' },
  { key: 'resource', label: 'GPU 자원', group: 'app' },
  { key: 'etc', label: '그 외', group: 'app' },
  { key: 'gallery', label: '◆ 컴포넌트 갤러리', group: 'dev' },
  { key: 'overlay', label: '◆ Figma 오버레이', group: 'dev' },
];

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
        color: color.sidebarText,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <div
        style={{
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          color: '#fff',
          fontFamily: font.brand,
          fontWeight: 700,
          fontSize: 17,
        }}
      >
        <span
          style={{
            width: 18,
            height: 18,
            borderRadius: 4,
            background: color.accentCyan,
            display: 'inline-block',
          }}
        />
        GPU Monitor
      </div>

      <nav style={{ marginTop: 8, display: 'flex', flexDirection: 'column' }}>
        {NAV.map((item, i) => {
          const isActive = item.key === active;
          const isFirstDev = item.group === 'dev' && NAV[i - 1]?.group !== 'dev';
          return (
            <div key={item.key}>
              {isFirstDev && (
                <div
                  style={{
                    margin: '12px 16px 4px',
                    paddingTop: 12,
                    borderTop: '1px solid rgba(255,255,255,0.08)',
                    ...text.tiny,
                    color: 'rgba(255,255,255,0.4)',
                  }}
                >
                  DEV
                </div>
              )}
              <button
                className="gd-nav-item gd-clickable"
                onClick={() => onNavigate(item.key)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  border: 'none',
                  background: isActive ? color.sidebarItemActive : 'transparent',
                  color: isActive ? color.sidebarTextActive : color.sidebarText,
                  padding: '9px 16px',
                  ...text.bodyM,
                  cursor: 'pointer',
                }}
              >
                {item.label}
              </button>
            </div>
          );
        })}
      </nav>

      <div style={{ marginTop: 'auto', padding: 16, ...text.tiny, color: 'rgba(255,255,255,0.4)' }}>
        v1.0 (beta)
        <br />
        Samsung Electronics
      </div>
    </aside>
  );
}
