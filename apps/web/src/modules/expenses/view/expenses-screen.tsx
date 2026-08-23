'use client';

import { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { localeTag, type IExpenseListItem } from '@telebot/contracts';
import { useLocale } from '@/shared/providers/locale-provider';
import { DataPanel, DataTable, type DataTableColumn } from '@/shared/ui/data-table';
import { WorkspaceHeader } from '@/shared/ui/workspace-header';
import { expensesQueryKeys, useExpensesQuery } from '../api/expenses-query';

export function ExpensesScreen() {
  const queryClient = useQueryClient();
  const { locale, t } = useLocale();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const expenses = useExpensesQuery();

  const refresh = () => void queryClient.invalidateQueries({ queryKey: expensesQueryKeys.list() });

  const rawList = useMemo(() => expenses.data ?? [], [expenses.data]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    rawList.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return Array.from(set).sort();
  }, [rawList]);

  const filteredExpenses = useMemo(() => {
    return rawList.filter((item) => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        item.category.toLowerCase().includes(q) ||
        (item.note && item.note.toLowerCase().includes(q))
      );
    });
  }, [rawList, selectedCategory, search]);

  const totalFilteredAmount = useMemo(
    () => filteredExpenses.reduce((sum, item) => sum + item.amount, 0),
    [filteredExpenses],
  );

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
      cell: (item) => <strong>{money(item.amount)}</strong>,
    },
    {
      id: 'occurredAt',
      header: t('dashboard.columns.date'),
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

      <section className="metric-grid" aria-label={t('expenses.title')}>
        <article className="metric metric--warning">
          <span>{t('dashboard.expenseTotal')}</span>
          <strong>{money(totalFilteredAmount)}</strong>
        </article>
        <article className="metric">
          <span>{t('dashboard.columns.category')}</span>
          <strong>{categories.length}</strong>
        </article>
      </section>

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
