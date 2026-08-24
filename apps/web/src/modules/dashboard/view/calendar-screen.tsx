'use client';

import { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { localeTag } from '@telebot/contracts';
import { useLocale } from '@/shared/providers/locale-provider';
import { DataPanel, DataTable, type DataTableColumn } from '@/shared/ui/data-table';
import { WorkspaceHeader } from '@/shared/ui/workspace-header';
import { dashboardQueryKeys, useDashboardQuery } from '../api/dashboard-query';

type CalendarItem = NonNullable<ReturnType<typeof useDashboardQuery>['data']>['calendar'][number];

export function CalendarScreen() {
  const queryClient = useQueryClient();
  const { locale, t } = useLocale();
  const [search, setSearch] = useState('');
  const dashboard = useDashboardQuery();

  const refresh = () =>
    void queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.detail() });

  const rawList = useMemo(() => dashboard.data?.calendar ?? [], [dashboard.data]);
  const isGoogleConnected = dashboard.data?.user.googleConnected;

  const filteredCalendar = useMemo(() => {
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

  const calendarColumns: DataTableColumn<CalendarItem>[] = [
    {
      id: 'title',
      header: t('dashboard.columns.title'),
      minWidth: '180px',
      hideable: false,
      cell: (item) => <span className="cell-primary">{item.title}</span>,
    },
    {
      id: 'startAt',
      header: t('dashboard.columns.date'),
      align: 'right',
      minWidth: '150px',
      cell: (item) => <span className="cell-muted">{date(item.startAt)}</span>,
    },
  ];

  return (
    <>
      <WorkspaceHeader
        title={t('calendar.title')}
        subtitle={t('calendar.subtitle')}
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
            title={t('dashboard.calendar')}
            description={isGoogleConnected ? undefined : t('dashboard.connectGoogleTip')}
            counter={t('table.rowsCount', { count: filteredCalendar.length })}
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
              id="calendar"
              ariaLabel={t('dashboard.calendar')}
              rows={filteredCalendar}
              loading={dashboard.isLoading}
              emptyMessage={t('dashboard.noCalendar')}
              columns={calendarColumns}
              getRowKey={(item) => item.id}
            />
          </DataPanel>
        </section>
      )}
    </>
  );
}
