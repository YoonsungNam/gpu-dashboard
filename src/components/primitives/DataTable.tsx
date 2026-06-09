import { Fragment, useState, type ReactNode } from 'react';
import { color, space, text } from '../../tokens';
import { ChevronRightIcon } from '../../icons/FigureIcons';

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  width?: number | string;
  align?: 'left' | 'right' | 'center';
  render?: (row: T, i: number) => ReactNode;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T, i: number) => string;
  /** If provided, each row gets a leading expand caret that toggles an inline
   *  panel spanning all columns. */
  expandedContent?: (row: T) => ReactNode;
  compact?: boolean;
  emptyText?: string;
}

/** Workhorse table: typed columns, optional inline-expandable rows. */
export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  expandedContent,
  compact = false,
  emptyText = 'No data',
}: DataTableProps<T>) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const expandable = !!expandedContent;
  const vPad = compact ? 6 : 10;
  // +1 leading column for the caret when expandable.
  const colSpan = columns.length + (expandable ? 1 : 0);

  const cellBase = {
    padding: `${vPad}px 10px`,
    ...text.body,
    color: color.textPrimary,
    verticalAlign: 'middle' as const,
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
          {expandable && (
            <th
              style={{
                width: 28,
                ...text.label,
                color: color.textTertiary,
                padding: `${vPad}px 10px`,
                borderBottom: `1px solid ${color.border}`,
              }}
            />
          )}
          {columns.map((c) => (
            <th
              key={c.key}
              style={{
                width: c.width,
                textAlign: c.align ?? 'left',
                ...text.label,
                color: color.textTertiary,
                padding: `${vPad}px 10px`,
                borderBottom: `1px solid ${color.border}`,
                whiteSpace: 'nowrap',
              }}
            >
              {c.header}
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
                        width: 28,
                        textAlign: 'center',
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
                      }}
                    >
                      {c.render ? c.render(row, i) : (row as Record<string, ReactNode>)[c.key]}
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
