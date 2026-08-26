'use client';

import { useState, useMemo, useTransition } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_EXPENSE_CATEGORIES,
  type TransactionType,
} from '@telebot/contracts';
import { useLocale } from '@/shared/providers/locale-provider';
import { DataPanel } from '@/shared/ui/data-table';
import {
  TransactionsTable,
  type TransactionEditDraft,
  type TransactionTableItem,
} from './transactions-table';
import { usePeriodFilter } from '@/shared/hooks/use-period-filter';
import { PeriodFilterToolbar } from '@/shared/ui/period-filter-toolbar';
import { TrendSummaryStrip } from '@/shared/ui/trend-summary-strip';
import { useDashboardQuery } from '../api/dashboard-query';
import { useCategoriesQuery } from '@/modules/settings/api/categories-query';
import { usePlacesQuery } from '../api/places-query';
import {
  useDeleteTransactionMutation,
  useUpdateTransactionMutation,
} from '../api/transactions-query';

type FilterType = 'all' | TransactionType;

export function TransactionsScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useLocale();

  const periodFilter = usePeriodFilter('month');

  const currentTypeParam = searchParams.get('type');
  const activeFilter: FilterType =
    currentTypeParam === 'income' || currentTypeParam === 'expense' ? currentTypeParam : 'all';

  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<TransactionEditDraft>({
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

  const periodTransactions = useMemo(() => {
    return rawList.filter((item) => periodFilter.isItemInPeriod(item.occurredAt));
  }, [rawList, periodFilter]);

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

  const handleStartEdit = (item: TransactionTableItem) => {
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

  return (
    <>
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-4 right-4 z-50 rounded bg-slate-900 px-3 py-2 text-xs text-white shadow-lg dark:bg-slate-100 dark:text-slate-900"
        >
          {toastMessage}
        </div>
      )}

      {dashboard.isLoading ? (
        <div className="p-4 text-xs text-slate-500">{t('common.loadingDashboard')}</div>
      ) : (
        <section className="flex flex-col gap-3" aria-label={t('transactions.title')}>
          <PeriodFilterToolbar filter={periodFilter} />

          <TrendSummaryStrip
            buckets={periodBuckets}
            income={periodIncome}
            expense={periodExpense}
          />

          <DataPanel
            title={t('transactions.title')}
            counter={t('table.rowsCount', { count: filteredTransactions.length })}
            toolbar={
              <div className="flex flex-wrap items-center gap-1.5 max-[640px]:w-full max-[640px]:flex-col max-[640px]:items-stretch">
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
            <TransactionsTable
              id="transactions"
              ariaLabel={t('transactions.title')}
              transactions={filteredTransactions}
              loading={dashboard.isLoading}
              emptyMessage={t('dashboard.noTransactions')}
              maxAmount={maxAmount}
              editingId={editingId}
              editDraft={editDraft}
              onChangeEditDraft={setEditDraft}
              onStartEdit={handleStartEdit}
              onCancelEdit={handleCancelEdit}
              onSaveEdit={handleSaveEdit}
              onDelete={handleDelete}
              categorySuggestions={categorySuggestions}
              placeSuggestions={placeSuggestions}
              isPending={updateMutation.isPending}
            />
          </DataPanel>
        </section>
      )}
    </>
  );
}
