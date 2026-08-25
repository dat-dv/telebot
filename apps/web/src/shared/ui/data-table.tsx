'use client';

import { useState, useEffect, useRef, useMemo, type ReactNode } from 'react';
import { useLocale } from '@/shared/providers/locale-provider';

type DataTableRow = { id: string };

export type DataTableColumn<T extends DataTableRow> = {
  id: string;
  header: ReactNode;
  label?: string;
  cell: (row: T, index: number) => ReactNode;
  align?: 'left' | 'right';
  className?: string;
  minWidth?: number | string;
  width?: number | string;
  hideable?: boolean;
  defaultHidden?: boolean;
};

type DataTableProps<T extends DataTableRow> = {
  id?: string;
  ariaLabel: string;
  columns: DataTableColumn<T>[];
  rows: T[];
  emptyMessage: string;
  getRowKey?: (row: T, index: number) => string | number;
  loading?: boolean;
  allowColumnToggle?: boolean;
  allowColumnResize?: boolean;
};

export function DataPanel({
  title,
  description,
  toolbar,
  counter,
  children,
}: {
  title: string;
  description?: string;
  toolbar?: ReactNode;
  counter?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="data-panel" aria-label={title}>
      <header className="data-panel__header">
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        {(toolbar || counter) && <div className="data-panel__toolbar">{toolbar}</div>}
      </header>
      {children}
    </section>
  );
}

