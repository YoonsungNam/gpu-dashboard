import { useEffect, useState } from 'react';
import { radius } from '../../tokens';

/**
 * Profile popover menu — anchored above the '김삼성' row in the sidebar
 * bottom block. No Figma spec; follows the kit popover pattern
 * (GradeFilter): white r2 panel, soft drop shadow, 26px items with
 * #ECF1F5 hover, transparent fixed backdrop closes on outside click.
 * Items are display-only — any click just closes the menu.
 */

/**
 * 2026-06-11 디자인 '메뉴 가이드' (node 7164:7138, 192×155): 그룹 라벨
 * (400/11 #767D84) + 아이템(400/14 #283037, 26px) 2개 섹션, #E4E9ED 구분선.
 */
const SECTIONS: { label: string; items: { name: string; chevron?: boolean }[] }[] = [
  { label: '도움', items: [{ name: 'S-VoC' }, { name: 'Q&A' }] },
  { label: '환경 설정', items: [{ name: '언어(Language)', chevron: true }] },
];

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
          width: 192,
          boxSizing: 'border-box',
          background: '#FFFFFF',
          borderRadius: radius.cell,
          boxShadow: '0 2px 8px rgba(0,0,0,0.12), 0 0 2px rgba(0,0,0,0.08)',
        }}
      >
        {SECTIONS.map((sec, si) => (
          <div key={sec.label} style={{ padding: '8px 1px' }}>
            {si > 0 && (
              <div style={{ height: 1, background: '#E4E9ED', margin: '-8px -1px 8px' }} />
            )}
            <div
              style={{
                height: 22,
                display: 'flex',
                alignItems: 'center',
                paddingLeft: 8,
                fontSize: 11,
                lineHeight: '12px',
                fontWeight: 400,
                color: '#767D84',
              }}
            >
              {sec.label}
            </div>
            {sec.items.map((item) => (
              <div
                key={item.name}
                role="menuitem"
                onClick={onClose}
                onMouseEnter={() => setHover(item.name)}
                onMouseLeave={() => setHover(null)}
                style={{
                  height: 26,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0 8px',
                  cursor: 'pointer',
                  fontSize: 14,
                  lineHeight: '20px',
                  fontWeight: 400,
                  color: '#283037',
                  background: hover === item.name ? '#ECF1F5' : '#FFFFFF',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.name}
                {item.chevron && (
                  <svg width={14} height={14} viewBox="0 0 14 14" fill="none" aria-hidden>
                    <path d="M5.5 4L9 7L5.5 10" stroke="#565E66" strokeWidth="1.2" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
