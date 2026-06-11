import {useState, useEffect } from 'react';
import { color, radius, text } from '../../tokens';
import { FilterIcon } from '../../icons/FigureIcons';
import type { ProjectGrade } from '../../mock/types';

export type GradeFilterValue = '전체' | ProjectGrade;

const OPTIONS: GradeFilterValue[] = ['전체', '우수', '저활용'];

/**
 * 등급 필터 trigger button + single-select popover (nodes 7104:12152-12164).
 * Button states:
 *  - Enabled   → white bg, 1px #DADFE4 border, icon #767D84, label '등급 필터' #3C444B
 *  - Open      → white bg, 1px #3392D3 border, icon + label #0077C8 (7104:12155)
 *  - Activated → bg #E6F1FA, 1px #CCD1D6 border, icon + label #0077C8, label = active value (7104:12153)
 * Popover: 120px wide, white, r2, padding 6px 1px, subtle drop shadow; three
 * 118×26 items (전체/우수/저활용) 400/14 #2F363C, hover/selected bg #ECF1F5.
 * '전체' clears the filter (button returns to Enabled).
 */
export default function GradeFilter({
  value,
  onChange,
}: {
  value: GradeFilterValue;
  onChange: (v: GradeFilterValue) => void;
}) {
  const [open, setOpen] = useState(false);

  // Esc closes the popover (matches the modals' behavior).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  const [hover, setHover] = useState<GradeFilterValue | null>(null);

  const activated = value !== '전체';
  const blue = open || activated;

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        className="gd-clickable"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          height: 28,
          boxSizing: 'border-box',
          padding: '4px 8px',
          background: !open && activated ? '#E6F1FA' : '#FFFFFF',
          border: `1px solid ${
            open ? '#3392D3' : activated ? '#CCD1D6' : color.borderSubtle
          }`,
          borderRadius: radius.cell,
          cursor: 'pointer',
          color: blue ? '#0077C8' : '#3C444B',
          ...text.bodyM,
          whiteSpace: 'nowrap',
        }}
      >
        <span
          aria-hidden
          style={{ display: 'inline-flex', lineHeight: 0, color: blue ? '#0077C8' : '#767D84' }}
        >
          <FilterIcon size={14} />
        </span>
        {activated ? value : '등급 필터'}
      </button>

      {open && (
        <>
          {/* Transparent backdrop: click-outside closes the popover. */}
          <div
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 10 }}
          />
          <div
            role="listbox"
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              zIndex: 11,
              width: 120,
              boxSizing: 'border-box',
              background: '#FFFFFF',
              borderRadius: radius.cell,
              padding: '6px 1px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12), 0 0 2px rgba(0,0,0,0.08)',
            }}
          >
            {OPTIONS.map((opt) => (
              <div
                key={opt}
                role="option"
                aria-selected={value === opt}
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                onMouseEnter={() => setHover(opt)}
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
                  background: hover === opt || value === opt ? '#ECF1F5' : '#FFFFFF',
                  whiteSpace: 'nowrap',
                }}
              >
                {opt}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