export function TableColumnSettings<T extends DataTableRow>({
  columns,
  visibleColumnIds,
  onToggleColumn,
  onResetColumns,
  onShowAllColumns,
}: {
  columns: DataTableColumn<T>[];
  visibleColumnIds: string[];
  onToggleColumn: (id: string) => void;
  onResetColumns: () => void;
  onShowAllColumns: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useLocale();

  const hiddenCount = columns.length - visibleColumnIds.length;

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="table-column-settings" ref={containerRef}>
      <button
        type="button"
        className={`table-column-settings__btn ${hiddenCount > 0 ? 'has-hidden' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={t('table.columnSettings')}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        title={t('table.columnSettings')}
      >
        <svg
          className="table-column-settings__icon"
          viewBox="0 0 24 24"
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        <span className="table-column-settings__label">{t('table.columnVisibility')}</span>
        {hiddenCount > 0 && (
          <span className="table-column-settings__badge">
            {t('table.columnsHiddenBadge', { count: hiddenCount })}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="table-column-settings__popover" role="dialog" aria-modal="true">
          <header className="table-column-settings__popover-header">
            <strong>{t('table.columnVisibility')}</strong>
            <span className="table-column-settings__popover-count">
              {t('table.columnsCount', {
                visible: visibleColumnIds.length,
                total: columns.length,
              })}
            </span>
          </header>

          <ul className="table-column-settings__list">
            {columns.map((column) => {
              const isChecked = visibleColumnIds.includes(column.id);
              const isRequired = column.hideable === false;
              const isLastVisible = isChecked && visibleColumnIds.length === 1;
              const isDisabled = isRequired || isLastVisible;

              return (
                <li key={column.id} className="table-column-settings__item">
                  <label className="table-column-settings__checkbox-label">
                    <input
                      type="checkbox"
                      className="table-column-settings__checkbox"
                      checked={isChecked}
                      disabled={isDisabled}
                      onChange={() => onToggleColumn(column.id)}
                    />
                    <span className="table-column-settings__item-name">
                      {column.label ??
                        (typeof column.header === 'string' ? column.header : column.id)}
                    </span>
                    {isRequired && (
                      <span className="table-column-settings__required-tag">
                        {t('table.columnRequired')}
                      </span>
                    )}
                  </label>
                </li>
              );
            })}
          </ul>

          <footer className="table-column-settings__popover-footer">
            <button
              type="button"
              className="table-column-settings__action-btn"
              onClick={onShowAllColumns}
            >
              {t('table.showAllColumns')}
            </button>
            <button
              type="button"
              className="table-column-settings__action-btn"
              onClick={onResetColumns}
            >
              {t('table.resetColumns')}
            </button>
          </footer>
        </div>
      )}
    </div>
  );
}

export function DataTable<T extends DataTableRow>({
  id,
  ariaLabel,
  columns,
  rows,
  emptyMessage,
  getRowKey = (row) => row.id,
  loading = false,
  allowColumnToggle,
  allowColumnResize = Boolean(id),
}: DataTableProps<T>) {
  const { t } = useLocale();
  const isToggleAllowed = allowColumnToggle ?? (Boolean(id) || columns.length > 2);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const hasLoadedColumnWidths = useRef(false);
  const hasChangedColumnWidths = useRef(false);

  const systemColumns = useMemo<DataTableColumn<T>[]>(
    () => [
      {
        id: 'stt',
        header: t('table.ordinal'),
        align: 'right',
        minWidth: 56,
        width: 56,
        hideable: false,
        cell: (_, index) => <span className="cell-muted">{index + 1}</span>,
      },
      {
        id: 'id',
        header: t('table.id'),
        minWidth: 160,
        width: 220,
        hideable: false,
        cell: (row) => <code className="data-table__id">{row.id}</code>,
      },
    ],
    [t],
  );

  const allColumns = useMemo(() => [...systemColumns, ...columns], [columns, systemColumns]);

  const initialColumnIds = useMemo(() => {
    return allColumns.filter((column) => !column.defaultHidden).map((column) => column.id);
  }, [allColumns]);

  const [visibleColumnIds, setVisibleColumnIds] = useState<string[]>(initialColumnIds);

  useEffect(() => {
    if (!allowColumnResize || !id || typeof window === 'undefined') {
      hasLoadedColumnWidths.current = true;
      return;
    }

    try {
      const stored = localStorage.getItem(`telebot:table-widths:${id}`);
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, number>;
        if (parsed && typeof parsed === 'object') {
          setColumnWidths(
            Object.fromEntries(
              Object.entries(parsed).filter(
                ([columnId, width]) =>
                  allColumns.some((column) => column.id === columnId) &&
                  typeof width === 'number' &&
                  Number.isFinite(width) &&
                  width > 0,
              ),
            ),
          );
        }
      }
    } catch {
      // Gracefully ignore storage access errors
    } finally {
      hasLoadedColumnWidths.current = true;
    }
  }, [allColumns, allowColumnResize, id]);

  useEffect(() => {
    if (
      !allowColumnResize ||
      !id ||
      typeof window === 'undefined' ||
      !hasLoadedColumnWidths.current ||
      !hasChangedColumnWidths.current
    ) {
      return;
    }

    try {
      localStorage.setItem(`telebot:table-widths:${id}`, JSON.stringify(columnWidths));
    } catch {
      // Gracefully ignore storage access errors
    }
  }, [allowColumnResize, columnWidths, id]);

  // Synchronize with localStorage
  useEffect(() => {
    if (!id || typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(`telebot:table-columns:${id}`);
      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          const validIds = parsed.filter((columnId) =>
            allColumns.some((column) => column.id === columnId),
          );
          const nonHideableIds = allColumns
            .filter((column) => column.hideable === false)
            .map((column) => column.id);
          const merged = Array.from(new Set([...validIds, ...nonHideableIds]));
          if (merged.length > 0) {
            setVisibleColumnIds(merged);
          }
        }
      }
    } catch {
      // Gracefully ignore storage access errors
    }
  }, [allColumns, id]);

  const saveVisibleColumnIds = (newIds: string[]) => {
    setVisibleColumnIds(newIds);
    if (id && typeof window !== 'undefined') {
      try {
        localStorage.setItem(`telebot:table-columns:${id}`, JSON.stringify(newIds));
      } catch {
        // Gracefully ignore storage write errors
      }
    }
  };

  const handleToggleColumn = (columnId: string) => {
    const isVisible = visibleColumnIds.includes(columnId);
    if (isVisible) {
      const col = allColumns.find((column) => column.id === columnId);
      if (col?.hideable === false) return;
      if (visibleColumnIds.length <= 1) return;
      saveVisibleColumnIds(visibleColumnIds.filter((cid) => cid !== columnId));
    } else {
      saveVisibleColumnIds([...visibleColumnIds, columnId]);
    }
  };

  const handleResetColumns = () => {
    saveVisibleColumnIds(initialColumnIds);
  };

  const handleShowAllColumns = () => {
    saveVisibleColumnIds(allColumns.map((column) => column.id));
  };

  const visibleColumns = useMemo(() => {
    const visibleSet = new Set(visibleColumnIds);
    const filtered = allColumns.filter((column) => visibleSet.has(column.id));
    return filtered.length > 0 ? filtered : allColumns;
  }, [allColumns, visibleColumnIds]);

  const getColumnWidth = (column: DataTableColumn<T>) => columnWidths[column.id] ?? column.width;

  const getMinimumColumnWidth = (column: DataTableColumn<T>) => {
    if (typeof column.minWidth === 'number') return column.minWidth;
    if (typeof column.minWidth === 'string') {
      const parsed = Number.parseFloat(column.minWidth);
      if (Number.isFinite(parsed)) return parsed;
    }
    return 80;
  };

  const handleResizeStart = (
    event: React.PointerEvent<HTMLButtonElement>,
    column: DataTableColumn<T>,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const header = event.currentTarget.parentElement;
    if (!header) return;

    const startX = event.clientX;
    const startWidth = header.getBoundingClientRect().width;
    const minWidth = getMinimumColumnWidth(column);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      hasChangedColumnWidths.current = true;
      setColumnWidths((current) => ({
        ...current,
        [column.id]: Math.max(minWidth, Math.round(startWidth + moveEvent.clientX - startX)),
      }));
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp, { once: true });
  };

  return (
    <div className="data-table-container">
      {isToggleAllowed && (
        <div className="data-table__controls">
          <TableColumnSettings
            columns={allColumns}
            visibleColumnIds={visibleColumnIds}
            onToggleColumn={handleToggleColumn}
            onResetColumns={handleResetColumns}
            onShowAllColumns={handleShowAllColumns}
          />
        </div>
      )}

      <div className="data-table__scroll" aria-busy={loading}>
        <table className="data-table" aria-label={ariaLabel}>
          <colgroup>
            {visibleColumns.map((column) => (
              <col
                key={column.id}
                style={{
                  width: getColumnWidth(column),
                  minWidth: column.minWidth,
                }}
              />
            ))}
          </colgroup>
          <thead>
            <tr>
              {visibleColumns.map((column) => (
                <th
                  key={column.id}
                  scope="col"
                  className={`${column.align === 'right' ? 'is-right' : ''} ${
                    allowColumnResize ? 'data-table__resizable-header' : ''
                  }`.trim()}
                  style={{
                    minWidth: column.minWidth,
                    width: getColumnWidth(column),
                  }}
                >
                  {column.header}
                  {allowColumnResize && (
                    <button
                      type="button"
                      className="data-table__resize-handle"
                      aria-label={`Resize ${typeof column.header === 'string' ? column.header : column.id} column`}
                      onPointerDown={(event) => handleResizeStart(event, column)}
                    />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }, (_, rowIndex) => (
                <tr key={rowIndex} className="data-table__skeleton-row">
                  {visibleColumns.map((column) => (
                    <td key={column.id}>
                      <span />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length > 0 ? (
              rows.map((row, index) => (
                <tr key={getRowKey(row, index)}>
                  {visibleColumns.map((column) => (
                    <td
                      key={column.id}
                      className={`${column.align === 'right' ? 'is-right' : ''} ${column.className ?? ''}`.trim()}
                      style={{
                        minWidth: column.minWidth,
                        width: getColumnWidth(column),
                      }}
                    >
                      {column.cell(row, index)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr className="data-table__empty-row">
                <td colSpan={visibleColumns.length}>{emptyMessage}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
