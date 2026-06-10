import { Fragment, useState, type CSSProperties, type ReactNode } from 'react';
import { color, space, text } from '../../tokens';
import { ChevronRightIcon } from '../../icons/FigureIcons';

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  width?: number | string;
  align?: 'left' | 'right' | 'center';
  /** v2: render static 5×5 up/down sort triangles (#B9BBBE) after the header label. */
  sortable?: boolean;
  /** `expanded` is true while this row's inline panel is open (v2 selected state). */
  render?: (row: T, i: number, expanded?: boolean) => ReactNode;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T, i: number) => string;
  /** If provided, each row gets a leading expand caret that toggles an inline
   *  panel spanning all columns. */
  expandedContent?: (row: T) => ReactNode;
  compact?: boolean;
  /** Explicit vertical cell padding (px) — overrides compact. */
  vPad?: number;
  /** Header band fill (Figma uses #F6F8FA on Overview rank tables, #FAFBFC on 활용 현황). */
  headerBg?: string;
  /** Width of the leading caret column (v2 활용 현황 uses 42). */
  caretWidth?: number;
  /** Per-cell style override — use for the v2 expanded-row tint (#F3F8FD/#F0F7FC). */
  rowStyle?: (row: T, i: number, expanded: boolean) => CSSProperties | undefined;
  /** Style for the expanded panel cell (bg/padding). */
  panelStyle?: CSSProperties;
  emptyText?: string;
}

/** Static stacked sort triangles from the Figma header spec (5×5 each, #B9BBBE). */
function SortGlyphs() {
  return (
    <svg width={5} height={10} viewBox="0 0 5 10" aria-hidden style={{ marginLeft: 4, flexShrink: 0 }}>
      <path d="M2.5 0L5 4H0L2.5 0Z" fill="#B9BBBE" />
      <path d="M2.5 10L0 6H5L2.5 10Z" fill="#B9BBBE" />
    </svg>
  );
}

/** Workhorse table: typed columns, optional inline-expandable rows. */
export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  expandedContent,
  compact = false,
  vPad: vPadProp,
  headerBg = color.cardBgAlt,
  caretWidth = 40,
  rowStyle,
  panelStyle,
  emptyText = 'No data',
}: DataTableProps<T>) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const expandable = !!expandedContent;
  const vPad = vPadProp ?? (compact ? 6 : 10);
  // +1 leading column for the caret when expandable.
  const colSpan = columns.length + (expandable ? 1 : 0);

  const cellBase = {
    padding: `${vPad}px 10px`,
    ...text.body,
    color: color.textPrimary,
    verticalAlign: 'middle' as const,
  };

  const headBase = {
    ...text.label,
    color: color.textTertiary,
    padding: `${vPad}px 10px`,
    background: headerBg,
    borderTop: `1px solid ${color.border}`,
    borderBottom: `1px solid ${color.border}`,
  };

  return (
    <table
      style={{
        width: '100%',
        borderCollapse: 'collapse',
        tableLayout: 'auto',
      }}
    >
      <thead>
        <tr>
          {expandable && <th style={{ ...headBase, width: caretWidth }} />}
          {columns.map((c) => (
            <th
              key={c.key}
              style={{
                ...headBase,
                width: c.width,
                textAlign: c.align ?? 'left',
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                {c.header}
                {c.sortable && <SortGlyphs />}
              </span>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td
              colSpan={colSpan}
              style={{
                ...cellBase,
                textAlign: 'center',
                color: color.textTertiary,
                padding: `${vPad + 14}px 10px`,
              }}
            >
              {emptyText}
            </td>
          </tr>
        ) : (
          rows.map((row, i) => {
            const key = rowKey(row, i);
            const isOpen = !!expanded[key];
            const override = rowStyle?.(row, i, isOpen);
            return (
              <Fragment key={key}>
                <tr
                  className="gd-row"
                  style={expandable ? { cursor: 'pointer' } : undefined}
                  onClick={
                    expandable
                      ? () =>
                          setExpanded((p) => ({ ...p, [key]: !p[key] }))
                      : undefined
                  }
                >
                  {expandable && (
                    <td
                      style={{
                        ...cellBase,
                        borderBottom: `1px solid ${color.border}`,
                        width: caretWidth,
                        textAlign: 'center',
                        ...override,
                      }}
                    >
                      <span
                        aria-hidden
                        style={{
                          display: 'inline-flex',
                          color: color.textSecondary,
                          transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                          transition: 'transform 120ms ease',
                          lineHeight: 0,
                        }}
                      >
                        <ChevronRightIcon size={14} />
                      </span>
                    </td>
                  )}
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      style={{
                        ...cellBase,
                        textAlign: c.align ?? 'left',
                        borderBottom: `1px solid ${color.border}`,
                        ...override,
                      }}
                    >
                      {c.render
                        ? c.render(row, i, isOpen)
                        : (row as Record<string, ReactNode>)[c.key]}
                    </td>
                  ))}
                </tr>
                {expandable && isOpen && (
                  <tr>
                    <td
                      colSpan={colSpan}
                      style={{
                        padding: `${space.lg}px 10px`,
                        background: color.cardBgAlt,
                        borderBottom: `1px solid ${color.border}`,
                        ...panelStyle,
                      }}
                    >
                      {expandedContent(row)}
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })
        )}
      </tbody>
    </table>
  );
}
