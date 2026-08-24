'use client';

import { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { localeTag, type IExpenseListItem } from '@telebot/contracts';
import { useLocale } from '@/shared/providers/locale-provider';
import { DataPanel, DataTable, type DataTableColumn } from '@/shared/ui/data-table';
import { WorkspaceHeader } from '@/shared/ui/workspace-header';
import { usePeriodFilter } from '@/shared/hooks/use-period-filter';
import { PeriodFilterToolbar } from '@/shared/ui/period-filter-toolbar';
import { TrendSummaryStrip } from '@/shared/ui/trend-summary-strip';
import { expensesQueryKeys, useExpensesQuery } from '../api/expenses-query';

export function ExpensesScreen() {
  const queryClient = useQueryClient();
  const { locale, t } = useLocale();
  const periodFilter = usePeriodFilter('month');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const expenses = useExpensesQuery();

  const refresh = () => void queryClient.invalidateQueries({ queryKey: expensesQueryKeys.list() });

  const rawList = useMemo(() => expenses.data ?? [], [expenses.data]);

  // Filter by period first
  const periodExpenses = useMemo(() => {
    return rawList.filter((item) => periodFilter.isItemInPeriod(item.occurredAt));
  }, [rawList, periodFilter]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    periodExpenses.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return Array.from(set).sort();
  }, [periodExpenses]);

  // Filter by category & search
  const filteredExpenses = useMemo(() => {
    return periodExpenses.filter((item) => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        item.category.toLowerCase().includes(q) ||
        (item.note && item.note.toLowerCase().includes(q))
      );
    });
  }, [periodExpenses, selectedCategory, search]);

  const totalPeriodAmount = useMemo(
    () => periodExpenses.reduce((sum, item) => sum + item.amount, 0),
    [periodExpenses],
  );

  const maxExpenseAmount = useMemo(
    () => Math.max(...periodExpenses.map((e) => e.amount), 1),
    [periodExpenses],
  );

  const periodBuckets = useMemo(() => {
    return periodFilter.generateBuckets(
      periodExpenses.map((e) => ({
        occurredAt: e.occurredAt,
        amount: e.amount,
        type: 'expense' as const,
      })),
    );
  }, [periodExpenses, periodFilter]);

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

  const expenseColumns: DataTableColumn<IExpenseListItem>[] = [
    {
      id: 'category',
      header: t('dashboard.columns.category'),
      minWidth: '160px',
      hideable: false,
      cell: (item) => <span className="cell-primary">{item.category}</span>,
    },
    {
      id: 'note',
      header: t('dashboard.columns.note'),
      minWidth: '180px',
      cell: (item) => <span className="cell-muted">{item.note || '—'}</span>,
    },
    {
      id: 'amount',
      header: t('dashboard.columns.amount'),
      align: 'right',
      minWidth: '130px',
      hideable: false,
      cell: (item) => {
        const pct = Math.min(Math.round((item.amount / maxExpenseAmount) * 100), 100);
        return (
          <div className="amount-cell">
            <strong className="text-warning">{money(item.amount)}</strong>
            <div className="amount-cell__bar-track">
              <div className="amount-cell__bar-fill bg-warning" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      },
    },
    {
      id: 'paymentMethod',
      header: t('expenses.columns.paymentMethod'),
      minWidth: '120px',
      cell: (item) => <span className="badge">{item.paymentMethod || t('common.notSet')}</span>,
    },
    {
      id: 'currency',
      header: t('expenses.columns.currency'),
      minWidth: '80px',
      cell: (item) => <span className="badge">{item.currency || 'VND'}</span>,
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
        title={t('expenses.title')}
        subtitle={t('expenses.subtitle')}
        onRefresh={refresh}
      />

      <PeriodFilterToolbar filter={periodFilter} />

      <TrendSummaryStrip
        income={0}
        expense={totalPeriodAmount}
        buckets={periodBuckets}
        extraMetrics={
          <article className="metric">
            <span>{t('dashboard.columns.category')}</span>
            <strong>{categories.length}</strong>
          </article>
        }
      />

      {expenses.isError ? (
        <section className="inline-alert" role="alert">
          <strong>{t('dashboard.error.title')}</strong>
          <button type="button" onClick={refresh}>
            {t('common.retry')}
          </button>
        </section>
      ) : (
        <section className="content-grid content-grid--wide">
          <DataPanel
            title={t('expenses.title')}
            description={t('expenses.subtitle')}
            counter={t('table.rowsCount', { count: filteredExpenses.length })}
            toolbar={
              <>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  aria-label={t('common.allCategories')}
                >
                  <option value="all">{t('common.allCategories')}</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
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
              id="expenses"
              ariaLabel={t('expenses.title')}
              rows={filteredExpenses}
              loading={expenses.isLoading}
              emptyMessage={t('dashboard.noExpenses')}
              columns={expenseColumns}
              getRowKey={(item) => item.id}
            />
          </DataPanel>
        </section>
      )}
    </>
  );
}
