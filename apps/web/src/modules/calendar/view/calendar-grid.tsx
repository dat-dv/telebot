'use client';

import { useMemo } from 'react';
import { localeTag, type ICalendarEventItem } from '@telebot/contracts';
import { useLocale } from '@/shared/providers/locale-provider';

interface ICalendarGridProps {
  events: ICalendarEventItem[];
  currentDate: Date;
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  onEdit: (item: ICalendarEventItem) => void;
  onDelete: (id: string) => void;
  editingId: string | null;
  editDraft: {
    summary: string;
    location: string;
    description: string;
    startDateTime: string;
    endDateTime: string;
  };
  onEditDraftChange: (
    updater: (prev: {
      summary: string;
      location: string;
      description: string;
      startDateTime: string;
      endDateTime: string;
    }) => {
      summary: string;
      location: string;
      description: string;
      startDateTime: string;
      endDateTime: string;
    },
  ) => void;
  onSaveEdit: (id: string) => void;
  onCancelEdit: () => void;
  isSaving: boolean;
  isDeleting: boolean;
}

interface ICalendarCell {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  dateKey: string;
  events: ICalendarEventItem[];
}

export function CalendarGrid({
  events,
  currentDate,
  selectedDate,
  onSelectDate,
  onEdit,
  onDelete,
  editingId,
  editDraft,
  onEditDraftChange,
  onSaveEdit,
  onCancelEdit,
  isSaving,
  isDeleting,
}: ICalendarGridProps) {
  const { locale, t } = useLocale();

  const dayHeaders = [
    t('calendar.day.mon'),
    t('calendar.day.tue'),
    t('calendar.day.wed'),
    t('calendar.day.thu'),
    t('calendar.day.fri'),
    t('calendar.day.sat'),
    t('calendar.day.sun'),
  ];

  const toDateKey = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const eventsByDate = useMemo(() => {
    const map = new Map<string, ICalendarEventItem[]>();
    for (const event of events) {
      if (!event.startAt) continue;
      const eventDate = new Date(event.startAt);
      if (Number.isNaN(eventDate.getTime())) continue;
      const key = toDateKey(eventDate);
      const list = map.get(key) || [];
      list.push(event);
      map.set(key, list);
    }
    return map;
  }, [events]);

  const cells = useMemo<ICalendarCell[]>(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const todayKey = toDateKey(new Date());
    const selectedKey = selectedDate ? toDateKey(selectedDate) : null;

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Monday as 0, Sunday as 6
    const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;
    const daysInMonth = lastDayOfMonth.getDate();

    const result: ICalendarCell[] = [];

    // Leading days from previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNumber = prevMonthLastDay - i;
      const date = new Date(year, month - 1, dayNumber);
      const key = toDateKey(date);
      result.push({
        date,
        dayNumber,
        isCurrentMonth: false,
        isToday: key === todayKey,
        isSelected: key === selectedKey,
        dateKey: key,
        events: eventsByDate.get(key) || [],
      });
    }

    // Days in current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const key = toDateKey(date);
      result.push({
        date,
        dayNumber: day,
        isCurrentMonth: true,
        isToday: key === todayKey,
        isSelected: key === selectedKey,
        dateKey: key,
        events: eventsByDate.get(key) || [],
      });
    }

    // Trailing days from next month to complete 35 or 42 grid cells
    const remainingSlots = (7 - (result.length % 7)) % 7;
    for (let i = 1; i <= remainingSlots; i++) {
      const date = new Date(year, month + 1, i);
      const key = toDateKey(date);
      result.push({
        date,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: key === todayKey,
        isSelected: key === selectedKey,
        dateKey: key,
        events: eventsByDate.get(key) || [],
      });
    }

    return result;
  }, [currentDate, selectedDate, eventsByDate]);

  const selectedDayEvents = useMemo(() => {
    if (!selectedDate) return [];
    const key = toDateKey(selectedDate);
    return eventsByDate.get(key) || [];
  }, [selectedDate, eventsByDate]);

  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat(localeTag(locale), {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(d);
  };

  const formatFullDate = (d: Date) => {
    return new Intl.DateTimeFormat(localeTag(locale), {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(d);
  };

  return (
    <div className="calendar-grid-wrapper">
      {/* 7 Day Header */}
      <div className="calendar-grid-header" role="row">
        {dayHeaders.map((header) => (
          <div key={header} className="calendar-grid-header-cell" role="columnheader">
            {header}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="calendar-grid-body" role="grid" aria-label={t('dashboard.calendar')}>
        {cells.map((cell) => {
          const maxVisibleEvents = 2;
          const visibleEvents = cell.events.slice(0, maxVisibleEvents);
          const hiddenCount = cell.events.length - maxVisibleEvents;

          return (
            <button
              type="button"
              key={cell.dateKey}
              className={`calendar-grid-cell ${
                cell.isCurrentMonth ? '' : 'calendar-grid-cell--outside'
              } ${cell.isToday ? 'calendar-grid-cell--today' : ''} ${
                cell.isSelected ? 'calendar-grid-cell--selected' : ''
              }`}
              onClick={() => onSelectDate(cell.date)}
              aria-label={`${cell.dateKey}, ${cell.events.length} ${t('dashboard.calendar')}`}
            >
              <div className="calendar-grid-cell-header">
                <span
                  className={`calendar-grid-day-number ${
                    cell.isToday ? 'calendar-grid-day-number--today' : ''
                  }`}
                >
                  {cell.dayNumber}
                </span>
                {cell.events.length > 0 && (
                  <span
                    className="calendar-grid-event-count"
                    title={t('table.rowsCount', { count: cell.events.length })}
                  >
                    {cell.events.length}
                  </span>
                )}
              </div>

              <div className="calendar-grid-events-list">
                {visibleEvents.map((event) => (
                  <div
                    key={event.id}
                    className="calendar-grid-event-chip"
                    title={`${formatTime(event.startAt)} - ${event.title}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectDate(cell.date);
                    }}
                  >
                    <span className="calendar-grid-event-time">{formatTime(event.startAt)}</span>
                    <span className="calendar-grid-event-title">{event.title}</span>
                  </div>
                ))}
                {hiddenCount > 0 && (
                  <div className="calendar-grid-more-chip">
                    {t('calendar.moreEvents', { count: hiddenCount })}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Day Detail Panel */}
      {selectedDate && (
        <div className="calendar-selected-day-panel">
          <div className="calendar-selected-day-header">
            <h3 className="calendar-selected-day-title">
              {t('calendar.selectedDayEvents', { date: formatFullDate(selectedDate) })}
            </h3>
            <span className="calendar-selected-day-badge">
              {t('table.rowsCount', { count: selectedDayEvents.length })}
            </span>
          </div>

          {selectedDayEvents.length === 0 ? (
            <div className="calendar-selected-day-empty">
              <p>{t('calendar.noEventsOnDay')}</p>
            </div>
          ) : (
            <div className="calendar-selected-day-events">
              {selectedDayEvents.map((event) => {
                const isEditing = editingId === event.id;

                if (isEditing) {
                  return (
                    <div
                      key={event.id}
                      className="calendar-event-card calendar-event-card--editing"
                    >
                      <div className="calendar-edit-form">
                        <div className="form-group">
                          <input
                            type="text"
                            className="table-inline-input"
                            value={editDraft.summary}
                            onChange={(e) =>
                              onEditDraftChange((prev) => ({ ...prev, summary: e.target.value }))
                            }
                            placeholder={t('calendar.placeholder.title')}
                            autoFocus
                            required
                            aria-label={t('calendar.placeholder.title')}
                          />
                        </div>

                        <div className="form-row-2">
                          <input
                            type="datetime-local"
                            className="table-inline-input"
                            value={editDraft.startDateTime}
                            onChange={(e) =>
                              onEditDraftChange((prev) => ({
                                ...prev,
                                startDateTime: e.target.value,
                              }))
                            }
                            aria-label={t('dashboard.columns.date')}
                          />
                          <input
                            type="datetime-local"
                            className="table-inline-input"
                            value={editDraft.endDateTime}
                            onChange={(e) =>
                              onEditDraftChange((prev) => ({
                                ...prev,
                                endDateTime: e.target.value,
                              }))
                            }
                            aria-label={t('calendar.columns.endAt')}
                          />
                        </div>

                        <div className="form-row-2">
                          <input
                            type="text"
                            className="table-inline-input"
                            value={editDraft.location}
                            onChange={(e) =>
                              onEditDraftChange((prev) => ({ ...prev, location: e.target.value }))
                            }
                            placeholder={t('calendar.placeholder.location')}
                            aria-label={t('calendar.placeholder.location')}
                          />
                          <input
                            type="text"
                            className="table-inline-input"
                            value={editDraft.description}
                            onChange={(e) =>
                              onEditDraftChange((prev) => ({
                                ...prev,
                                description: e.target.value,
                              }))
                            }
                            placeholder={t('calendar.placeholder.description')}
                            aria-label={t('calendar.placeholder.description')}
                          />
                        </div>

                        <div className="calendar-edit-actions">
                          <button
                            type="button"
                            className="button button--primary"
                            onClick={() => onSaveEdit(event.id)}
                            disabled={isSaving || !editDraft.summary.trim()}
                          >
                            ✓ {t('calendar.actions.save')}
                          </button>
                          <button
                            type="button"
                            className="button"
                            onClick={onCancelEdit}
                            disabled={isSaving}
                          >
                            ✕ {t('calendar.actions.cancel')}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={event.id} className="calendar-event-card">
                    <div className="calendar-event-card-main">
                      <div className="calendar-event-card-time-pill">
                        ⏰ {formatTime(event.startAt)}
                        {event.endAt ? ` − ${formatTime(event.endAt)}` : ''}
                      </div>
                      <h4 className="calendar-event-card-title">{event.title}</h4>
                      {event.location && (
                        <p className="calendar-event-card-meta">📍 {event.location}</p>
                      )}
                      {event.description && (
                        <p className="calendar-event-card-desc">{event.description}</p>
                      )}
                    </div>

                    <div className="calendar-event-card-actions">
                      <button
                        type="button"
                        className="table-inline-action-btn"
                        onClick={() => onEdit(event)}
                        title={t('calendar.actions.edit')}
                      >
                        ✎ {t('calendar.actions.edit')}
                      </button>
                      <button
                        type="button"
                        className="table-inline-action-btn table-inline-action-btn--cancel"
                        onClick={() => onDelete(event.id)}
                        disabled={isDeleting}
                        title={t('calendar.actions.delete')}
                      >
                        🗑 {t('calendar.actions.delete')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
