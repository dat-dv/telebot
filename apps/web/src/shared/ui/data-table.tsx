'use client';

import { useState, useEffect, useRef, useMemo, type ReactNode } from 'react';
import { useLocale } from '@/shared/providers/locale-provider';

export type DataTableColumn<T> = {
  id: string;
  header: ReactNode;
  label?: string;
  cell: (row: T) => ReactNode;
  align?: 'left' | 'right';
  className?: string;
  minWidth?: number | string;
  width?: number | string;
  hideable?: boolean;
  defaultHidden?: boolean;
};

type DataTableProps<T> = {
  id?: string;
  ariaLabel: string;
  columns: DataTableColumn<T>[];
  rows: T[];
  emptyMessage: string;
  getRowKey?: (row: T, index: number) => string | number;
  loading?: boolean;
  allowColumnToggle?: boolean;
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
        {(toolbar || counter) && (
          <div className="data-panel__toolbar">
            {counter && <span className="data-panel__counter">{counter}</span>}
            {toolbar}
          </div>
        )}
      </header>
      {children}
    </section>
  );
}

export function TableColumnSettings<T>({
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

export function DataTable<T>({
  id,
  ariaLabel,
  columns,
  rows,
  emptyMessage,
  getRowKey = (_, index) => index,
  loading = false,
  allowColumnToggle,
}: DataTableProps<T>) {
  const isToggleAllowed = allowColumnToggle ?? (Boolean(id) || columns.length > 2);

  const initialColumnIds = useMemo(() => {
    return columns.filter((c) => !c.defaultHidden).map((c) => c.id);
  }, [columns]);

  const [visibleColumnIds, setVisibleColumnIds] = useState<string[]>(initialColumnIds);

  // Synchronize with localStorage
  useEffect(() => {
    if (!id || typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(`telebot:table-columns:${id}`);
      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          const validIds = parsed.filter((colId) => columns.some((c) => c.id === colId));
          const nonHideableIds = columns.filter((c) => c.hideable === false).map((c) => c.id);
          const merged = Array.from(new Set([...validIds, ...nonHideableIds]));
          if (merged.length > 0) {
            setVisibleColumnIds(merged);
          }
        }
      }
    } catch {
      // Gracefully ignore storage access errors
    }
  }, [id, columns]);

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
      const col = columns.find((c) => c.id === columnId);
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
    saveVisibleColumnIds(columns.map((c) => c.id));
  };

  const visibleColumns = useMemo(() => {
    const visibleSet = new Set(visibleColumnIds);
    const filtered = columns.filter((c) => visibleSet.has(c.id));
    return filtered.length > 0 ? filtered : columns;
  }, [columns, visibleColumnIds]);

  return (
    <div className="data-table-container">
      {isToggleAllowed && (
        <div className="data-table__controls">
          <TableColumnSettings
            columns={columns}
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
                  width: column.width,
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
                  className={column.align === 'right' ? 'is-right' : undefined}
                  style={{
                    minWidth: column.minWidth,
                    width: column.width,
                  }}
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
                        width: column.width,
                      }}
                    >
                      {column.cell(row)}
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
