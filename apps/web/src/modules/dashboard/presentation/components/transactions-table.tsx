'use client';

import { useMemo } from 'react';
import { localeTag, type TransactionType } from '@telebot/contracts';
import { useLocale } from '@/shared/providers/locale-provider';
import { useMoneyFormatter } from '@/shared/providers/money-visibility-provider';
import { DataTable, type DataTableColumn } from '@/shared/ui/data-table';
import { CategoryAutocomplete } from '@/shared/ui/category-autocomplete';

export type TransactionTableItem = {
  id: string;
  type: TransactionType;
  category: string;
  note?: string;
  amount: number;
  runningBalance?: number;
  placeId?: string | null;
  placeName?: string | null;
  occurredAt: string;
  allocations?: Array<{
    id: string;
    amount: number;
    debtId: string;
    note?: string;
  }>;
};

export type TransactionEditDraft = {
  type: TransactionType;
  category: string;
  note: string;
  amount: string;
  placeName: string;
  occurredAt: string;
};

export type TransactionsTableProps = {
  id?: string;
  transactions: TransactionTableItem[];
  ariaLabel?: string;
  emptyMessage?: string;
  loading?: boolean;
  maxAmount?: number;
  editingId?: string | null;
  editDraft?: TransactionEditDraft;
  categorySuggestions?: string[];
  placeSuggestions?: string[];
  onStartEdit?: (item: TransactionTableItem) => void;
  onCancelEdit?: () => void;
  onSaveEdit?: (id: string) => void | Promise<void>;
  onDelete?: (id: string) => void | Promise<void>;
  onOpenAllocate?: (item: TransactionTableItem) => void;
  onChangeEditDraft?: React.Dispatch<React.SetStateAction<TransactionEditDraft>>;
  isPending?: boolean;
};

