'use client';

import { useState, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { localeTag, type TransactionType } from '@telebot/contracts';
import { useLocale } from '@/shared/providers/locale-provider';
import { DataPanel, DataTable, type DataTableColumn } from '@/shared/ui/data-table';
import { WorkspaceHeader } from '@/shared/ui/workspace-header';
import { dashboardQueryKeys, useDashboardQuery } from '../api/dashboard-query';

type FilterType = 'all' | TransactionType;
type TransactionItem = NonNullable<
  ReturnType<typeof useDashboardQuery>['data']
>['transactions'][number];

export function TransactionsScreen() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { locale, t } = useLocale();

  const currentTypeParam = searchParams.get('type');
  const activeFilter: FilterType =
    currentTypeParam === 'income' || currentTypeParam === 'expense' ? currentTypeParam : 'all';

  const [search, setSearch] = useState('');
  const dashboard = useDashboardQuery();

  const refresh = () =>
    void queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.detail() });

  const setFilter = (type: FilterType) => {
    const params = new URLSearchParams(searchParams.toString());
    if (type === 'all') {
      params.delete('type');
    } else {
      params.set('type', type);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  const rawList = useMemo(() => dashboard.data?.transactions ?? [], [dashboard.data]);
  const finance = dashboard.data?.finance;

  const filteredTransactions = useMemo(() => {
    return rawList.filter((item) => {
      if (activeFilter !== 'all' && item.type !== activeFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return item.category.toLowerCase().includes(q) || item.note.toLowerCase().includes(q);
    });
  }, [rawList, activeFilter, search]);

  const money = (value: number) =>
    new Intl.NumberFormat(localeTag(locale), {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value);

  const date = (value: string) =>
    new Intl.DateTimeFormat(localeTag(locale), {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(value));

  const transactionColumns: DataTableColumn<TransactionItem>[] = [
    {
      id: 'type',
      header: t('dashboard.columns.direction'),
      cell: (item) => (
        <span
          className={`badge ${item.type === 'income' ? 'badge--receivable' : 'badge--payable'}`}
        >
          {item.type === 'income' ? t('table.filter.income') : t('table.filter.expense')}
        </span>
      ),
    },
    {
      id: 'category',
      header: t('dashboard.columns.category'),
      cell: (item) => <span className="cell-primary">{item.category}</span>,
    },
    {
      id: 'note',
      header: t('dashboard.columns.note'),
      cell: (item) => <span className="cell-muted">{item.note || '—'}</span>,
    },
    {
      id: 'amount',
      header: t('dashboard.columns.amount'),
      align: 'right',
      cell: (item) => (
        <strong className={item.type === 'income' ? 'text-positive' : 'text-warning'}>
          {item.type === 'income' ? '+' : '-'} {money(item.amount)}
        </strong>
      ),
    },
    {
      id: 'occurredAt',
      header: t('dashboard.columns.date'),
      align: 'right',
      cell: (item) => <span className="cell-muted">{date(item.occurredAt)}</span>,
    },
  ];

  return (
    <>
      <WorkspaceHeader
        title={t('transactions.title')}
        subtitle={t('transactions.subtitle')}
        onRefresh={refresh}
      />

      {finance && (
        <section className="metric-grid" aria-label={t('transactions.title')}>
          <article className="metric metric--positive">
            <span>{t('dashboard.incomeTotal')}</span>
            <strong>{money(finance.income)}</strong>
          </article>
          <article className="metric metric--warning">
            <span>{t('dashboard.expenseTotal')}</span>
            <strong>{money(finance.expense)}</strong>
          </article>
          <article
            className={`metric ${finance.balance >= 0 ? 'metric--positive' : 'metric--negative'}`}
          >
            <span>{t('dashboard.balance')}</span>
            <strong>{money(finance.balance)}</strong>
          </article>
        </section>
      )}

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
            title={t('transactions.title')}
            counter={t('table.rowsCount', { count: filteredTransactions.length })}
            toolbar={
              <>
                <button
                  type="button"
                  className={`filter-pill ${activeFilter === 'all' ? 'is-active' : ''}`}
                  onClick={() => setFilter('all')}
                >
                  {t('table.filter.all')}
                </button>
                <button
                  type="button"
                  className={`filter-pill ${activeFilter === 'income' ? 'is-active' : ''}`}
                  onClick={() => setFilter('income')}
                >
                  {t('table.filter.income')}
                </button>
                <button
                  type="button"
                  className={`filter-pill ${activeFilter === 'expense' ? 'is-active' : ''}`}
                  onClick={() => setFilter('expense')}
                >
                  {t('table.filter.expense')}
                </button>
                <input
                  type="search"
                  className="table-search-input"
                  placeholder={t('table.searchPlaceholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label={t('table.searchPlaceholder')}
                />
              </>
            }
          >
            <DataTable
              ariaLabel={t('transactions.title')}
              rows={filteredTransactions}
              loading={dashboard.isLoading}
              emptyMessage={t('dashboard.noTransactions')}
              columns={transactionColumns}
              getRowKey={(item) => item.id}
            />
          </DataPanel>
        </section>
      )}
    </>
  );
}
