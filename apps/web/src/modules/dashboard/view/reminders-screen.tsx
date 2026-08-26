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
              className="h-6 min-h-6 w-full rounded-[2px] border border-sky-600 bg-white px-1.5 text-[11.5px] text-slate-900 shadow-[0_0_0_1px_rgba(2,132,199,0.2)] outline-none focus:border-sky-700 dark:border-sky-400 dark:bg-slate-950 dark:text-slate-100"
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
      id: 'notifyType',
      header: t('reminders.columns.notifyType'),
      minWidth: '120px',
      cell: (item) => {
        if (editingId === item.id) {
          return (
            <select
              className="h-6 min-h-6 w-full rounded-[2px] border border-sky-600 bg-white px-1.5 text-[11.5px] text-slate-900 shadow-[0_0_0_1px_rgba(2,132,199,0.2)] outline-none focus:border-sky-700 dark:border-sky-400 dark:bg-slate-950 dark:text-slate-100"
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
          <span
            className="inline-flex cursor-pointer items-center rounded-[2px] border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 select-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            onDoubleClick={() => handleStartEdit(item)}
          >
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
              className="h-6 min-h-6 w-full rounded-[2px] border border-sky-600 bg-white px-1.5 text-[11.5px] text-slate-900 shadow-[0_0_0_1px_rgba(2,132,199,0.2)] outline-none focus:border-sky-700 dark:border-sky-400 dark:bg-slate-950 dark:text-slate-100"
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
          <span
            className="cursor-pointer text-[11.5px] text-slate-500 select-none dark:text-slate-400"
            onDoubleClick={() => handleStartEdit(item)}
          >
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
              className="h-6 min-h-6 w-full rounded-[2px] border border-sky-600 bg-white px-1.5 text-[11.5px] text-slate-900 shadow-[0_0_0_1px_rgba(2,132,199,0.2)] outline-none focus:border-sky-700 dark:border-sky-400 dark:bg-slate-950 dark:text-slate-100"
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
          <span
            className="cursor-pointer text-[11.5px] text-slate-500 select-none dark:text-slate-400"
            onDoubleClick={() => handleStartEdit(item)}
          >
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
      minWidth: '150px',
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
                disabled={updateMutation.isPending || !editDraft.title.trim()}
                title={t('reminders.actions.save')}
              >
                ✓ {t('reminders.actions.save')}
              </button>
              <button
                type="button"
                className="inline-flex h-[22px] min-h-[22px] shrink-0 cursor-pointer items-center rounded-[2px] border border-slate-300 bg-slate-100 px-1.5 text-[11px] font-medium text-slate-700 whitespace-nowrap transition-colors hover:bg-slate-200 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100"
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
          <div className="flex flex-nowrap items-center justify-end gap-1 whitespace-nowrap">
            <button
              type="button"
              className="inline-flex h-[22px] min-h-[22px] shrink-0 cursor-pointer items-center rounded-[2px] border border-slate-300 bg-slate-100 px-1.5 text-[11px] font-medium text-slate-700 whitespace-nowrap transition-colors hover:bg-slate-200 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100"
              onClick={() => handleStartEdit(item)}
              title={t('reminders.actions.edit')}
            >
              ✎ {t('reminders.actions.edit')}
            </button>
            <button
              type="button"
              className="inline-flex h-[22px] min-h-[22px] shrink-0 cursor-pointer items-center rounded-[2px] border border-slate-300 bg-slate-100 px-1.5 text-[11px] font-medium text-slate-700 whitespace-nowrap transition-colors hover:bg-slate-200 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100"
              onClick={() => void handleSnooze(item)}
              disabled={updateMutation.isPending}
              title={t('reminders.actions.snooze')}
            >
              ⏳
            </button>
            <button
              type="button"
              className="inline-flex h-[22px] min-h-[22px] shrink-0 cursor-pointer items-center rounded-[2px] border border-slate-300 bg-slate-100 px-1.5 text-[11px] font-medium text-slate-700 whitespace-nowrap transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-rose-900 dark:hover:bg-rose-950/50 dark:hover:text-rose-400"
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
            title={t('dashboard.reminders')}
            counter={t('table.rowsCount', { count: filteredReminders.length })}
            toolbar={
              <input
                type="search"
                className="h-6 min-h-6 w-44 rounded-[3px] border border-slate-300 bg-white px-2 text-[11.5px] text-slate-900 outline-none focus:border-sky-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-sky-500 max-[640px]:w-full"
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
