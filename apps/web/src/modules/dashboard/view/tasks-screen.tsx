'use client';

import { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { localeTag } from '@telebot/contracts';
import { useLocale } from '@/shared/providers/locale-provider';
import { DataPanel, DataTable, type DataTableColumn } from '@/shared/ui/data-table';
import { WorkspaceHeader } from '@/shared/ui/workspace-header';
import { dashboardQueryKeys, useDashboardQuery } from '../api/dashboard-query';

type TaskItem = NonNullable<ReturnType<typeof useDashboardQuery>['data']>['tasks'][number];

export function TasksScreen() {
  const queryClient = useQueryClient();
  const { locale, t } = useLocale();
  const [search, setSearch] = useState('');
  const dashboard = useDashboardQuery();

  const refresh = () =>
    void queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.detail() });

  const rawList = useMemo(() => dashboard.data?.tasks ?? [], [dashboard.data]);
  const isGoogleConnected = dashboard.data?.user.googleConnected;

  const filteredTasks = useMemo(() => {
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

  const taskColumns: DataTableColumn<TaskItem>[] = [
    {
      id: 'title',
      header: t('dashboard.columns.title'),
      cell: (item) => <span className="cell-primary">{item.title}</span>,
    },
    {
      id: 'dueAt',
      header: t('dashboard.columns.dueDate'),
      align: 'right',
      cell: (item) => <span className="cell-muted">{date(item.dueAt)}</span>,
    },
  ];

  return (
    <>
      <WorkspaceHeader
        title={t('tasks.title')}
        subtitle={t('tasks.subtitle')}
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
            title={t('dashboard.tasks')}
            description={isGoogleConnected ? undefined : t('dashboard.connectGoogleTip')}
            counter={t('table.rowsCount', { count: filteredTasks.length })}
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
              ariaLabel={t('dashboard.tasks')}
              rows={filteredTasks}
              loading={dashboard.isLoading}
              emptyMessage={t('dashboard.noTasks')}
              columns={taskColumns}
              getRowKey={(item) => item.id}
            />
          </DataPanel>
        </section>
      )}
    </>
  );
}
