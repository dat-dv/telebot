'use client';

import { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { localeTag } from '@telebot/contracts';
import { useLocale } from '@/shared/providers/locale-provider';
import { DataPanel, DataTable, type DataTableColumn } from '@/shared/ui/data-table';
import { WorkspaceHeader } from '@/shared/ui/workspace-header';
import { dashboardQueryKeys, useDashboardQuery } from '../api/dashboard-query';

type ReminderItem = NonNullable<ReturnType<typeof useDashboardQuery>['data']>['reminders'][number];

export function RemindersScreen() {
  const queryClient = useQueryClient();
  const { locale, t } = useLocale();
  const [search, setSearch] = useState('');
  const dashboard = useDashboardQuery();

  const refresh = () =>
    void queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.detail() });

  const rawList = useMemo(() => dashboard.data?.reminders ?? [], [dashboard.data]);

  const filteredReminders = useMemo(() => {
    if (!search.trim()) return rawList;
    const q = search.toLowerCase();
    return rawList.filter((item) => item.title.toLowerCase().includes(q));
  }, [rawList, search]);

  const date = (value?: string) =>
    value
      ? new Intl.DateTimeFormat(localeTag(locale), {
          dateStyle: 'full',
          timeStyle: 'short',
        }).format(new Date(value))
      : t('common.notSet');

  const reminderColumns: DataTableColumn<ReminderItem>[] = [
    {
      id: 'title',
      header: t('dashboard.columns.title'),
      cell: (item) => <span className="cell-primary">{item.title}</span>,
    },
    {
      id: 'schedule',
      header: t('dashboard.columns.schedule'),
      align: 'right',
      cell: (item) => (
        <span className="cell-muted">
          {item.notifyType === 'call' ? '📞' : '💬'} {date(item.remindAt)}
        </span>
      ),
    },
  ];

  return (
    <>
      <WorkspaceHeader
        title={t('reminders.title')}
        subtitle={t('reminders.subtitle')}
        onRefresh={refresh}
      />

      {dashboard.isError ? (
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
              ariaLabel={t('dashboard.reminders')}
              rows={filteredReminders}
              loading={dashboard.isLoading}
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
