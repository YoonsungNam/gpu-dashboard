import type { CSSProperties } from 'react';
import { color, radius, space, text } from '../../tokens';

/**
 * Build a sensible windowed page range, e.g.
 *   1 2 3 4 5 … 10        (near start)
 *   1 … 4 5 6 7 8 … 20    (in middle)
 *   1 … 16 17 18 19 20    (near end)
 * Numbers + '…' gap markers; always includes first/last and a window around current.
 */
function buildRange(page: number, pageCount: number): Array<number | '…'> {
  const SIBLINGS = 1; // pages on each side of current
  const items: Array<number | '…'> = [];

  // Small enough to show everything.
  if (pageCount <= 7) {
    for (let p = 1; p <= pageCount; p++) items.push(p);
    return items;
  }

  const start = Math.max(2, page - SIBLINGS);
  const end = Math.min(pageCount - 1, page + SIBLINGS);

  items.push(1);
  if (start > 2) items.push('…');
  for (let p = start; p <= end; p++) items.push(p);
  if (end < pageCount - 1) items.push('…');
  items.push(pageCount);

  return items;
}

/** Center-aligned numbered pagination with ‹ › chevrons. Pure presentational. */
export default function Pagination({
  page,
  pageCount,
  onChange,
}: {
  page: number;
  pageCount: number;
  onChange: (p: number) => void;
}) {
  if (pageCount <= 1) return null;

  const prevDisabled = page <= 1;
  const nextDisabled = page >= pageCount;
  const range = buildRange(page, pageCount);

  const baseBtn: CSSProperties = {
    minWidth: 24,
    height: 24,
    padding: `0 ${space.sm}px`,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    borderRadius: radius.cell,
    background: 'transparent',
    ...text.label,
    cursor: 'pointer',
    userSelect: 'none',
  };

  const chevronStyle = (disabled: boolean): CSSProperties => ({
    ...baseBtn,
    color: disabled ? color.textDisabled : color.textSecondary,
    cursor: disabled ? 'default' : 'pointer',
  });

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: space.xs,
      }}
    >
      <button
        type="button"
        aria-label="Previous page"
        disabled={prevDisabled}
        onClick={() => !prevDisabled && onChange(page - 1)}
        style={chevronStyle(prevDisabled)}
      >
        ‹
      </button>

      {range.map((item, i) => {
        if (item === '…') {
          return (
            <span
              key={`gap-${i}`}
              style={{
                ...baseBtn,
                cursor: 'default',
                color: color.textMuted,
              }}
            >
              …
            </span>
          );
        }
        const active = item === page;
        return (
          <button
            type="button"
            key={item}
            aria-label={`Page ${item}`}
            aria-current={active ? 'page' : undefined}
            onClick={() => !active && onChange(item)}
            style={{
              ...baseBtn,
              background: active ? color.brand : 'transparent',
              color: active ? color.white : color.textSecondary,
              cursor: active ? 'default' : 'pointer',
              fontWeight: active ? 600 : text.label.fontWeight,
            }}
          >
            {item}
          </button>
        );
      })}

      <button
        type="button"
        aria-label="Next page"
        disabled={nextDisabled}
        onClick={() => !nextDisabled && onChange(page + 1)}
        style={chevronStyle(nextDisabled)}
      >
        ›
      </button>
    </div>
  );
}
