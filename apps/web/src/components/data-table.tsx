import { type ReactNode } from 'react';

export type DataTableColumn<T> = {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  align?: 'left' | 'right';
  className?: string;
};

type DataTableProps<T> = {
  ariaLabel: string;
  columns: DataTableColumn<T>[];
  rows: T[];
  emptyMessage: string;
  getRowKey?: (row: T, index: number) => string | number;
  loading?: boolean;
};

export function DataPanel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="data-panel" aria-label={title}>
      <header className="data-panel__header">
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
      </header>
      {children}
    </section>
  );
}

export function DataTable<T>({
  ariaLabel,
  columns,
  rows,
  emptyMessage,
  getRowKey = (_, index) => index,
  loading = false,
}: DataTableProps<T>) {
  return (
    <div className="data-table__scroll" aria-busy={loading}>
      <table className="data-table" aria-label={ariaLabel}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.id}
                scope="col"
                className={column.align === 'right' ? 'is-right' : undefined}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 4 }, (_, rowIndex) => (
              <tr key={rowIndex} className="data-table__skeleton-row">
                {columns.map((column) => (
                  <td key={column.id}>
                    <span />
                  </td>
                ))}
              </tr>
            ))
          ) : rows.length > 0 ? (
            rows.map((row, index) => (
              <tr key={getRowKey(row, index)}>
                {columns.map((column) => (
                  <td
                    key={column.id}
                    className={`${column.align === 'right' ? 'is-right' : ''} ${column.className ?? ''}`.trim()}
                  >
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr className="data-table__empty-row">
              <td colSpan={columns.length}>{emptyMessage}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
