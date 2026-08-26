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
import { useMoneyFormatter } from '@/shared/providers/money-visibility-provider';
import { DataPanel, DataTable, type DataTableColumn } from '@/shared/ui/data-table';
import { WorkspaceHeader } from '@/shared/ui/workspace-header';
import { usePeriodFilter } from '@/shared/hooks/use-period-filter';
import { PeriodFilterToolbar } from '@/shared/ui/period-filter-toolbar';
import { TrendSummaryStrip } from '@/shared/ui/trend-summary-strip';
import { CategoryAutocomplete } from '@/shared/ui/category-autocomplete';
import { dashboardQueryKeys, useDashboardQuery } from '../api/dashboard-query';
import { useCategoriesQuery } from '@/modules/settings/api/categories-query';
import { usePlacesQuery } from '../api/places-query';
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
    placeName: string;
    occurredAt: string;
  }>({
    type: 'expense',
    category: '',
    note: '',
    amount: '',
    placeName: '',
    occurredAt: '',
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const dashboard = useDashboardQuery();
  const categoriesQuery = useCategoriesQuery();
  const placesQuery = usePlacesQuery();
  const updateMutation = useUpdateTransactionMutation();
  const deleteMutation = useDeleteTransactionMutation();

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.detail() });
    void queryClient.invalidateQueries({ queryKey: ['categories'] });
    void queryClient.invalidateQueries({ queryKey: ['places'] });
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
  const placeSuggestions = useMemo(
    () => (placesQuery.data ?? []).map((place) => place.name),
    [placesQuery.data],
  );

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
      return (
        item.category.toLowerCase().includes(q) ||
        item.note.toLowerCase().includes(q) ||
        item.placeName?.toLowerCase().includes(q)
      );
    });
  }, [periodTransactions, activeFilter, search]);

  const money = useMoneyFormatter();

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
      placeName: item.placeName || '',
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
      placeName: '',
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
          placeId: editDraft.placeName.trim() ? undefined : null,
          placeName: editDraft.placeName.trim() || undefined,
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
              className="h-6 min-h-6 w-full rounded-[2px] border border-sky-600 bg-white px-1 text-[11.5px] text-slate-900 shadow-[0_0_0_1px_rgba(2,132,199,0.2)] outline-none focus:border-sky-700 dark:border-sky-400 dark:bg-slate-950 dark:text-slate-100"
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
            className={`inline-flex cursor-pointer items-center rounded-[2px] border px-1.5 py-0.5 text-[10px] font-semibold select-none ${
              item.type === 'income'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
            }`}
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
            className="cursor-pointer font-semibold text-slate-900 select-none dark:text-slate-100"
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
              className="h-6 min-h-6 w-full rounded-[2px] border border-sky-600 bg-white px-1.5 text-[11.5px] text-slate-900 shadow-[0_0_0_1px_rgba(2,132,199,0.2)] outline-none focus:border-sky-700 dark:border-sky-400 dark:bg-slate-950 dark:text-slate-100"
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
            className="cursor-pointer text-slate-500 select-none dark:text-slate-400"
            onDoubleClick={() => handleStartEdit(item)}
            title={item.note}
          >
            {item.note || '—'}
          </span>
        );
      },
    },
    {
      id: 'place',
      header: t('dashboard.columns.place'),
      minWidth: '170px',
      cell: (item) => {
        if (editingId === item.id) {
          return (
            <CategoryAutocomplete
              ariaLabel={t('dashboard.columns.place')}
              value={editDraft.placeName}
              onChange={(placeName) => setEditDraft((prev) => ({ ...prev, placeName }))}
              onConfirm={() => void handleSaveEdit(item.id)}
              onCancel={handleCancelEdit}
              options={placeSuggestions}
              placeholder={t('transactions.placeholder.place')}
            />
          );
        }
        return (
          <span
            className="cursor-pointer text-slate-500 select-none dark:text-slate-400"
            onDoubleClick={() => handleStartEdit(item)}
            title={item.placeName}
          >
            {item.placeName || '—'}
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
              className="h-6 min-h-6 w-full rounded-[2px] border border-sky-600 bg-white px-1.5 text-right text-[11.5px] text-slate-900 shadow-[0_0_0_1px_rgba(2,132,199,0.2)] outline-none focus:border-sky-700 dark:border-sky-400 dark:bg-slate-950 dark:text-slate-100"
              value={editDraft.amount}
              onChange={(e) => setEditDraft((prev) => ({ ...prev, amount: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleSaveEdit(item.id);
                if (e.key === 'Escape') handleCancelEdit();
              }}
              placeholder={t('transactions.placeholder.amount')}
              min="0"
              required
              aria-label={t('dashboard.columns.amount')}
            />
          );
        }
        const pct = Math.min(Math.round((item.amount / maxAmount) * 100), 100);
        return (
          <div
            className="flex cursor-pointer flex-col items-end gap-1 select-none"
            onDoubleClick={() => handleStartEdit(item)}
          >
            <strong
              className={`tabular-nums ${
                item.type === 'income'
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-amber-700 dark:text-amber-400'
              }`}
            >
              {item.type === 'income' ? '+' : '-'} {money(item.amount)}
            </strong>
            <div className="h-1 w-20 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className={`h-full rounded-full ${
                  item.type === 'income' ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
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
              className="h-6 min-h-6 w-full rounded-[2px] border border-sky-600 bg-white px-1.5 text-[11.5px] text-slate-900 shadow-[0_0_0_1px_rgba(2,132,199,0.2)] outline-none focus:border-sky-700 dark:border-sky-400 dark:bg-slate-950 dark:text-slate-100"
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
          <span
            className="cursor-pointer text-[11.5px] text-slate-500 select-none dark:text-slate-400"
            onDoubleClick={() => handleStartEdit(item)}
          >
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
            <div className="flex items-center justify-end gap-1">
              <button
                type="button"
                className="inline-flex h-[22px] min-h-[22px] cursor-pointer items-center rounded-[2px] border border-slate-900 bg-slate-900 px-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-50 dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
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
                className="inline-flex h-[22px] min-h-[22px] cursor-pointer items-center rounded-[2px] border border-slate-300 bg-slate-100 px-1.5 text-[11px] font-medium text-slate-700 transition-colors hover:bg-slate-200 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100"
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
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              className="inline-flex h-[22px] min-h-[22px] cursor-pointer items-center rounded-[2px] border border-slate-300 bg-slate-100 px-1.5 text-[11px] font-medium text-slate-700 transition-colors hover:bg-slate-200 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100"
              onClick={() => handleStartEdit(item)}
              title={t('transactions.actions.edit')}
            >
              ✎ {t('transactions.actions.edit')}
            </button>
            <button
              type="button"
              className="inline-flex h-[22px] min-h-[22px] cursor-pointer items-center rounded-[2px] border border-slate-300 bg-slate-100 px-1.5 text-[11px] font-medium text-slate-700 transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-rose-900 dark:hover:bg-rose-950/50 dark:hover:text-rose-400"
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
        <div
          className="fixed top-4 left-1/2 z-[1000] -translate-x-1/2 rounded bg-slate-900 px-4 py-2 text-xs font-medium text-white shadow-lg dark:bg-slate-100 dark:text-slate-900"
          role="status"
          aria-live="polite"
        >
          {toastMessage}
        </div>
      )}

      <PeriodFilterToolbar filter={periodFilter} />

      <TrendSummaryStrip income={periodIncome} expense={periodExpense} buckets={periodBuckets} />

      {dashboard.isError ? (
        <section
          className="flex items-center justify-between rounded border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-300"
          role="alert"
        >
          <strong>{t('dashboard.error.title')}</strong>
          <button
            type="button"
            className="cursor-pointer rounded-[2px] bg-rose-600 px-2 py-0.5 text-white hover:bg-rose-700 dark:bg-rose-700 dark:hover:bg-rose-600"
            onClick={refresh}
          >
            {t('common.retry')}
          </button>
        </section>
      ) : (
        <section className="grid gap-3">
          <DataPanel
            title={t('transactions.title')}
            counter={t('table.rowsCount', { count: filteredTransactions.length })}
            toolbar={
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  className={`inline-flex h-6 min-h-6 cursor-pointer items-center rounded-[3px] border px-2 text-[11px] font-medium transition-colors ${
                    activeFilter === 'all'
                      ? 'border-sky-500 bg-sky-50 text-sky-700 dark:border-sky-400 dark:bg-sky-950/50 dark:text-sky-300'
                      : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                  onClick={() => setFilter('all')}
                >
                  {t('table.filter.all')}
                </button>
                <button
                  type="button"
                  className={`inline-flex h-6 min-h-6 cursor-pointer items-center rounded-[3px] border px-2 text-[11px] font-medium transition-colors ${
                    activeFilter === 'income'
                      ? 'border-sky-500 bg-sky-50 text-sky-700 dark:border-sky-400 dark:bg-sky-950/50 dark:text-sky-300'
                      : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                  onClick={() => setFilter('income')}
                >
                  {t('table.filter.income')}
                </button>
                <button
                  type="button"
                  className={`inline-flex h-6 min-h-6 cursor-pointer items-center rounded-[3px] border px-2 text-[11px] font-medium transition-colors ${
                    activeFilter === 'expense'
                      ? 'border-sky-500 bg-sky-50 text-sky-700 dark:border-sky-400 dark:bg-sky-950/50 dark:text-sky-300'
                      : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                  onClick={() => setFilter('expense')}
                >
                  {t('table.filter.expense')}
                </button>
                <input
                  type="search"
                  className="h-6 min-h-6 w-44 rounded-[3px] border border-slate-300 bg-white px-2 text-[11.5px] text-slate-900 outline-none focus:border-sky-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-sky-500 max-[640px]:w-full"
                  placeholder={t('table.searchPlaceholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label={t('table.searchPlaceholder')}
                />
              </div>
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