export function TransactionsTable({
  id = 'transactions-table',
  transactions,
  ariaLabel,
  emptyMessage,
  loading = false,
  maxAmount,
  editingId,
  editDraft,
  categorySuggestions = [],
  placeSuggestions = [],
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onOpenAllocate,
  onChangeEditDraft,
  isPending = false,
}: TransactionsTableProps) {
  const { locale, t } = useLocale();
  const money = useMoneyFormatter();

  const computedMaxAmount = useMemo(() => {
    if (typeof maxAmount === 'number' && maxAmount > 0) return maxAmount;
    return Math.max(...transactions.map((item) => item.amount), 1);
  }, [maxAmount, transactions]);

  const columns = useMemo<DataTableColumn<TransactionTableItem>[]>(() => {
    const hasActions = Boolean(onStartEdit || onSaveEdit || onDelete || onOpenAllocate);
    const date = (value: string) =>
      new Intl.DateTimeFormat(localeTag(locale), {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(new Date(value));

    const list: DataTableColumn<TransactionTableItem>[] = [
      {
        id: 'type',
        header: t('dashboard.columns.direction'),
        minWidth: '90px',
        cell: (item) => {
          if (editingId === item.id && editDraft && onChangeEditDraft) {
            return (
              <select
                className="h-6 min-h-6 w-full rounded-[2px] border border-sky-600 bg-white px-1 text-[11.5px] text-slate-900 shadow-[0_0_0_1px_rgba(2,132,199,0.2)] outline-none focus:border-sky-700 dark:border-sky-400 dark:bg-slate-950 dark:text-slate-100"
                value={editDraft.type}
                onChange={(e) =>
                  onChangeEditDraft((prev) => ({
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
              className={`inline-flex items-center rounded-[2px] border px-1.5 py-0.5 text-[10px] font-semibold select-none ${
                onStartEdit ? 'cursor-pointer' : ''
              } ${
                item.type === 'income'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
              }`}
              onDoubleClick={() => onStartEdit?.(item)}
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
          if (
            editingId === item.id &&
            editDraft &&
            onChangeEditDraft &&
            onSaveEdit &&
            onCancelEdit
          ) {
            return (
              <CategoryAutocomplete
                ariaLabel={t('dashboard.columns.category')}
                autoFocus
                value={editDraft.category}
                onChange={(category) => onChangeEditDraft((prev) => ({ ...prev, category }))}
                onConfirm={() => void onSaveEdit(item.id)}
                onCancel={onCancelEdit}
                options={categorySuggestions}
                placeholder={t('transactions.placeholder.category')}
              />
            );
          }
          return (
            <span
              className={`font-semibold text-slate-900 select-none dark:text-slate-100 ${
                onStartEdit ? 'cursor-pointer' : ''
              }`}
              onDoubleClick={() => onStartEdit?.(item)}
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
          if (
            editingId === item.id &&
            editDraft &&
            onChangeEditDraft &&
            onSaveEdit &&
            onCancelEdit
          ) {
            return (
              <input
                type="text"
                className="h-6 min-h-6 w-full rounded-[2px] border border-sky-600 bg-white px-1.5 text-[11.5px] text-slate-900 shadow-[0_0_0_1px_rgba(2,132,199,0.2)] outline-none focus:border-sky-700 dark:border-sky-400 dark:bg-slate-950 dark:text-slate-100"
                value={editDraft.note}
                onChange={(e) => onChangeEditDraft((prev) => ({ ...prev, note: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void onSaveEdit(item.id);
                  if (e.key === 'Escape') onCancelEdit();
                }}
                placeholder={t('transactions.placeholder.note')}
                required
                aria-label={t('dashboard.columns.note')}
              />
            );
          }
          const allocationCount = item.allocations?.length || 0;
          return (
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={`text-slate-500 select-none dark:text-slate-400 ${
                  onStartEdit ? 'cursor-pointer' : ''
                }`}
                onDoubleClick={() => onStartEdit?.(item)}
                title={item.note || undefined}
              >
                {item.note || '—'}
              </span>
              {allocationCount > 0 && onOpenAllocate && (
                <button
                  type="button"
                  className="inline-flex cursor-pointer items-center gap-1 rounded-[2px] border border-sky-200 bg-sky-50 px-1 py-0.5 text-[10px] font-semibold text-sky-700 transition-colors hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950/60 dark:text-sky-300"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenAllocate(item);
                  }}
                  title={t('transactions.allocation.badgeAllocated', { count: allocationCount })}
                >
                  <span>🔗</span>
                  <span>
                    {t('transactions.allocation.badgeAllocated', { count: allocationCount })}
                  </span>
                </button>
              )}
            </div>
          );
        },
      },
      {
        id: 'place',
        header: t('dashboard.columns.place'),
        minWidth: '170px',
        cell: (item) => {
          if (
            editingId === item.id &&
            editDraft &&
            onChangeEditDraft &&
            onSaveEdit &&
            onCancelEdit
          ) {
            return (
              <CategoryAutocomplete
                ariaLabel={t('dashboard.columns.place')}
                value={editDraft.placeName}
                onChange={(placeName) => onChangeEditDraft((prev) => ({ ...prev, placeName }))}
                onConfirm={() => void onSaveEdit(item.id)}
                onCancel={onCancelEdit}
                options={placeSuggestions}
                placeholder={t('transactions.placeholder.place')}
              />
            );
          }
          return (
            <span
              className={`text-slate-500 select-none dark:text-slate-400 ${
                onStartEdit ? 'cursor-pointer' : ''
              }`}
              onDoubleClick={() => onStartEdit?.(item)}
              title={item.placeName || undefined}
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
          if (
            editingId === item.id &&
            editDraft &&
            onChangeEditDraft &&
            onSaveEdit &&
            onCancelEdit
          ) {
            return (
              <input
                type="number"
                className="h-6 min-h-6 w-full rounded-[2px] border border-sky-600 bg-white px-1.5 text-right text-[11.5px] text-slate-900 shadow-[0_0_0_1px_rgba(2,132,199,0.2)] outline-none focus:border-sky-700 dark:border-sky-400 dark:bg-slate-950 dark:text-slate-100"
                value={editDraft.amount}
                onChange={(e) => onChangeEditDraft((prev) => ({ ...prev, amount: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void onSaveEdit(item.id);
                  if (e.key === 'Escape') onCancelEdit();
                }}
                placeholder={t('transactions.placeholder.amount')}
                min="0"
                required
                aria-label={t('dashboard.columns.amount')}
              />
            );
          }
          const pct = Math.min(Math.round((item.amount / computedMaxAmount) * 100), 100);
          return (
            <div
              className={`flex flex-col items-end gap-1 select-none ${
                onStartEdit ? 'cursor-pointer' : ''
              }`}
              onDoubleClick={() => onStartEdit?.(item)}
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
        id: 'runningBalance',
        header: t('dashboard.columns.runningBalance'),
        align: 'right',
        minWidth: '140px',
        cell: (item) => {
          if (typeof item.runningBalance !== 'number') {
            return <span className="text-slate-400 select-none dark:text-slate-500">—</span>;
          }
          const isPos = item.runningBalance >= 0;
          return (
            <span
              className={`tabular-nums font-semibold select-none ${
                isPos ? 'text-violet-700 dark:text-violet-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {money(item.runningBalance)}
            </span>
          );
        },
      },
      {
        id: 'occurredAt',
        header: t('dashboard.columns.date'),
        align: 'right',
        minWidth: '150px',
        cell: (item) => {
          if (
            editingId === item.id &&
            editDraft &&
            onChangeEditDraft &&
            onSaveEdit &&
            onCancelEdit
          ) {
            return (
              <input
                type="datetime-local"
                className="h-6 min-h-6 w-full rounded-[2px] border border-sky-600 bg-white px-1.5 text-[11.5px] text-slate-900 shadow-[0_0_0_1px_rgba(2,132,199,0.2)] outline-none focus:border-sky-700 dark:border-sky-400 dark:bg-slate-950 dark:text-slate-100"
                value={editDraft.occurredAt}
                onChange={(e) =>
                  onChangeEditDraft((prev) => ({ ...prev, occurredAt: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void onSaveEdit(item.id);
                  if (e.key === 'Escape') onCancelEdit();
                }}
                aria-label={t('dashboard.columns.date')}
              />
            );
          }
          return (
            <span
              className={`text-[11.5px] text-slate-500 select-none dark:text-slate-400 ${
                onStartEdit ? 'cursor-pointer' : ''
              }`}
              onDoubleClick={() => onStartEdit?.(item)}
            >
              {date(item.occurredAt)}
            </span>
          );
        },
      },
    ];

    if (hasActions) {
      list.push({
        id: 'actions',
        header: t('dashboard.columns.action'),
        align: 'right',
        minWidth: '130px',
        hideable: false,
        cell: (item) => {
          const isEditing = editingId === item.id;
          if (isEditing && editDraft && onSaveEdit && onCancelEdit) {
            const itemAllocatedSum = (item.allocations || []).reduce(
              (sum, a) => sum + Number(a.amount || 0),
              0,
            );
            const enteredAmount = Number(editDraft.amount) || 0;
            const isTypeChangedWithAllocations =
              itemAllocatedSum > 0 && editDraft.type !== item.type;
            const isAmountBelowAllocations =
              itemAllocatedSum > 0 && enteredAmount < itemAllocatedSum;
            const isSaveDisabled =
              isPending ||
              !editDraft.category.trim() ||
              !editDraft.note.trim() ||
              enteredAmount <= 0 ||
              isTypeChangedWithAllocations ||
              isAmountBelowAllocations;

            const saveButtonTitle = isTypeChangedWithAllocations
              ? t('transactions.allocation.cannotChangeTypeWithAllocations')
              : isAmountBelowAllocations
                ? t('transactions.allocation.cannotReduceBelowAllocated', {
                    amount: money(itemAllocatedSum),
                  })
                : t('transactions.actions.save');

            return (
              <div className="flex flex-nowrap items-center justify-end gap-1 whitespace-nowrap">
                {onOpenAllocate && (
                  <button
                    type="button"
                    className="inline-flex h-[22px] min-h-[22px] shrink-0 cursor-pointer items-center gap-1 rounded-[2px] border border-sky-200 bg-sky-50 px-1.5 text-[11px] font-medium text-sky-700 whitespace-nowrap transition-colors hover:bg-sky-100 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-400 dark:hover:bg-sky-950/70"
                    onClick={() => onOpenAllocate(item)}
                    title={t('transactions.actions.allocateDebts')}
                  >
                    <span>🔗</span>
                  </button>
                )}
                <button
                  type="button"
                  className="inline-flex h-[22px] min-h-[22px] shrink-0 cursor-pointer items-center rounded-[2px] border border-slate-900 bg-slate-900 px-1.5 text-[11px] font-semibold text-white whitespace-nowrap transition-colors hover:bg-slate-800 disabled:opacity-50 dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                  onClick={() => void onSaveEdit(item.id)}
                  disabled={isSaveDisabled}
                  title={saveButtonTitle}
                >
                  ✓ {t('transactions.actions.save')}
                </button>
                <button
                  type="button"
                  className="inline-flex h-[22px] min-h-[22px] shrink-0 cursor-pointer items-center rounded-[2px] border border-slate-300 bg-slate-100 px-1.5 text-[11px] font-medium text-slate-700 whitespace-nowrap transition-colors hover:bg-slate-200 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                  onClick={onCancelEdit}
                  disabled={isPending}
                  title={t('transactions.actions.cancel')}
                >
                  ✕
                </button>
              </div>
            );
          }
          return (
            <div className="flex flex-nowrap items-center justify-end gap-1 whitespace-nowrap">
              {onStartEdit && (
                <button
                  type="button"
                  className="inline-flex h-[22px] min-h-[22px] shrink-0 cursor-pointer items-center rounded-[2px] border border-slate-200 bg-white px-1.5 text-[11px] font-medium text-slate-700 whitespace-nowrap transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800"
                  onClick={() => onStartEdit(item)}
                  title={t('transactions.actions.edit')}
                >
                  {t('transactions.actions.edit')}
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  className="inline-flex h-[22px] min-h-[22px] shrink-0 cursor-pointer items-center rounded-[2px] border border-rose-200 bg-rose-50 px-1.5 text-[11px] font-medium text-rose-700 whitespace-nowrap transition-colors hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-950/70"
                  onClick={() => void onDelete(item.id)}
                  title={t('transactions.actions.delete')}
                >
                  {t('transactions.actions.delete')}
                </button>
              )}
            </div>
          );
        },
      });
    }

    return list;
  }, [
    computedMaxAmount,
    editDraft,
    editingId,
    isPending,
    locale,
    money,
    onCancelEdit,
    onChangeEditDraft,
    onDelete,
    onOpenAllocate,
    onSaveEdit,
    onStartEdit,
    categorySuggestions,
    placeSuggestions,
    t,
  ]);

  return (
    <DataTable
      id={id}
      ariaLabel={ariaLabel ?? t('dashboard.transactions')}
      rows={transactions}
      emptyMessage={emptyMessage ?? t('dashboard.noTransactions')}
      columns={columns}
      getRowKey={(item) => item.id}
      loading={loading}
    />
  );
}
