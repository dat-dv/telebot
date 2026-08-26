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

const occurrenceTimeFields = [
  'occurredAt',
  'paymentDate',
  'remindAt',
  'startAt',
  'dueAt',
  'createdAt',
] as const;

const upcomingTimeFields = new Set(['remindAt', 'startAt', 'dueAt']);

function getOccurrenceTime(row: DataTableRow): { timestamp: number; ascending: boolean } | null {
  const values = row as Record<string, unknown>;
  for (const field of occurrenceTimeFields) {
    const value = values[field];
    if (typeof value !== 'string' || !value) continue;
    const timestamp = new Date(value).getTime();
    if (!Number.isNaN(timestamp)) return { timestamp, ascending: upcomingTimeFields.has(field) };
  }
  return null;
}

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
    <section
      className="flex min-w-0 flex-col overflow-hidden rounded border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
      aria-label={title}
    >
      <header className="flex min-h-10 flex-wrap items-center justify-between gap-2.5 border-b border-slate-200 bg-slate-50 px-3 py-1.5 dark:border-slate-800 dark:bg-slate-950/60 max-[640px]:flex-col max-[640px]:items-stretch max-[640px]:gap-2">
        <div className="flex min-w-0 flex-col">
          <h2 className="m-0 text-[13px] font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h2>
          {description && (
            <p className="m-0 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
              {description}
            </p>
          )}
        </div>
        {(toolbar || counter) && (
          <div className="flex flex-wrap items-center gap-1.5 max-[640px]:w-full max-[640px]:justify-between">
            {toolbar}
          </div>
        )}
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
    <div className="relative inline-flex" ref={containerRef}>
      <button
        type="button"
        className={`inline-flex h-6 min-h-6 items-center gap-1.5 rounded-[3px] border px-2 text-[11px] font-medium transition-colors ${
          hiddenCount > 0
            ? 'border-sky-500 text-sky-600 hover:bg-sky-50 dark:border-sky-400 dark:text-sky-400 dark:hover:bg-sky-950/50'
            : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-100'
        }`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={t('table.columnSettings')}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        title={t('table.columnSettings')}
      >
        <svg
          className="size-3.5 shrink-0"
          viewBox="0 0 24 24"
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
        <span>{t('table.columnVisibility')}</span>
        {hiddenCount > 0 && (
          <span className="rounded-[2px] bg-sky-100 px-1 text-[10px] font-semibold leading-3.5 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
            {t('table.columnsHiddenBadge', { count: hiddenCount })}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-[calc(100%+4px)] z-50 flex min-w-[200px] max-w-[calc(100vw-32px)] flex-col rounded border border-slate-300 bg-white py-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-900"
          role="dialog"
          aria-modal="true"
        >
          <header className="flex items-center justify-between border-b border-slate-100 px-2.5 pb-1.5 text-[11px] dark:border-slate-800">
            <strong className="font-semibold text-slate-900 dark:text-slate-100">
              {t('table.columnVisibility')}
            </strong>
            <span className="tabular-nums text-slate-500 dark:text-slate-400">
              {t('table.columnsCount', {
                visible: visibleColumnIds.length,
                total: columns.length,
              })}
            </span>
          </header>

          <ul className="m-0 flex max-h-[220px] list-none flex-col overflow-y-auto p-1">
            {columns.map((column) => {
              const isChecked = visibleColumnIds.includes(column.id);
              const isRequired = column.hideable === false;
              const isLastVisible = isChecked && visibleColumnIds.length === 1;
              const isDisabled = isRequired || isLastVisible;

              return (
                <li key={column.id} className="flex">
                  <label className="flex w-full cursor-pointer items-center gap-2 px-2.5 py-1 text-[11.5px] text-slate-700 transition-colors hover:bg-slate-50 select-none dark:text-slate-300 dark:hover:bg-slate-800/80">
                    <input
                      type="checkbox"
                      className="cursor-pointer accent-slate-900 dark:accent-sky-500 disabled:cursor-not-allowed"
                      checked={isChecked}
                      disabled={isDisabled}
                      onChange={() => onToggleColumn(column.id)}
                    />
                    <span className="flex-1 text-slate-700 dark:text-slate-300">
                      {column.label ??
                        (typeof column.header === 'string' ? column.header : column.id)}
                    </span>
                    {isRequired && (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        {t('table.columnRequired')}
                      </span>
                    )}
                  </label>
                </li>
              );
            })}
          </ul>

          <footer className="flex items-center justify-between gap-1.5 border-t border-slate-100 px-2.5 pt-1.5 pb-0.5 text-[10.5px] dark:border-slate-800">
            <button
              type="button"
              className="cursor-pointer rounded-[2px] border-0 bg-transparent px-1 py-0.5 text-[10.5px] font-medium text-sky-600 transition-colors hover:bg-sky-50 hover:text-sky-700 dark:text-sky-400 dark:hover:bg-sky-950/60 dark:hover:text-sky-300"
              onClick={onShowAllColumns}
            >
              {t('table.showAllColumns')}
            </button>
            <button
              type="button"
              className="cursor-pointer rounded-[2px] border-0 bg-transparent px-1 py-0.5 text-[10.5px] font-medium text-sky-600 transition-colors hover:bg-sky-50 hover:text-sky-700 dark:text-sky-400 dark:hover:bg-sky-950/60 dark:hover:text-sky-300"
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
        cell: (_, index) => (
          <span className="text-[11.5px] text-slate-500 dark:text-slate-400">{index + 1}</span>
        ),
      },
      {
        id: 'id',
        header: t('table.id'),
        minWidth: 160,
        width: 220,
        hideable: false,
        cell: (row) => (
          <code className="font-mono text-[11px] text-slate-600 whitespace-nowrap dark:text-slate-400">
            {row.id}
          </code>
        ),
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

  const sortedRows = useMemo(() => {
    return rows
      .map((row, index) => ({ row, index, occurrence: getOccurrenceTime(row) }))
      .sort((left, right) => {
        if (!left.occurrence && !right.occurrence) return left.index - right.index;
        if (!left.occurrence) return 1;
        if (!right.occurrence) return -1;
        const direction = left.occurrence.ascending ? 1 : -1;
        return (
          (left.occurrence.timestamp - right.occurrence.timestamp) * direction ||
          left.index - right.index
        );
      })
      .map(({ row }) => row);
  }, [rows]);

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
    <div className="relative flex w-full flex-col">
      {isToggleAllowed && (
        <div className="flex items-center justify-end border-b border-slate-200 bg-slate-50 px-2 py-1 dark:border-slate-800 dark:bg-slate-950/40">
          <TableColumnSettings
            columns={allColumns}
            visibleColumnIds={visibleColumnIds}
            onToggleColumn={handleToggleColumn}
            onResetColumns={handleResetColumns}
            onShowAllColumns={handleShowAllColumns}
          />
        </div>
      )}

      <div className="relative max-h-[520px] w-full min-w-0 overflow-auto" aria-busy={loading}>
        <table
          className="w-full min-w-full border-collapse text-left text-xs max-[640px]:min-w-max"
          aria-label={ariaLabel}
        >
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
                  className={`sticky top-0 z-[2] h-7 border-r border-b border-r-slate-200 border-b-slate-300 bg-slate-100 px-2 text-[10.5px] font-bold tracking-wider text-slate-600 uppercase whitespace-nowrap last:border-r-0 dark:border-r-slate-800 dark:border-b-slate-700 dark:bg-slate-900 dark:text-slate-400 ${
                    column.align === 'right' ? 'text-right' : 'text-left'
                  } ${allowColumnResize ? 'relative' : ''}`.trim()}
                  style={{
                    minWidth: column.minWidth,
                    width: getColumnWidth(column),
                  }}
                >
                  {column.header}
                  {allowColumnResize && (
                    <button
                      type="button"
                      className="group absolute top-0 -right-1 z-[3] h-full w-2 cursor-col-resize touch-none border-0 bg-transparent p-0 after:absolute after:top-1.5 after:left-[3px] after:h-3.5 after:w-0.5 after:bg-sky-600 after:opacity-0 hover:after:opacity-100 focus-visible:after:opacity-100"
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
                <tr key={rowIndex}>
                  {visibleColumns.map((column) => (
                    <td
                      key={column.id}
                      className={`h-8 border-r border-b border-r-slate-50 border-b-slate-100 px-2 py-1 align-middle text-xs tabular-nums text-slate-700 last:border-r-0 dark:border-r-slate-900/60 dark:border-b-slate-800 dark:text-slate-300 ${
                        column.align === 'right' ? 'text-right' : 'text-left'
                      } ${column.className ?? ''}`.trim()}
                      style={{
                        minWidth: column.minWidth,
                        width: getColumnWidth(column),
                      }}
                    >
                      <span
                        className={`block h-2.5 w-3/4 animate-pulse rounded-[2px] bg-slate-200 dark:bg-slate-800 ${
                          column.align === 'right' ? 'ml-auto' : ''
                        }`}
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : sortedRows.length > 0 ? (
              sortedRows.map((row, index) => (
                <tr
                  key={getRowKey(row, index)}
                  className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
                >
                  {visibleColumns.map((column) => (
                    <td
                      key={column.id}
                      className={`h-8 border-r border-b border-r-slate-50 border-b-slate-100 px-2 py-1 align-middle text-xs tabular-nums text-slate-700 last:border-r-0 dark:border-r-slate-900/60 dark:border-b-slate-800 dark:text-slate-300 ${
                        column.align === 'right' ? 'text-right' : 'text-left'
                      } ${column.className ?? ''}`.trim()}
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
              <tr className="h-20 text-center text-slate-400 italic">
                <td colSpan={visibleColumns.length}>{emptyMessage}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
