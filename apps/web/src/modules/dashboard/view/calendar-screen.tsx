'use client';

import { useState, useMemo, useTransition } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { localeTag, type ICalendarEventItem } from '@telebot/contracts';
import { useLocale } from '@/shared/providers/locale-provider';
import { DataPanel, DataTable, type DataTableColumn } from '@/shared/ui/data-table';
import { WorkspaceHeader } from '@/shared/ui/workspace-header';
import {
  calendarQueryKeys,
  useCalendarEventsQuery,
  useDeleteCalendarEventMutation,
  useUpdateCalendarEventMutation,
} from '@/modules/calendar/api/calendar-query';
import { CalendarGrid } from '@/modules/calendar/view/calendar-grid';
import { getCalendarGridRange } from '@/modules/calendar/model/calendar-date-utils';
import { dashboardQueryKeys, useDashboardQuery } from '../api/dashboard-query';

export function CalendarScreen() {
  const queryClient = useQueryClient();
  const { locale, t } = useLocale();
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [currentMonth, setCurrentMonth] = useState<Date>(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => new Date());
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{
    summary: string;
    location: string;
    description: string;
    startDateTime: string;
    endDateTime: string;
  }>({
    summary: '',
    location: '',
    description: '',
    startDateTime: '',
    endDateTime: '',
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const dashboard = useDashboardQuery();
  const calendarRange = useMemo(() => getCalendarGridRange(currentMonth), [currentMonth]);
  const calendarQuery = useCalendarEventsQuery(calendarRange);
  const updateMutation = useUpdateCalendarEventMutation();
  const deleteMutation = useDeleteCalendarEventMutation();

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: calendarQueryKeys.all() });
    void queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.detail() });
  };

  const rawList = useMemo(() => calendarQuery.data ?? [], [calendarQuery.data]);

  const isGoogleConnected = dashboard.data?.user.googleConnected;

  const filteredCalendar = useMemo(() => {
    if (!search.trim()) return rawList;
    const q = search.toLowerCase();
    return rawList.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.location && item.location.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q)),
    );
  }, [rawList, search]);

  const date = (value?: string) =>
    value
      ? new Intl.DateTimeFormat(localeTag(locale), {
          dateStyle: 'short',
          timeStyle: 'short',
        }).format(new Date(value))
      : t('common.notSet');

  const formattedMonthYear = useMemo(() => {
    return new Intl.DateTimeFormat(localeTag(locale), {
      month: 'long',
      year: 'numeric',
    }).format(currentMonth);
  }, [currentMonth, locale]);

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(today);
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      startTransition(() => {
        setToastMessage(null);
      });
    }, 3000);
  };

  const handleStartEdit = (item: ICalendarEventItem) => {
    setEditingId(item.id);
    setEditDraft({
      summary: item.title,
      location: item.location || '',
      description: item.description || '',
      startDateTime: item.startAt ? item.startAt.slice(0, 16) : '',
      endDateTime: item.endAt ? item.endAt.slice(0, 16) : '',
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditDraft({
      summary: '',
      location: '',
      description: '',
      startDateTime: '',
      endDateTime: '',
    });
  };

  const handleSaveEdit = async (id: string) => {
    const trimmedSummary = editDraft.summary.trim();
    if (!trimmedSummary) return;

    try {
      await updateMutation.mutateAsync({
        id,
        data: {
          summary: trimmedSummary,
          location: editDraft.location.trim() || undefined,
          description: editDraft.description.trim() || undefined,
          startDateTime: editDraft.startDateTime
            ? new Date(editDraft.startDateTime).toISOString()
            : undefined,
          endDateTime: editDraft.endDateTime
            ? new Date(editDraft.endDateTime).toISOString()
            : undefined,
        },
      });
      setEditingId(null);
      showToast(t('calendar.inlineEdit.saved'));
    } catch {
      // Error handled by mutation
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('calendar.delete.confirm'))) return;
    try {
      await deleteMutation.mutateAsync(id);
      showToast(t('calendar.delete.success'));
    } catch {
      // Error handled by mutation
    }
  };

  const calendarColumns: DataTableColumn<ICalendarEventItem>[] = [
    {
      id: 'title',
      header: t('dashboard.columns.title'),
      minWidth: '180px',
      hideable: false,
      cell: (item) => {
        if (editingId === item.id) {
          return (
            <input
              type="text"
              className="h-6 min-h-6 w-full rounded-[2px] border border-sky-600 bg-white px-1.5 text-[11.5px] text-slate-900 shadow-[0_0_0_1px_rgba(2,132,199,0.2)] outline-none focus:border-sky-700 dark:border-sky-400 dark:bg-slate-950 dark:text-slate-100"
              value={editDraft.summary}
              onChange={(e) => setEditDraft((prev) => ({ ...prev, summary: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleSaveEdit(item.id);
                if (e.key === 'Escape') handleCancelEdit();
              }}
              placeholder={t('calendar.placeholder.title')}
              autoFocus
              required
              aria-label={t('dashboard.columns.title')}
            />
          );
        }
        return (
          <span
            className="cursor-pointer font-semibold text-slate-900 select-none dark:text-slate-100"
            onDoubleClick={() => handleStartEdit(item)}
            title={item.title}
          >
            {item.title}
          </span>
        );
      },
    },
    {
      id: 'location',
      header: t('calendar.columns.location'),
      minWidth: '150px',
      cell: (item) => {
        if (editingId === item.id) {
          return (
            <input
              type="text"
              className="h-6 min-h-6 w-full rounded-[2px] border border-sky-600 bg-white px-1.5 text-[11.5px] text-slate-900 shadow-[0_0_0_1px_rgba(2,132,199,0.2)] outline-none focus:border-sky-700 dark:border-sky-400 dark:bg-slate-950 dark:text-slate-100"
              value={editDraft.location}
              onChange={(e) => setEditDraft((prev) => ({ ...prev, location: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleSaveEdit(item.id);
                if (e.key === 'Escape') handleCancelEdit();
              }}
              placeholder={t('calendar.placeholder.location')}
              aria-label={t('calendar.columns.location')}
            />
          );
        }
        return (
          <span
            className="cursor-pointer text-slate-500 select-none dark:text-slate-400"
            onDoubleClick={() => handleStartEdit(item)}
            title={item.location}
          >
            {item.location || '—'}
          </span>
        );
      },
    },
    {
      id: 'description',
      header: t('calendar.columns.description'),
      minWidth: '120px',
      width: '160px',
      defaultHidden: false,
      cell: (item) => {
        if (editingId === item.id) {
          return (
            <input
              type="text"
              className="h-6 min-h-6 w-full rounded-[2px] border border-sky-600 bg-white px-1.5 text-[11.5px] text-slate-900 shadow-[0_0_0_1px_rgba(2,132,199,0.2)] outline-none focus:border-sky-700 dark:border-sky-400 dark:bg-slate-950 dark:text-slate-100"
              value={editDraft.description}
              onChange={(e) => setEditDraft((prev) => ({ ...prev, description: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleSaveEdit(item.id);
                if (e.key === 'Escape') handleCancelEdit();
              }}
              placeholder={t('calendar.placeholder.description')}
              aria-label={t('calendar.columns.description')}
            />
          );
        }
        return (
          <span
            className="block max-w-[200px] cursor-pointer truncate text-slate-500 select-none dark:text-slate-400"
            onDoubleClick={() => handleStartEdit(item)}
            title={item.description}
          >
            {item.description || '—'}
          </span>
        );
      },
    },
    {
      id: 'startAt',
      header: t('dashboard.columns.date'),
      align: 'right',
      minWidth: '140px',
      cell: (item) => {
        if (editingId === item.id) {
          return (
            <input
              type="datetime-local"
              className="h-6 min-h-6 w-full rounded-[2px] border border-sky-600 bg-white px-1.5 text-[11.5px] text-slate-900 shadow-[0_0_0_1px_rgba(2,132,199,0.2)] outline-none focus:border-sky-700 dark:border-sky-400 dark:bg-slate-950 dark:text-slate-100"
              value={editDraft.startDateTime}
              onChange={(e) => setEditDraft((prev) => ({ ...prev, startDateTime: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleSaveEdit(item.id);
                if (e.key === 'Escape') handleCancelEdit();
              }}
              aria-label={t('dashboard.columns.date')}
            />
          );
        }
        return (
          <span
            className="cursor-pointer text-[11.5px] text-slate-500 select-none dark:text-slate-400"
            onDoubleClick={() => handleStartEdit(item)}
          >
            {date(item.startAt)}
          </span>
        );
      },
    },
    {
      id: 'endAt',
      header: t('calendar.columns.endAt'),
      align: 'right',
      minWidth: '140px',
      defaultHidden: false,
      cell: (item) => {
        if (editingId === item.id) {
          return (
            <input
              type="datetime-local"
              className="h-6 min-h-6 w-full rounded-[2px] border border-sky-600 bg-white px-1.5 text-[11.5px] text-slate-900 shadow-[0_0_0_1px_rgba(2,132,199,0.2)] outline-none focus:border-sky-700 dark:border-sky-400 dark:bg-slate-950 dark:text-slate-100"
              value={editDraft.endDateTime}
              onChange={(e) => setEditDraft((prev) => ({ ...prev, endDateTime: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleSaveEdit(item.id);
                if (e.key === 'Escape') handleCancelEdit();
              }}
              aria-label={t('calendar.columns.endAt')}
            />
          );
        }
        return (
          <span
            className="cursor-pointer text-[11.5px] text-slate-500 select-none dark:text-slate-400"
            onDoubleClick={() => handleStartEdit(item)}
          >
            {item.endAt ? date(item.endAt) : '—'}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: t('dashboard.columns.action'),
      align: 'right',
      minWidth: '130px',
      hideable: false,
      cell: (item) => {
        const isEditing = editingId === item.id;
        if (isEditing) {
          return (
            <div className="flex flex-nowrap items-center justify-end gap-1 whitespace-nowrap">
              <button
                type="button"
                className="inline-flex h-[22px] min-h-[22px] shrink-0 cursor-pointer items-center rounded-[2px] border border-slate-900 bg-slate-900 px-1.5 text-[11px] font-semibold text-white whitespace-nowrap transition-colors hover:bg-slate-800 disabled:opacity-50 dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                onClick={() => void handleSaveEdit(item.id)}
                disabled={updateMutation.isPending || !editDraft.summary.trim()}
                title={t('calendar.actions.save')}
              >
                ✓ {t('calendar.actions.save')}
              </button>
              <button
                type="button"
                className="inline-flex h-[22px] min-h-[22px] shrink-0 cursor-pointer items-center rounded-[2px] border border-slate-300 bg-slate-100 px-1.5 text-[11px] font-medium text-slate-700 whitespace-nowrap transition-colors hover:bg-slate-200 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                onClick={handleCancelEdit}
                disabled={updateMutation.isPending}
                title={t('calendar.actions.cancel')}
              >
                ✕
              </button>
            </div>
          );
        }
        return (
          <div className="flex flex-nowrap items-center justify-end gap-1 whitespace-nowrap">
            <button
              type="button"
              className="inline-flex h-[22px] min-h-[22px] shrink-0 cursor-pointer items-center rounded-[2px] border border-slate-300 bg-slate-100 px-1.5 text-[11px] font-medium text-slate-700 whitespace-nowrap transition-colors hover:bg-slate-200 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100"
              onClick={() => handleStartEdit(item)}
              title={t('calendar.actions.edit')}
            >
              ✎ {t('calendar.actions.edit')}
            </button>
            <button
              type="button"
              className="inline-flex h-[22px] min-h-[22px] shrink-0 cursor-pointer items-center rounded-[2px] border border-slate-300 bg-slate-100 px-1.5 text-[11px] font-medium text-slate-700 whitespace-nowrap transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-rose-900 dark:hover:bg-rose-950/50 dark:hover:text-rose-400"
              onClick={() => void handleDelete(item.id)}
              disabled={deleteMutation.isPending}
              title={t('calendar.actions.delete')}
            >
              🗑
            </button>
          </div>
        );
      },
    },
  ];

  const isLoading = dashboard.isLoading || calendarQuery.isLoading;
  const isError = dashboard.isError && calendarQuery.isError;

  return (
    <>
      <WorkspaceHeader
        title={t('calendar.title')}
        subtitle={t('calendar.subtitle')}
        onRefresh={refresh}
      />

      {toastMessage && (
        <div
          className="fixed top-4 left-1/2 z-[1000] -translate-x-1/2 rounded bg-slate-900 px-4 py-2 text-xs font-medium text-white shadow-lg dark:bg-slate-100 dark:text-slate-900"
          role="status"
          aria-live="polite"
        >
          {toastMessage}
        </div>
      )}

      {isError ? (
        <section
          className="flex items-center justify-between rounded border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-300"
          role="alert"
        >
          <strong>{t('dashboard.error.title')}</strong>
          <button
            type="button"
            className="cursor-pointer rounded-[2px] bg-rose-600 px-2 py-0.5 text-white hover:bg-rose-700 dark:bg-rose-700 dark:hover:bg-rose-600"
            onClick={refresh}
          >
            {t('common.retry')}
          </button>
        </section>
      ) : (
        <section className="grid gap-3">
          <DataPanel
            title={t('dashboard.calendar')}
            description={isGoogleConnected ? undefined : t('dashboard.connectGoogleTip')}
            counter={t('table.rowsCount', { count: filteredCalendar.length })}
            toolbar={
              <div className="flex flex-wrap items-center justify-between gap-2 max-[640px]:w-full">
                {/* Month Navigation */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    className="inline-flex h-6 min-h-6 w-6 cursor-pointer items-center justify-center rounded-[3px] border border-slate-300 bg-white text-[11px] text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    onClick={handlePrevMonth}
                    title={t('calendar.nav.prev')}
                    aria-label={t('calendar.nav.prev')}
                  >
                    ◀
                  </button>
                  <span className="min-w-[120px] text-center text-xs font-semibold text-slate-900 capitalize dark:text-slate-100">
                    {formattedMonthYear}
                  </span>
                  <button
                    type="button"
                    className="inline-flex h-6 min-h-6 w-6 cursor-pointer items-center justify-center rounded-[3px] border border-slate-300 bg-white text-[11px] text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    onClick={handleNextMonth}
                    title={t('calendar.nav.next')}
                    aria-label={t('calendar.nav.next')}
                  >
                    ▶
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-6 min-h-6 cursor-pointer items-center justify-center rounded-[3px] border border-slate-300 bg-white px-2 text-[11px] font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    onClick={handleToday}
                    title={t('calendar.nav.today')}
                  >
                    {t('calendar.nav.today')}
                  </button>
                </div>

                {/* View Mode Toggle & Search */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <div
                    className="inline-flex rounded-[3px] border border-slate-300 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-900"
                    role="tablist"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={viewMode === 'grid'}
                      className={`inline-flex h-5 items-center rounded-[2px] px-1.5 text-[11px] font-medium transition-colors ${
                        viewMode === 'grid'
                          ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                          : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                      }`}
                      onClick={() => setViewMode('grid')}
                    >
                      ⊞ {t('calendar.view.grid')}
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={viewMode === 'table'}
                      className={`inline-flex h-5 items-center rounded-[2px] px-1.5 text-[11px] font-medium transition-colors ${
                        viewMode === 'table'
                          ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                          : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                      }`}
                      onClick={() => setViewMode('table')}
                    >
                      ☰ {t('calendar.view.table')}
                    </button>
                  </div>

                  <input
                    type="search"
                    className="h-6 min-h-6 w-44 rounded-[3px] border border-slate-300 bg-white px-2 text-[11.5px] text-slate-900 outline-none focus:border-sky-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-sky-500 max-[640px]:w-full"
                    placeholder={t('table.searchPlaceholder')}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    aria-label={t('table.searchPlaceholder')}
                  />
                </div>
              </div>
            }
          >
            {viewMode === 'grid' ? (
              <CalendarGrid
                events={filteredCalendar}
                currentDate={currentMonth}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                onEdit={handleStartEdit}
                onDelete={handleDelete}
                editingId={editingId}
                editDraft={editDraft}
                onEditDraftChange={setEditDraft}
                onSaveEdit={handleSaveEdit}
                onCancelEdit={handleCancelEdit}
                isSaving={updateMutation.isPending}
                isDeleting={deleteMutation.isPending}
              />
            ) : (
              <DataTable
                id="calendar"
                ariaLabel={t('dashboard.calendar')}
                rows={filteredCalendar}
                loading={isLoading}
                emptyMessage={t('dashboard.noCalendar')}
                columns={calendarColumns}
                getRowKey={(item) => item.id}
              />
            )}
          </DataPanel>
        </section>
      )}
    </>
  );
}
