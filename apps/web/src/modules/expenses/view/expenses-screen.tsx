'use client';

import { useState, useMemo, useTransition } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { localeTag, DEFAULT_EXPENSE_CATEGORIES, type IExpenseListItem } from '@telebot/contracts';
import { useLocale } from '@/shared/providers/locale-provider';
import { DataPanel, DataTable, type DataTableColumn } from '@/shared/ui/data-table';
import { WorkspaceHeader } from '@/shared/ui/workspace-header';
import { usePeriodFilter } from '@/shared/hooks/use-period-filter';
import { PeriodFilterToolbar } from '@/shared/ui/period-filter-toolbar';
import { TrendSummaryStrip } from '@/shared/ui/trend-summary-strip';
import {
  expensesQueryKeys,
  useDeleteExpenseMutation,
  useExpensesQuery,
  useUpdateExpenseMutation,
} from '../api/expenses-query';
import { useCategoriesQuery } from '@/modules/settings/api/categories-query';

export function ExpensesScreen() {
  const queryClient = useQueryClient();
  const { locale, t } = useLocale();
  const periodFilter = usePeriodFilter('month');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{
    category: string;
    note: string;
    amount: string;
    paymentMethod: string;
    occurredAt: string;
  }>({
    category: '',
    note: '',
    amount: '',
    paymentMethod: '',
    occurredAt: '',
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const expenses = useExpensesQuery();
  const categoriesQuery = useCategoriesQuery('expense');
  const updateMutation = useUpdateExpenseMutation();
  const deleteMutation = useDeleteExpenseMutation();

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: expensesQueryKeys.list() });
    void queryClient.invalidateQueries({ queryKey: ['categories'] });
  };

  const rawList = useMemo(() => expenses.data ?? [], [expenses.data]);
  const configuredCategories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);

  const categorySuggestions = useMemo(() => {
    const set = new Set<string>();
    configuredCategories.forEach((c) => set.add(c.name));
    rawList.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    DEFAULT_EXPENSE_CATEGORIES.forEach((cat) => set.add(cat));
    return Array.from(set).sort();
  }, [configuredCategories, rawList]);

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

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      startTransition(() => {
        setToastMessage(null);
      });
    }, 3000);
  };

  const handleStartEdit = (item: IExpenseListItem) => {
    setEditingId(item.id);
    setEditDraft({
      category: item.category,
      note: item.note || '',
      amount: String(item.amount),
      paymentMethod: item.paymentMethod || '',
      occurredAt: item.occurredAt ? item.occurredAt.slice(0, 16) : '',
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditDraft({
      category: '',
      note: '',
      amount: '',
      paymentMethod: '',
      occurredAt: '',
    });
  };

  const handleSaveEdit = async (id: string) => {
    const trimmedCategory = editDraft.category.trim();
    const parsedAmount = Number(editDraft.amount);
    if (!trimmedCategory || Number.isNaN(parsedAmount) || parsedAmount <= 0) return;

    try {
      await updateMutation.mutateAsync({
        id,
        data: {
          category: trimmedCategory,
          note: editDraft.note.trim() || undefined,
          amount: parsedAmount,
          paymentMethod: editDraft.paymentMethod.trim() || undefined,
          occurredAt: editDraft.occurredAt
            ? new Date(editDraft.occurredAt).toISOString()
            : undefined,
        },
      });
      setEditingId(null);
      showToast(t('expenses.inlineEdit.saved'));
    } catch {
      // Error handled by mutation
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('expenses.delete.confirm'))) return;
    try {
      await deleteMutation.mutateAsync(id);
      showToast(t('expenses.delete.success'));
    } catch {
      // Error handled by mutation
    }
  };

  const expenseColumns: DataTableColumn<IExpenseListItem>[] = [
    {
      id: 'category',
      header: t('dashboard.columns.category'),
      minWidth: '160px',
      hideable: false,
      cell: (item) => {
        if (editingId === item.id) {
          return (
            <input
              type="text"
              list="expense-categories-autocomplete"
              className="table-inline-input"
              value={editDraft.category}
              onChange={(e) => setEditDraft((prev) => ({ ...prev, category: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleSaveEdit(item.id);
                if (e.key === 'Escape') handleCancelEdit();
              }}
              placeholder={t('expenses.placeholder.category')}
              autoFocus
              required
              aria-label={t('dashboard.columns.category')}
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
      minWidth: '180px',
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
              placeholder={t('expenses.placeholder.note')}
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
              placeholder={t('expenses.placeholder.amount')}
              style={{ textAlign: 'right' }}
              required
              aria-label={t('dashboard.columns.amount')}
            />
          );
        }
        const pct = Math.min(Math.round((item.amount / maxExpenseAmount) * 100), 100);
        return (
          <div className="amount-cell" onDoubleClick={() => handleStartEdit(item)}>
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
      cell: (item) => {
        if (editingId === item.id) {
          return (
            <input
              type="text"
              className="table-inline-input"
              value={editDraft.paymentMethod}
              onChange={(e) => setEditDraft((prev) => ({ ...prev, paymentMethod: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleSaveEdit(item.id);
                if (e.key === 'Escape') handleCancelEdit();
              }}
              placeholder={t('expenses.placeholder.paymentMethod')}
              aria-label={t('expenses.columns.paymentMethod')}
            />
          );
        }
        return (
          <span className="badge" onDoubleClick={() => handleStartEdit(item)}>
            {item.paymentMethod || t('common.notSet')}
          </span>
        );
      },
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
                  !Number(editDraft.amount)
                }
                title={t('expenses.actions.save')}
              >
                ✓ {t('expenses.actions.save')}
              </button>
              <button
                type="button"
                className="table-inline-action-btn table-inline-action-btn--cancel"
                onClick={handleCancelEdit}
                disabled={updateMutation.isPending}
                title={t('expenses.actions.cancel')}
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
              title={t('expenses.actions.edit')}
            >
              ✎ {t('expenses.actions.edit')}
            </button>
            <button
              type="button"
              className="table-inline-action-btn table-inline-action-btn--cancel"
              onClick={() => void handleDelete(item.id)}
              disabled={deleteMutation.isPending}
              title={t('expenses.actions.delete')}
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
        title={t('expenses.title')}
        subtitle={t('expenses.subtitle')}
        onRefresh={refresh}
      />

      <datalist id="expense-categories-autocomplete">
        {categorySuggestions.map((cat) => (
          <option key={cat} value={cat} />
        ))}
      </datalist>

      {toastMessage && (
        <div className="toast-notification" role="status" aria-live="polite">
          {toastMessage}
        </div>
      )}

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
