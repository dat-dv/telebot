'use client';

import { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { localeTag } from '@telebot/contracts';
import { useLocale } from '@/shared/providers/locale-provider';
import { DataPanel, DataTable, type DataTableColumn } from '@/shared/ui/data-table';
import { WorkspaceHeader } from '@/shared/ui/workspace-header';
import { usePeriodFilter } from '@/shared/hooks/use-period-filter';
import { PeriodFilterToolbar } from '@/shared/ui/period-filter-toolbar';
import { TrendSummaryStrip } from '@/shared/ui/trend-summary-strip';
import { dashboardQueryKeys, useDashboardQuery } from '../api/dashboard-query';

type DashboardData = NonNullable<ReturnType<typeof useDashboardQuery>['data']>;

export function AnalyticsScreen() {
  const queryClient = useQueryClient();
  const { locale, t } = useLocale();
  const periodFilter = usePeriodFilter('month');
  const [txSearch, setTxSearch] = useState('');
  const [debtSearch, setDebtSearch] = useState('');
  const dashboard = useDashboardQuery();

  const refresh = () =>
    void queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.detail() });

  const money = (value: number) =>
    new Intl.NumberFormat(localeTag(locale), {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value);

  const date = (value?: string) =>
    value
      ? new Intl.DateTimeFormat(localeTag(locale), {
          dateStyle: 'short',
          timeStyle: 'short',
        }).format(new Date(value))
      : t('common.notSet');

  const rawData = dashboard.data;

  const rawTransactions = useMemo(() => rawData?.transactions ?? [], [rawData?.transactions]);

  // Filter transactions by period
  const periodTransactions = useMemo(() => {
    return rawTransactions.filter((item) => periodFilter.isItemInPeriod(item.occurredAt));
  }, [rawTransactions, periodFilter]);

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

  const filteredTx = useMemo(() => {
    if (!txSearch.trim()) return periodTransactions;
    const q = txSearch.toLowerCase();
    return periodTransactions.filter(
      (item) =>
        item.category.toLowerCase().includes(q) ||
        (item.note && item.note.toLowerCase().includes(q)),
    );
  }, [periodTransactions, txSearch]);

  const filteredDebts = useMemo(() => {
    if (!rawData?.debts) return [];
    if (!debtSearch.trim()) return rawData.debts;
    const q = debtSearch.toLowerCase();
    return rawData.debts.filter((item) => item.counterparty.toLowerCase().includes(q));
  }, [rawData?.debts, debtSearch]);

  const transactionColumns: DataTableColumn<DashboardData['transactions'][number]>[] = [
    {
      id: 'category',
      header: t('dashboard.columns.transaction'),
      minWidth: '160px',
      hideable: false,
      cell: (item) => (
        <span className="cell-primary">
          <span
            className={`badge ${item.type === 'income' ? 'badge--receivable' : 'badge--payable'}`}
            style={{ marginRight: '6px' }}
          >
            {item.type === 'income' ? t('table.filter.income') : t('table.filter.expense')}
          </span>
          {item.category}
        </span>
      ),
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
      cell: (item) => <strong>{money(item.amount)}</strong>,
    },
  ];

  const debtColumns: DataTableColumn<DashboardData['debts'][number]>[] = [
    {
      id: 'counterparty',
      header: t('dashboard.columns.counterparty'),
      minWidth: '160px',
      hideable: false,
      cell: (item) => (
        <span className="cell-primary">
          <span
            className={`badge ${item.direction === 'receivable' ? 'badge--receivable' : 'badge--payable'}`}
            style={{ marginRight: '6px' }}
          >
            {item.direction === 'receivable'
              ? t('table.filter.receivable')
              : t('table.filter.payable')}
          </span>
          {item.counterparty}
        </span>
      ),
    },
    {
      id: 'dueAt',
      header: t('dashboard.columns.dueDate'),
      minWidth: '110px',
      cell: (item) => <span className="cell-muted">{date(item.dueAt)}</span>,
    },
    {
      id: 'amount',
      header: t('dashboard.columns.remaining'),
      align: 'right',
      minWidth: '130px',
      hideable: false,
      cell: (item) => <strong>{money(item.remainingAmount)}</strong>,
    },
  ];

  if (dashboard.isError) {
    return (
      <div className="center">
        <section className="alert" role="alert">
          <h1>{t('dashboard.error.title')}</h1>
          <p>{t('dashboard.error.desc')}</p>
          <button type="button" onClick={refresh}>
            {t('common.retry')}
          </button>
        </section>
      </div>
    );
  }

  if (dashboard.isLoading || !rawData) {
    return (
      <div aria-busy="true">
        <WorkspaceHeader title={t('analytics.title')} subtitle={t('analytics.subtitle')} />
        <section className="metric-grid skeleton-grid" aria-hidden="true">
          {Array.from({ length: 4 }, (_, i) => (
            <div className="metric" key={i}>
              <span className="skeleton skeleton--label" />
              <strong className="skeleton skeleton--value" />
            </div>
          ))}
        </section>
      </div>
    );
  }

  const netDebt = rawData.finance.receivable - rawData.finance.payable;

  return (
    <>
      <WorkspaceHeader
        title={t('analytics.title')}
        subtitle={t('analytics.subtitle')}
        onRefresh={refresh}
      />

      <PeriodFilterToolbar filter={periodFilter} />

      <TrendSummaryStrip
        income={periodIncome}
        expense={periodExpense}
        buckets={periodBuckets}
        extraMetrics={
          <article className={`metric ${netDebt >= 0 ? 'metric--positive' : 'metric--negative'}`}>
            <span>{t('dashboard.netDebt')}</span>
            <strong>{money(netDebt)}</strong>
          </article>
        }
      />

      {rawData.admin && (
        <section className="admin-strip">
          <strong>{t('dashboard.admin')}</strong>
          <span>{t('dashboard.usersCount', { count: rawData.admin.userCount })}</span>
          <span>
            {t('dashboard.googleConnectedCount', { count: rawData.admin.googleConnectedCount })}
          </span>
        </section>
      )}

      <section className="content-grid content-grid--wide">
        <DataPanel
          title={t('dashboard.transactions')}
          counter={t('table.rowsCount', { count: filteredTx.length })}
          toolbar={
            <input
              type="search"
              className="table-search-input"
              placeholder={t('table.searchPlaceholder')}
              value={txSearch}
              onChange={(e) => setTxSearch(e.target.value)}
              aria-label={t('table.searchPlaceholder')}
            />
          }
        >
          <DataTable
            id="analytics-transactions"
            ariaLabel={t('dashboard.transactions')}
            rows={filteredTx}
            emptyMessage={t('dashboard.noTransactions')}
            columns={transactionColumns}
            getRowKey={(item) => item.id}
          />
        </DataPanel>

        <DataPanel
          title={t('dashboard.openDebts')}
          counter={t('table.rowsCount', { count: filteredDebts.length })}
          toolbar={
            <input
              type="search"
              className="table-search-input"
              placeholder={t('table.searchPlaceholder')}
              value={debtSearch}
              onChange={(e) => setDebtSearch(e.target.value)}
              aria-label={t('table.searchPlaceholder')}
            />
          }
        >
          <DataTable
            id="analytics-debts"
            ariaLabel={t('dashboard.openDebts')}
            rows={filteredDebts}
            emptyMessage={t('dashboard.noDebts')}
            columns={debtColumns}
            getRowKey={(item) => item.id}
          />
        </DataPanel>
      </section>
    </>
  );
}
