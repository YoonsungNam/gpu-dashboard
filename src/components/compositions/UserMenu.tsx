import { useEffect, useState } from 'react';
import { radius } from '../../tokens';

/**
 * Profile popover menu — anchored above the '김삼성' row in the sidebar
 * bottom block. No Figma spec; follows the kit popover pattern
 * (GradeFilter): white r2 panel, soft drop shadow, 26px items with
 * #ECF1F5 hover, transparent fixed backdrop closes on outside click.
 * Items are display-only — any click just closes the menu.
 */

const ITEMS = ['내 프로필', '알림 설정', '로그아웃'] as const;

export default function UserMenu({ onClose }: { onClose: () => void }) {
  const [hover, setHover] = useState<string | null>(null);

  // Esc closes the popover (matches the modals' behavior).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <>
      {/* Transparent backdrop: click-outside closes the popover. */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 10 }} />
      <div
        role="menu"
        style={{
          position: 'absolute',
          bottom: 'calc(100% + 8px)',
          left: 0,
          zIndex: 11,
          width: 144,
          boxSizing: 'border-box',
          background: '#FFFFFF',
          borderRadius: radius.cell,
          padding: '6px 1px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.12), 0 0 2px rgba(0,0,0,0.08)',
        }}
      >
        {ITEMS.map((item) => (
          <div
            key={item}
            role="menuitem"
            onClick={onClose}
            onMouseEnter={() => setHover(item)}
            onMouseLeave={() => setHover(null)}
            style={{
              height: 26,
              display: 'flex',
              alignItems: 'center',
              paddingLeft: 8,
              cursor: 'pointer',
              fontSize: 14,
              lineHeight: '20px',
              fontWeight: 400,
              color: '#2F363C',
              background: hover === item ? '#ECF1F5' : '#FFFFFF',
              whiteSpace: 'nowrap',
            }}
          >
            {item}
          </div>
        ))}
      </div>
    </>
  );
}
