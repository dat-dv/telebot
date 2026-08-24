'use client';

import { useState, useMemo, useTransition } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  localeTag,
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_EXPENSE_CATEGORIES,
  type TransactionType,
} from '@telebot/contracts';
import { useLocale } from '@/shared/providers/locale-provider';
import { DataPanel, DataTable, type DataTableColumn } from '@/shared/ui/data-table';
import { WorkspaceHeader } from '@/shared/ui/workspace-header';
import { usePeriodFilter } from '@/shared/hooks/use-period-filter';
import { PeriodFilterToolbar } from '@/shared/ui/period-filter-toolbar';
import { TrendSummaryStrip } from '@/shared/ui/trend-summary-strip';
import { CategoryAutocomplete } from '@/shared/ui/category-autocomplete';
import { dashboardQueryKeys, useDashboardQuery } from '../api/dashboard-query';
import { useCategoriesQuery } from '@/modules/settings/api/categories-query';
import {
  useDeleteTransactionMutation,
  useUpdateTransactionMutation,
} from '../api/transactions-query';

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{
    type: TransactionType;
    category: string;
    note: string;
    amount: string;
    occurredAt: string;
  }>({
    type: 'expense',
    category: '',
    note: '',
    amount: '',
    occurredAt: '',
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const dashboard = useDashboardQuery();
  const categoriesQuery = useCategoriesQuery();
  const updateMutation = useUpdateTransactionMutation();
  const deleteMutation = useDeleteTransactionMutation();

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.detail() });
    void queryClient.invalidateQueries({ queryKey: ['categories'] });
  };

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
  const configuredCategories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);

  const categorySuggestions = useMemo(() => {
    const set = new Set<string>();
    configuredCategories
      .filter((c) => !editDraft.type || c.type === editDraft.type)
      .forEach((c) => set.add(c.name));
    rawList.forEach((item) => {
      if (item.category && (!editDraft.type || item.type === editDraft.type)) {
        set.add(item.category);
      }
    });
    const defaults =
      editDraft.type === 'income' ? DEFAULT_INCOME_CATEGORIES : DEFAULT_EXPENSE_CATEGORIES;
    defaults.forEach((cat) => set.add(cat));
    return Array.from(set).sort();
  }, [configuredCategories, rawList, editDraft.type]);

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

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      startTransition(() => {
        setToastMessage(null);
      });
    }, 3000);
  };

  const handleStartEdit = (item: TransactionItem) => {
    setEditingId(item.id);
    setEditDraft({
      type: item.type,
      category: item.category,
      note: item.note || '',
      amount: String(item.amount),
      occurredAt: item.occurredAt ? item.occurredAt.slice(0, 16) : '',
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditDraft({
      type: 'expense',
      category: '',
      note: '',
      amount: '',
      occurredAt: '',
    });
  };

  const handleSaveEdit = async (id: string) => {
    const trimmedCategory = editDraft.category.trim();
    const trimmedNote = editDraft.note.trim();
    const parsedAmount = Number(editDraft.amount);

    if (!trimmedCategory || !trimmedNote || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id,
        data: {
          type: editDraft.type,
          category: trimmedCategory,
          note: trimmedNote,
          amount: parsedAmount,
          occurredAt: editDraft.occurredAt
            ? new Date(editDraft.occurredAt).toISOString()
            : undefined,
        },
      });
      setEditingId(null);
      showToast(t('transactions.inlineEdit.saved'));
    } catch {
      // Error handled by mutation
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('transactions.delete.confirm'))) return;
    try {
      await deleteMutation.mutateAsync(id);
      showToast(t('transactions.delete.success'));
    } catch {
      // Error handled by mutation
    }
  };

  const transactionColumns: DataTableColumn<TransactionItem>[] = [
    {
      id: 'type',
      header: t('dashboard.columns.direction'),
      minWidth: '90px',
      cell: (item) => {
        if (editingId === item.id) {
          return (
            <select
              className="table-inline-input"
              value={editDraft.type}
              onChange={(e) =>
                setEditDraft((prev) => ({
                  ...prev,
                  type: e.target.value as TransactionType,
                }))
              }
              aria-label={t('dashboard.columns.direction')}
            >
              <option value="income">{t('table.filter.income')}</option>
              <option value="expense">{t('table.filter.expense')}</option>
            </select>
          );
        }
        return (
          <span
            className={`badge ${item.type === 'income' ? 'badge--receivable' : 'badge--payable'}`}
            onDoubleClick={() => handleStartEdit(item)}
          >
            {item.type === 'income' ? t('table.filter.income') : t('table.filter.expense')}
          </span>
        );
      },
    },
    {
      id: 'category',
      header: t('dashboard.columns.category'),
      minWidth: '150px',
      hideable: false,
      cell: (item) => {
        if (editingId === item.id) {
          return (
            <CategoryAutocomplete
              ariaLabel={t('dashboard.columns.category')}
              autoFocus
              value={editDraft.category}
              onChange={(category) => setEditDraft((prev) => ({ ...prev, category }))}
              onConfirm={() => void handleSaveEdit(item.id)}
              onCancel={handleCancelEdit}
              options={categorySuggestions}
              placeholder={t('transactions.placeholder.category')}
            />
          );
        }
        return (
          <span
            className="cell-primary"
            onDoubleClick={() => handleStartEdit(item)}
            title={item.category}
          >
            {item.category}
          </span>
        );
      },
    },
    {
      id: 'note',
      header: t('dashboard.columns.note'),
      minWidth: '160px',
      cell: (item) => {
        if (editingId === item.id) {
          return (
            <input
              type="text"
              className="table-inline-input"
              value={editDraft.note}
              onChange={(e) => setEditDraft((prev) => ({ ...prev, note: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleSaveEdit(item.id);
                if (e.key === 'Escape') handleCancelEdit();
              }}
              placeholder={t('transactions.placeholder.note')}
              required
              aria-label={t('dashboard.columns.note')}
            />
          );
        }
        return (
          <span
            className="cell-muted"
            onDoubleClick={() => handleStartEdit(item)}
            title={item.note}
          >
            {item.note || '—'}
          </span>
        );
      },
    },
    {
      id: 'amount',
      header: t('dashboard.columns.amount'),
      align: 'right',
      minWidth: '140px',
      hideable: false,
      cell: (item) => {
        if (editingId === item.id) {
          return (
            <input
              type="number"
              className="table-inline-input"
              value={editDraft.amount}
              onChange={(e) => setEditDraft((prev) => ({ ...prev, amount: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleSaveEdit(item.id);
                if (e.key === 'Escape') handleCancelEdit();
              }}
              placeholder={t('transactions.placeholder.amount')}
              style={{ textAlign: 'right' }}
              min="0"
              required
              aria-label={t('dashboard.columns.amount')}
            />
          );
        }
        const pct = Math.min(Math.round((item.amount / maxAmount) * 100), 100);
        return (
          <div className="amount-cell" onDoubleClick={() => handleStartEdit(item)}>
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
      minWidth: '150px',
      cell: (item) => {
        if (editingId === item.id) {
          return (
            <input
              type="datetime-local"
              className="table-inline-input"
              value={editDraft.occurredAt}
              onChange={(e) => setEditDraft((prev) => ({ ...prev, occurredAt: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleSaveEdit(item.id);
                if (e.key === 'Escape') handleCancelEdit();
              }}
              aria-label={t('dashboard.columns.date')}
            />
          );
        }
        return (
          <span className="cell-muted" onDoubleClick={() => handleStartEdit(item)}>
            {date(item.occurredAt)}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: t('dashboard.columns.action'),
      align: 'right',
      minWidth: '110px',
      hideable: false,
      cell: (item) => {
        const isEditing = editingId === item.id;
        if (isEditing) {
          return (
            <div className="table-inline-actions">
              <button
                type="button"
                className="table-inline-action-btn table-inline-action-btn--save"
                onClick={() => void handleSaveEdit(item.id)}
                disabled={
                  updateMutation.isPending ||
                  !editDraft.category.trim() ||
                  !editDraft.note.trim() ||
                  !Number(editDraft.amount)
                }
                title={t('transactions.actions.save')}
              >
                ✓ {t('transactions.actions.save')}
              </button>
              <button
                type="button"
                className="table-inline-action-btn table-inline-action-btn--cancel"
                onClick={handleCancelEdit}
                disabled={updateMutation.isPending}
                title={t('transactions.actions.cancel')}
              >
                ✕
              </button>
            </div>
          );
        }
        return (
          <div className="table-inline-actions">
            <button
              type="button"
              className="table-inline-action-btn"
              onClick={() => handleStartEdit(item)}
              title={t('transactions.actions.edit')}
            >
              ✎ {t('transactions.actions.edit')}
            </button>
            <button
              type="button"
              className="table-inline-action-btn table-inline-action-btn--cancel"
              onClick={() => void handleDelete(item.id)}
              disabled={deleteMutation.isPending}
              title={t('transactions.actions.delete')}
            >
              🗑
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <WorkspaceHeader
        title={t('transactions.title')}
        subtitle={t('transactions.subtitle')}
        onRefresh={refresh}
      />

      {toastMessage && (
        <div className="toast-notification" role="status" aria-live="polite">
          {toastMessage}
        </div>
      )}

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
