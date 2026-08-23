'use client';

import { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { localeTag } from '@telebot/contracts';
import { useLocale } from '@/shared/providers/locale-provider';
import { DataPanel, DataTable, type DataTableColumn } from '@/shared/ui/data-table';
import { WorkspaceHeader } from '@/shared/ui/workspace-header';
import { dashboardQueryKeys, useDashboardQuery } from '../api/dashboard-query';

type DashboardData = NonNullable<ReturnType<typeof useDashboardQuery>['data']>;

export function AnalyticsScreen() {
  const queryClient = useQueryClient();
  const { locale, t } = useLocale();
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

  const filteredTx = useMemo(() => {
    if (!rawData?.transactions) return [];
    if (!txSearch.trim()) return rawData.transactions;
    const q = txSearch.toLowerCase();
    return rawData.transactions.filter(
      (item) =>
        item.category.toLowerCase().includes(q) ||
        (item.note && item.note.toLowerCase().includes(q)),
    );
  }, [rawData?.transactions, txSearch]);

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
      cell: (item) => <span className="cell-muted">{item.note || '—'}</span>,
    },
    {
      id: 'amount',
      header: t('dashboard.columns.amount'),
      align: 'right',
      cell: (item) => <strong>{money(item.amount)}</strong>,
    },
  ];

  const debtColumns: DataTableColumn<DashboardData['debts'][number]>[] = [
    {
      id: 'counterparty',
      header: t('dashboard.columns.counterparty'),
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
      cell: (item) => <span className="cell-muted">{date(item.dueAt)}</span>,
    },
    {
      id: 'amount',
      header: t('dashboard.columns.remaining'),
      align: 'right',
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

  return (
    <>
      <WorkspaceHeader
        title={t('analytics.title')}
        subtitle={t('analytics.subtitle')}
        onRefresh={refresh}
      />

      <section className="metric-grid" aria-label={t('analytics.title')}>
        <article className="metric metric--positive">
          <span>{t('dashboard.incomeTotal')}</span>
          <strong>{money(rawData.finance.income)}</strong>
        </article>
        <article className="metric metric--warning">
          <span>{t('dashboard.expenseTotal')}</span>
          <strong>{money(rawData.finance.expense)}</strong>
        </article>
        <article
          className={`metric ${rawData.finance.balance >= 0 ? 'metric--positive' : 'metric--negative'}`}
        >
          <span>{t('dashboard.balance')}</span>
          <strong>{money(rawData.finance.balance)}</strong>
        </article>
        <article
          className={`metric ${rawData.finance.receivable >= rawData.finance.payable ? 'metric--positive' : 'metric--negative'}`}
        >
          <span>{t('dashboard.netDebt')}</span>
          <strong>{money(rawData.finance.receivable - rawData.finance.payable)}</strong>
        </article>
      </section>

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
