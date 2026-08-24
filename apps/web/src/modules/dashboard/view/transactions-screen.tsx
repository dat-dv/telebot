'use client';

import { useState, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { localeTag, type TransactionType } from '@telebot/contracts';
import { useLocale } from '@/shared/providers/locale-provider';
import { DataPanel, DataTable, type DataTableColumn } from '@/shared/ui/data-table';
import { WorkspaceHeader } from '@/shared/ui/workspace-header';
import { usePeriodFilter } from '@/shared/hooks/use-period-filter';
import { PeriodFilterToolbar } from '@/shared/ui/period-filter-toolbar';
import { TrendSummaryStrip } from '@/shared/ui/trend-summary-strip';
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

  const periodFilter = usePeriodFilter('month');

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

  // Filter by period first
  const periodTransactions = useMemo(() => {
    return rawList.filter((item) => periodFilter.isItemInPeriod(item.occurredAt));
  }, [rawList, periodFilter]);

  // Aggregate metrics for selected period
  const { periodIncome, periodExpense, periodBuckets } = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const item of periodTransactions) {
      if (item.type === 'income') {
        income += item.amount;
      } else {
        expense += item.amount;
      }
    }
    const buckets = periodFilter.generateBuckets(periodTransactions);
    return {
      periodIncome: income,
      periodExpense: expense,
      periodBuckets: buckets,
    };
  }, [periodTransactions, periodFilter]);

  // Filter by type & search text
  const filteredTransactions = useMemo(() => {
    return periodTransactions.filter((item) => {
      if (activeFilter !== 'all' && item.type !== activeFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return item.category.toLowerCase().includes(q) || item.note.toLowerCase().includes(q);
    });
  }, [periodTransactions, activeFilter, search]);

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

  const maxAmount = useMemo(() => {
    return Math.max(...periodTransactions.map((t) => t.amount), 1);
  }, [periodTransactions]);

  const transactionColumns: DataTableColumn<TransactionItem>[] = [
    {
      id: 'type',
      header: t('dashboard.columns.direction'),
      minWidth: '80px',
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
      minWidth: '150px',
      hideable: false,
      cell: (item) => <span className="cell-primary">{item.category}</span>,
    },
    {
      id: 'note',
      header: t('dashboard.columns.note'),
      minWidth: '160px',
      cell: (item) => <span className="cell-muted">{item.note || '—'}</span>,
    },
    {
      id: 'amount',
      header: t('dashboard.columns.amount'),
      align: 'right',
      minWidth: '130px',
      hideable: false,
      cell: (item) => {
        const pct = Math.min(Math.round((item.amount / maxAmount) * 100), 100);
        return (
          <div className="amount-cell">
            <strong className={item.type === 'income' ? 'text-positive' : 'text-warning'}>
              {item.type === 'income' ? '+' : '-'} {money(item.amount)}
            </strong>
            <div className="amount-cell__bar-track">
              <div
                className={`amount-cell__bar-fill ${item.type === 'income' ? 'bg-positive' : 'bg-warning'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      id: 'occurredAt',
      header: t('dashboard.columns.date'),
      align: 'right',
      minWidth: '130px',
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

      <PeriodFilterToolbar filter={periodFilter} />

      <TrendSummaryStrip income={periodIncome} expense={periodExpense} buckets={periodBuckets} />

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
              id="transactions"
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
