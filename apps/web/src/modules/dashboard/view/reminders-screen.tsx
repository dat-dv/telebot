'use client';

import { useState, useMemo, useTransition } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  localeTag,
  type IReminderListItem,
  type ReminderNotifyType,
  type ReminderRepeatType,
} from '@telebot/contracts';
import { useLocale } from '@/shared/providers/locale-provider';
import { DataPanel, DataTable, type DataTableColumn } from '@/shared/ui/data-table';
import { WorkspaceHeader } from '@/shared/ui/workspace-header';
import {
  remindersQueryKeys,
  useDeleteReminderMutation,
  useRemindersQuery,
  useUpdateReminderMutation,
} from '@/modules/reminders/api/reminders-query';
import { dashboardQueryKeys, useDashboardQuery } from '../api/dashboard-query';

export function RemindersScreen() {
  const queryClient = useQueryClient();
  const { locale, t } = useLocale();
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{
    title: string;
    remindAt: string;
    notifyType: ReminderNotifyType;
    repeatType: ReminderRepeatType;
  }>({
    title: '',
    remindAt: '',
    notifyType: 'text',
    repeatType: 'none',
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const dashboard = useDashboardQuery();
  const remindersQuery = useRemindersQuery();
  const updateMutation = useUpdateReminderMutation();
  const deleteMutation = useDeleteReminderMutation();

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: remindersQueryKeys.list() });
    void queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.detail() });
  };

  const rawList = useMemo(() => {
    if (remindersQuery.data && remindersQuery.data.length > 0) {
      return remindersQuery.data;
    }
    return dashboard.data?.reminders ?? [];
  }, [remindersQuery.data, dashboard.data?.reminders]);

  const filteredReminders = useMemo(() => {
    if (!search.trim()) return rawList;
    const q = search.toLowerCase();
    return rawList.filter((item) => item.title.toLowerCase().includes(q));
  }, [rawList, search]);

  const date = (value?: string) =>
    value
      ? new Intl.DateTimeFormat(localeTag(locale), {
          dateStyle: 'short',
          timeStyle: 'short',
        }).format(new Date(value))
      : t('common.notSet');

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      startTransition(() => {
        setToastMessage(null);
      });
    }, 3000);
  };

  const handleStartEdit = (item: IReminderListItem) => {
    setEditingId(item.id);
    setEditDraft({
      title: item.title,
      remindAt: item.remindAt ? item.remindAt.slice(0, 16) : '',
      notifyType: item.notifyType || 'text',
      repeatType: item.repeatType || 'none',
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditDraft({
      title: '',
      remindAt: '',
      notifyType: 'text',
      repeatType: 'none',
    });
  };

  const handleSaveEdit = async (id: string) => {
    const trimmedTitle = editDraft.title.trim();
    if (!trimmedTitle) return;

    try {
      await updateMutation.mutateAsync({
        id,
        data: {
          title: trimmedTitle,
          remindAt: editDraft.remindAt ? new Date(editDraft.remindAt).toISOString() : undefined,
          notifyType: editDraft.notifyType,
          repeatType: editDraft.repeatType,
        },
      });
      setEditingId(null);
      showToast(t('reminders.inlineEdit.saved'));
    } catch {
      // Error handled by mutation
    }
  };

  const handleSnooze = async (item: IReminderListItem) => {
    try {
      const nextTime = new Date(new Date(item.remindAt).getTime() + 15 * 60 * 1000).toISOString();
      await updateMutation.mutateAsync({
        id: item.id,
        data: {
          remindAt: nextTime,
        },
      });
      showToast(t('reminders.snooze.success'));
    } catch {
      // Error handled by mutation
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('reminders.delete.confirm'))) return;
    try {
      await deleteMutation.mutateAsync(id);
      showToast(t('reminders.delete.success'));
    } catch {
      // Error handled by mutation
    }
  };

  const reminderColumns: DataTableColumn<IReminderListItem>[] = [
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
              value={editDraft.title}
              onChange={(e) => setEditDraft((prev) => ({ ...prev, title: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleSaveEdit(item.id);
                if (e.key === 'Escape') handleCancelEdit();
              }}
              placeholder={t('reminders.placeholder.title')}
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
      id: 'notifyType',
      header: t('reminders.columns.notifyType'),
      minWidth: '120px',
      cell: (item) => {
        if (editingId === item.id) {
          return (
            <select
              className="table-inline-input"
              value={editDraft.notifyType}
              onChange={(e) =>
                setEditDraft((prev) => ({
                  ...prev,
                  notifyType: e.target.value as ReminderNotifyType,
                }))
              }
              aria-label={t('reminders.columns.notifyType')}
            >
              <option value="text">{t('reminders.notifyType.text')}</option>
              <option value="call">{t('reminders.notifyType.call')}</option>
            </select>
          );
        }
        return (
          <span className="badge" onDoubleClick={() => handleStartEdit(item)}>
            {item.notifyType === 'call'
              ? `📞 ${t('reminders.notifyType.call')}`
              : `💬 ${t('reminders.notifyType.text')}`}
          </span>
        );
      },
    },
    {
      id: 'remindAt',
      header: t('dashboard.columns.schedule'),
      align: 'right',
      minWidth: '150px',
      cell: (item) => {
        if (editingId === item.id) {
          return (
            <input
              type="datetime-local"
              className="table-inline-input"
              value={editDraft.remindAt}
              onChange={(e) => setEditDraft((prev) => ({ ...prev, remindAt: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleSaveEdit(item.id);
                if (e.key === 'Escape') handleCancelEdit();
              }}
              aria-label={t('dashboard.columns.schedule')}
            />
          );
        }
        return (
          <span className="cell-muted" onDoubleClick={() => handleStartEdit(item)}>
            {date(item.remindAt)}
          </span>
        );
      },
    },
    {
      id: 'repeatType',
      header: t('reminders.columns.repeatType'),
      minWidth: '120px',
      defaultHidden: false,
      cell: (item) => {
        if (editingId === item.id) {
          return (
            <select
              className="table-inline-input"
              value={editDraft.repeatType}
              onChange={(e) =>
                setEditDraft((prev) => ({
                  ...prev,
                  repeatType: e.target.value as ReminderRepeatType,
                }))
              }
              aria-label={t('reminders.columns.repeatType')}
            >
              <option value="none">{t('reminders.repeatType.none')}</option>
              <option value="daily">{t('reminders.repeatType.daily')}</option>
              <option value="weekly">{t('reminders.repeatType.weekly')}</option>
            </select>
          );
        }
        return (
          <span className="cell-muted" onDoubleClick={() => handleStartEdit(item)}>
            {item.repeatType === 'daily'
              ? t('reminders.repeatType.daily')
              : item.repeatType === 'weekly'
                ? t('reminders.repeatType.weekly')
                : t('reminders.repeatType.none')}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: t('dashboard.columns.action'),
      align: 'right',
      minWidth: '140px',
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
                disabled={updateMutation.isPending || !editDraft.title.trim()}
                title={t('reminders.actions.save')}
              >
                ✓ {t('reminders.actions.save')}
              </button>
              <button
                type="button"
                className="table-inline-action-btn table-inline-action-btn--cancel"
                onClick={handleCancelEdit}
                disabled={updateMutation.isPending}
                title={t('reminders.actions.cancel')}
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
              title={t('reminders.actions.edit')}
            >
              ✎ {t('reminders.actions.edit')}
            </button>
            <button
              type="button"
              className="table-inline-action-btn"
              onClick={() => void handleSnooze(item)}
              disabled={updateMutation.isPending}
              title={t('reminders.actions.snooze')}
            >
              ⏳
            </button>
            <button
              type="button"
              className="table-inline-action-btn table-inline-action-btn--cancel"
              onClick={() => void handleDelete(item.id)}
              disabled={deleteMutation.isPending}
              title={t('reminders.actions.delete')}
            >
              🗑
            </button>
          </div>
        );
      },
    },
  ];

  const isLoading = dashboard.isLoading || remindersQuery.isLoading;
  const isError = dashboard.isError && remindersQuery.isError;

  return (
    <>
      <WorkspaceHeader
        title={t('reminders.title')}
        subtitle={t('reminders.subtitle')}
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
            title={t('dashboard.reminders')}
            counter={t('table.rowsCount', { count: filteredReminders.length })}
            toolbar={
              <input
                type="search"
                className="table-search-input"
                placeholder={t('table.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label={t('table.searchPlaceholder')}
              />
            }
          >
            <DataTable
              id="reminders"
              ariaLabel={t('dashboard.reminders')}
              rows={filteredReminders}
              loading={isLoading}
              emptyMessage={t('dashboard.noReminders')}
              columns={reminderColumns}
              getRowKey={(item) => item.id}
            />
          </DataPanel>
        </section>
      )}
    </>
  );
}
