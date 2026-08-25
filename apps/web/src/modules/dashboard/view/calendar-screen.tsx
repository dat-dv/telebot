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
      minWidth: '200px',
      hideable: false,
      cell: (item) => {
        if (editingId === item.id) {
          return (
            <input
              type="text"
              className="table-inline-input"
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
            className="cell-primary"
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
              className="table-inline-input"
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
            className="cell-muted"
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
              className="table-inline-input"
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
            className="cell-muted calendar-description-cell"
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
              className="table-inline-input"
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
          <span className="cell-muted" onDoubleClick={() => handleStartEdit(item)}>
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
              className="table-inline-input"
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
          <span className="cell-muted" onDoubleClick={() => handleStartEdit(item)}>
            {item.endAt ? date(item.endAt) : '—'}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: t('dashboard.columns.action'),
      align: 'right',
      minWidth: '110px',
      hideable: false,
      cell: (item) => {
        const isEditing = editingId === item.id;
        if (isEditing) {
          return (
            <div className="table-inline-actions">
              <button
                type="button"
                className="table-inline-action-btn table-inline-action-btn--save"
                onClick={() => void handleSaveEdit(item.id)}
                disabled={updateMutation.isPending || !editDraft.summary.trim()}
                title={t('calendar.actions.save')}
              >
                ✓ {t('calendar.actions.save')}
              </button>
              <button
                type="button"
                className="table-inline-action-btn table-inline-action-btn--cancel"
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
          <div className="table-inline-actions">
            <button
              type="button"
              className="table-inline-action-btn"
              onClick={() => handleStartEdit(item)}
              title={t('calendar.actions.edit')}
            >
              ✎ {t('calendar.actions.edit')}
            </button>
            <button
              type="button"
              className="table-inline-action-btn table-inline-action-btn--cancel"
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
        <div className="toast-notification" role="status" aria-live="polite">
          {toastMessage}
        </div>
      )}

      {isError ? (
        <section className="inline-alert" role="alert">
          <strong>{t('dashboard.error.title')}</strong>
          <button type="button" onClick={refresh}>
            {t('common.retry')}
          </button>
        </section>
      ) : (
        <section className="content-grid content-grid--wide">
          <DataPanel
            title={t('dashboard.calendar')}
            description={isGoogleConnected ? undefined : t('dashboard.connectGoogleTip')}
            counter={t('table.rowsCount', { count: filteredCalendar.length })}
            toolbar={
              <div className="calendar-toolbar-controls">
                {/* Month Navigation */}
                <div className="calendar-nav-group">
                  <button
                    type="button"
                    className="button button--quiet"
                    onClick={handlePrevMonth}
                    title={t('calendar.nav.prev')}
                    aria-label={t('calendar.nav.prev')}
                  >
                    ◀
                  </button>
                  <span className="calendar-nav-month-title">{formattedMonthYear}</span>
                  <button
                    type="button"
                    className="button button--quiet"
                    onClick={handleNextMonth}
                    title={t('calendar.nav.next')}
                    aria-label={t('calendar.nav.next')}
                  >
                    ▶
                  </button>
                  <button
                    type="button"
                    className="button"
                    onClick={handleToday}
                    title={t('calendar.nav.today')}
                  >
                    {t('calendar.nav.today')}
                  </button>
                </div>

                {/* View Mode Toggle & Search */}
                <div className="calendar-view-toggle-group">
                  <div className="filter-pill-group" role="tablist">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={viewMode === 'grid'}
                      className={`filter-pill ${viewMode === 'grid' ? 'filter-pill--active' : ''}`}
                      onClick={() => setViewMode('grid')}
                    >
                      ⊞ {t('calendar.view.grid')}
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={viewMode === 'table'}
                      className={`filter-pill ${viewMode === 'table' ? 'filter-pill--active' : ''}`}
                      onClick={() => setViewMode('table')}
                    >
                      ☰ {t('calendar.view.table')}
                    </button>
                  </div>

                  <input
                    type="search"
                    className="table-search-input"
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
