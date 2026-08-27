import { useMemo, useState } from 'react';
import { localeTag, type IDebtListItem } from '@telebot/contracts';
import { useLocale } from '@/shared/providers/locale-provider';
import { useMoneyFormatter } from '@/shared/providers/money-visibility-provider';
import { DataTable, type DataTableColumn } from '@/shared/ui/data-table';

export type DebtTableItem = IDebtListItem & {
  _isPaymentChild?: boolean;
  _parentDebt?: IDebtListItem;
  _payment?: import('@telebot/contracts').IDebtPaymentItem;
};

export type DebtEditDraft = {
  direction: 'receivable' | 'payable';
  counterparty: string;
  counterpartyAlias: string;
  contactId: string;
  originalAmount: string;
  remainingAmount: string;
  note: string;
  dueAt: string;
};

export type DebtsTableProps = {
  id?: string;
  debts: IDebtListItem[];
  ariaLabel?: string;
  emptyMessage?: string;
  loading?: boolean;
  editingId?: string | null;
  editDraft?: DebtEditDraft;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onToggleSelectAll?: () => void;
  onStartEdit?: (item: IDebtListItem) => void;
  onCancelEdit?: () => void;
  onSaveEdit?: (id: string) => void | Promise<void>;
  onQuickSettle?: (item: IDebtListItem) => void | Promise<void>;
  onDelete?: (id: string) => void | Promise<void>;
  onDeletePayment?: (debtId: string, paymentId: string) => void | Promise<void>;
  onCounterpartyChange?: (val: string) => void;
  onChangeEditDraft?: React.Dispatch<React.SetStateAction<DebtEditDraft>>;
  isPending?: boolean;
};

export function getDebtStatus(item: IDebtListItem): 'active' | 'settled' {
  if (item.status) return item.status;
  return item.remainingAmount === 0 || item.settledAt ? 'settled' : 'active';
}

export function DebtsTable({
  id = 'debts-table',
  debts,
  ariaLabel,
  emptyMessage,
  loading = false,
  editingId,
  editDraft,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onQuickSettle,
  onDelete,
  onDeletePayment,
  onCounterpartyChange,
  onChangeEditDraft,
  isPending = false,
}: DebtsTableProps) {
  const { locale, t } = useLocale();
  const money = useMoneyFormatter();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [expandedPaymentDebtIds, setExpandedPaymentDebtIds] = useState<Set<string>>(new Set());

  const flattenedRows = useMemo<DebtTableItem[]>(() => {
    // Top level items (either roots without parentDebtId, or standalone items)
    const roots = debts.filter((d) => !d.parentDebtId);
    const baseList = roots.length > 0 ? roots : debts;

    const result: DebtTableItem[] = [];

    const appendPaymentRows = (debt: IDebtListItem, isChildOfCombinedDebt = false) => {
      if (debt.payments && debt.payments.length > 0 && expandedPaymentDebtIds.has(debt.id)) {
        for (const payment of debt.payments) {
          result.push({
            ...debt,
            id: `payment-${payment.id}`,
            _isPaymentChild: true,
            _parentDebt: debt,
            _payment: payment,
            parentDebtId: isChildOfCombinedDebt ? debt.parentDebtId || debt.id : undefined,
          });
        }
      }
    };

    for (const item of baseList) {
      result.push(item);

      if (item.children && item.children.length > 0 && expandedIds.has(item.id)) {
        for (const child of item.children) {
          result.push(child);
          appendPaymentRows(child, true);
        }
      }

      appendPaymentRows(item, false);
    }
    return result;
  }, [debts, expandedIds, expandedPaymentDebtIds]);

  const columns = useMemo<DataTableColumn<DebtTableItem>[]>(() => {
    const hasActions = Boolean(
      onStartEdit || onSaveEdit || onQuickSettle || onDelete || onDeletePayment,
    );
    const date = (value?: string) =>
      value
        ? new Intl.DateTimeFormat(localeTag(locale), { dateStyle: 'short' }).format(new Date(value))
        : t('common.notSet');

    const list: DataTableColumn<DebtTableItem>[] = [];

    if (onToggleSelect) {
      const rootDebts = debts.filter((d) => !d.parentDebtId);
      const isAllSelected = rootDebts.length > 0 && rootDebts.every((d) => selectedIds?.has(d.id));
      list.push({
        id: 'select',
        header: onToggleSelectAll ? (
          <input
            type="checkbox"
            className="size-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-950"
            checked={isAllSelected}
            onChange={onToggleSelectAll}
            aria-label={t('debts.selectAll')}
          />
        ) : (
          ''
        ),
        minWidth: '40px',
        width: '40px',
        hideable: false,
        cell: (item) => {
          if (item._isPaymentChild) return null;
          return (
            <input
              type="checkbox"
              className="size-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-950"
              checked={selectedIds?.has(item.id) ?? false}
              onChange={() => onToggleSelect(item.id)}
              aria-label={`Select ${item.counterparty}`}
            />
          );
        },
      });
    }

    list.push(
      {
        id: 'status',
        header: t('debts.columns.status'),
        minWidth: '100px',
        width: '100px',
        hideable: false,
        cell: (item) => {
          if (item._isPaymentChild) {
            return (
              <span className="inline-flex items-center rounded-[2px] border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800 select-none dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                {t('debts.badge.paymentChild')}
              </span>
            );
          }
          const isSettled = getDebtStatus(item) === 'settled';
          return (
            <span
              className={`inline-flex items-center rounded-[2px] border px-1.5 py-0.5 text-[10px] font-semibold select-none ${
                isSettled
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
              }`}
            >
              {isSettled ? t('debts.status.settled') : t('debts.status.active')}
            </span>
          );
        },
      },
      {
        id: 'direction',
        header: t('dashboard.columns.direction'),
        minWidth: '100px',
        cell: (item) => {
          if (item._isPaymentChild) {
            return (
              <span className="text-[10.5px] font-medium text-slate-500 select-none dark:text-slate-400">
                {item.direction === 'receivable'
                  ? t('category.debtRecovery')
                  : t('category.debtPayment')}
              </span>
            );
          }
          if (editingId === item.id && editDraft && onChangeEditDraft) {
            return (
              <select
                className="h-6 min-h-6 w-full rounded-[2px] border border-sky-600 bg-white px-1 text-[11.5px] text-slate-900 shadow-[0_0_0_1px_rgba(2,132,199,0.2)] outline-none focus:border-sky-700 dark:border-sky-400 dark:bg-slate-950 dark:text-slate-100"
                value={editDraft.direction}
                onChange={(e) =>
                  onChangeEditDraft((prev) => ({
                    ...prev,
                    direction: e.target.value as 'receivable' | 'payable',
                  }))
                }
                aria-label={t('dashboard.columns.direction')}
              >
                <option value="receivable">{t('table.filter.receivable')}</option>
                <option value="payable">{t('table.filter.payable')}</option>
              </select>
            );
          }
          return (
            <span
              className={`inline-flex items-center rounded-[2px] border px-1.5 py-0.5 text-[10px] font-semibold select-none ${
                onStartEdit ? 'cursor-pointer' : ''
              } ${
                item.direction === 'receivable'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
              }`}
              onDoubleClick={() => onStartEdit?.(item)}
            >
              {item.direction === 'receivable'
                ? t('table.filter.receivable')
                : t('table.filter.payable')}
            </span>
          );
        },
      },
      {
        id: 'counterparty',
        header: t('dashboard.columns.counterparty'),
        minWidth: '200px',
        hideable: false,
        cell: (item) => {
          if (item._isPaymentChild) {
            const isNestedUnderChild = Boolean(item._parentDebt?.parentDebtId);
            return (
              <div className={`flex items-center gap-1.5 ${isNestedUnderChild ? 'pl-8' : 'pl-4'}`}>
                <span
                  className="text-emerald-600 select-none text-xs font-mono dark:text-emerald-400"
                  aria-hidden="true"
                >
                  ↳
                </span>
                <span
                  className="font-medium text-slate-700 select-none dark:text-slate-300"
                  title={item._payment?.note}
                >
                  {item._payment?.note || t('debts.badge.paymentChild')}
                </span>
              </div>
            );
          }

          if (
            editingId === item.id &&
            editDraft &&
            onCounterpartyChange &&
            onSaveEdit &&
            onCancelEdit
          ) {
            return (
              <input
                type="text"
                list="debt-contacts-autocomplete"
                className="h-6 min-h-6 w-full rounded-[2px] border border-sky-600 bg-white px-1.5 text-[11.5px] text-slate-900 shadow-[0_0_0_1px_rgba(2,132,199,0.2)] outline-none focus:border-sky-700 dark:border-sky-400 dark:bg-slate-950 dark:text-slate-100"
                value={editDraft.counterparty}
                onChange={(e) => onCounterpartyChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void onSaveEdit(item.id);
                  if (e.key === 'Escape') onCancelEdit();
                }}
                placeholder={t('debts.placeholder.counterparty')}
                autoFocus
                required
                aria-label={t('dashboard.columns.counterparty')}
              />
            );
          }

          const hasChildren =
            Boolean(item.childCount && item.childCount > 0) ||
            Boolean(item.children && item.children.length > 0);
          const hasPayments = Boolean(item.payments && item.payments.length > 0);
          const isChild = Boolean(item.parentDebtId);
          const isExpandedChildren = expandedIds.has(item.id);
          const isExpandedPayments = expandedPaymentDebtIds.has(item.id);

          return (
            <div className={`flex items-center gap-1.5 ${isChild ? 'pl-4' : ''}`}>
              {hasChildren && (
                <button
                  type="button"
                  className="inline-flex size-4.5 shrink-0 cursor-pointer items-center justify-center rounded border border-slate-200 bg-white text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-slate-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedIds((prev) => {
                      const next = new Set(prev);
                      if (next.has(item.id)) next.delete(item.id);
                      else next.add(item.id);
                      return next;
                    });
                  }}
                  title={
                    isExpandedChildren ? t('debts.collapseChildren') : t('debts.expandChildren')
                  }
                  aria-label={
                    isExpandedChildren ? t('debts.collapseChildren') : t('debts.expandChildren')
                  }
                >
                  <svg
                    className={`size-3 transition-transform duration-150 ${isExpandedChildren ? 'rotate-90 text-sky-600 dark:text-sky-400' : ''}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              )}

              {hasPayments && (
                <button
                  type="button"
                  className="inline-flex size-4.5 shrink-0 cursor-pointer items-center justify-center rounded border border-emerald-200 bg-emerald-50 text-emerald-700 transition-colors hover:border-emerald-300 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedPaymentDebtIds((prev) => {
                      const next = new Set(prev);
                      if (next.has(item.id)) next.delete(item.id);
                      else next.add(item.id);
                      return next;
                    });
                  }}
                  title={
                    isExpandedPayments
                      ? t('debts.collapsePayments')
                      : t('debts.expandPayments', { count: item.payments?.length ?? 0 })
                  }
                  aria-label={
                    isExpandedPayments
                      ? t('debts.collapsePayments')
                      : t('debts.expandPayments', { count: item.payments?.length ?? 0 })
                  }
                >
                  <svg
                    className={`size-3 transition-transform duration-150 ${isExpandedPayments ? 'rotate-90 text-emerald-700 dark:text-emerald-300' : ''}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              )}

              {isChild && (
                <span className="text-slate-400 select-none text-xs font-mono" aria-hidden="true">
                  ↳
                </span>
              )}
              <span
                className={`font-semibold text-slate-900 select-none dark:text-slate-100 ${
                  onStartEdit ? 'cursor-pointer' : ''
                }`}
                onDoubleClick={() => onStartEdit?.(item)}
                title={item.counterparty}
              >
                {item.counterparty}
                {item.counterpartyAlias ? ` · ${item.counterpartyAlias}` : ''}
              </span>
              {hasChildren && (
                <span className="inline-flex items-center rounded-[2px] border border-sky-200 bg-sky-50 px-1 py-0.2 text-[9.5px] font-medium text-sky-700 select-none dark:border-sky-800 dark:bg-sky-950/60 dark:text-sky-300">
                  {t('debts.badge.parent', {
                    count: item.childCount || item.children?.length || 0,
                  })}
                </span>
              )}
              {isChild && (
                <span className="inline-flex items-center rounded-[2px] border border-slate-200 bg-slate-100 px-1 py-0.2 text-[9.5px] font-medium text-slate-600 select-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                  {t('debts.badge.child')}
                </span>
              )}
              {hasPayments && (
                <span className="inline-flex items-center rounded-[2px] border border-emerald-200 bg-emerald-50 px-1 py-0.2 text-[9.5px] font-medium text-emerald-700 select-none dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  {t('debts.badge.paymentInstallment', { count: item.payments?.length ?? 0 })}
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: 'originalAmount',
        header: t('dashboard.columns.original'),
        align: 'right',
        minWidth: '140px',
        cell: (item) => {
          if (item._isPaymentChild) {
            return <span className="text-slate-400 select-none">—</span>;
          }
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
                value={editDraft.originalAmount}
                onChange={(e) =>
                  onChangeEditDraft((prev) => ({ ...prev, originalAmount: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void onSaveEdit(item.id);
                  if (e.key === 'Escape') onCancelEdit();
                }}
                placeholder={t('debts.placeholder.originalAmount')}
                min="0"
                step="1000"
                required
                aria-label={t('dashboard.columns.original')}
              />
            );
          }
          return (
            <span
              className={`tabular-nums text-slate-600 select-none dark:text-slate-300 ${
                onStartEdit ? 'cursor-pointer' : ''
              }`}
              onDoubleClick={() => onStartEdit?.(item)}
            >
              {money(item.originalAmount)}
            </span>
          );
        },
      },
      {
        id: 'remainingAmount',
        header: t('dashboard.columns.remaining'),
        align: 'right',
        minWidth: '140px',
        hideable: false,
        cell: (item) => {
          if (item._isPaymentChild) {
            return (
              <span className="tabular-nums font-semibold text-emerald-700 select-none dark:text-emerald-400">
                - {money(item._payment?.amount ?? 0)}
              </span>
            );
          }

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
                value={editDraft.remainingAmount}
                onChange={(e) =>
                  onChangeEditDraft((prev) => ({ ...prev, remainingAmount: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void onSaveEdit(item.id);
                  if (e.key === 'Escape') onCancelEdit();
                }}
                placeholder={t('debts.placeholder.remainingAmount')}
                min="0"
                step="1000"
                required
                aria-label={t('dashboard.columns.remaining')}
              />
            );
          }

          const paidTotal = item.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;

          return (
            <div className="flex flex-col items-end">
              <strong
                className={`tabular-nums select-none ${onStartEdit ? 'cursor-pointer' : ''} ${
                  item.direction === 'receivable'
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-amber-700 dark:text-amber-400'
                }`}
                onDoubleClick={() => onStartEdit?.(item)}
              >
                {money(item.remainingAmount)}
              </strong>
              {paidTotal > 0 && (
                <span className="text-[9.5px] font-normal text-emerald-600 select-none dark:text-emerald-400">
                  {t('debts.paidProgressWithCount', {
                    amount: money(paidTotal),
                    count: item.payments?.length ?? 0,
                  })}
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: 'currency',
        header: t('debts.columns.currency'),
        minWidth: '80px',
        cell: (item) => (
          <span className="inline-flex items-center rounded-[2px] border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 select-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {item.currency || 'VND'}
          </span>
        ),
      },
      {
        id: 'dueAt',
        header: t('dashboard.columns.dueDate'),
        minWidth: '130px',
        cell: (item) => {
          if (item._isPaymentChild) {
            return <span className="text-slate-400 select-none">—</span>;
          }
          if (
            editingId === item.id &&
            editDraft &&
            onChangeEditDraft &&
            onSaveEdit &&
            onCancelEdit
          ) {
            return (
              <input
                type="date"
                className="h-6 min-h-6 w-full rounded-[2px] border border-sky-600 bg-white px-1.5 text-[11.5px] text-slate-900 shadow-[0_0_0_1px_rgba(2,132,199,0.2)] outline-none focus:border-sky-700 dark:border-sky-400 dark:bg-slate-950 dark:text-slate-100"
                value={editDraft.dueAt}
                onChange={(e) => onChangeEditDraft((prev) => ({ ...prev, dueAt: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void onSaveEdit(item.id);
                  if (e.key === 'Escape') onCancelEdit();
                }}
                aria-label={t('dashboard.columns.dueDate')}
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
              {date(item.dueAt)}
            </span>
          );
        },
      },
      {
        id: 'settledAt',
        header: t('debts.columns.settledAt'),
        minWidth: '120px',
        cell: (item) => {
          if (item._isPaymentChild) {
            return (
              <span className="text-[11.5px] font-medium text-emerald-700 select-none dark:text-emerald-400">
                {date(item._payment?.paymentDate || item._payment?.createdAt)}
              </span>
            );
          }
          return (
            <span className="text-[11.5px] text-slate-500 select-none dark:text-slate-400">
              {item.settledAt ? date(item.settledAt) : '—'}
            </span>
          );
        },
      },
      {
        id: 'note',
        header: t('dashboard.columns.note'),
        minWidth: '150px',
        cell: (item) => {
          if (item._isPaymentChild) {
            return (
              <div className="flex items-center gap-1.5">
                <span
                  className="text-slate-600 select-none dark:text-slate-300"
                  title={item._payment?.note}
                >
                  {item._payment?.note || '—'}
                </span>
                {item._payment?.financeTransactionId && (
                  <span
                    className="inline-flex items-center rounded-[2px] border border-sky-200 bg-sky-50 px-1 py-0.2 text-[9px] font-medium text-sky-700 select-none dark:border-sky-800 dark:bg-sky-950/60 dark:text-sky-300"
                    title={t('debts.payments.linkedTransaction')}
                  >
                    🔗 {t('debts.payments.linkedTransaction')}
                  </span>
                )}
              </div>
            );
          }

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
                placeholder={t('debts.placeholder.note')}
                aria-label={t('dashboard.columns.note')}
              />
            );
          }
          return (
            <span
              className={`text-slate-500 select-none dark:text-slate-400 ${
                onStartEdit ? 'cursor-pointer' : ''
              }`}
              onDoubleClick={() => onStartEdit?.(item)}
              title={item.note || undefined}
            >
              {item.note || '—'}
            </span>
          );
        },
      },
    );

    if (hasActions) {
      list.push({
        id: 'actions',
        header: t('dashboard.columns.action'),
        align: 'right',
        minWidth: '140px',
        hideable: false,
        cell: (item) => {
          if (item._isPaymentChild) {
            if (onDeletePayment && item._payment && item._parentDebt) {
              const pDebt = item._parentDebt;
              const pItem = item._payment;
              return (
                <div className="flex flex-nowrap items-center justify-end gap-1 whitespace-nowrap">
                  <button
                    type="button"
                    className="inline-flex h-[22px] min-h-[22px] shrink-0 cursor-pointer items-center rounded-[2px] border border-rose-200 bg-rose-50 px-1.5 text-[11px] font-medium text-rose-700 whitespace-nowrap transition-colors hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-950/70"
                    onClick={() => void onDeletePayment(pDebt.id, pItem.id)}
                    title={t('common.cancel')}
                  >
                    ✕
                  </button>
                </div>
              );
            }
            return null;
          }

          const isEditing = editingId === item.id;
          if (isEditing && editDraft && onSaveEdit && onCancelEdit) {
            return (
              <div className="flex flex-nowrap items-center justify-end gap-1 whitespace-nowrap">
                <button
                  type="button"
                  className="inline-flex h-[22px] min-h-[22px] shrink-0 cursor-pointer items-center rounded-[2px] border border-slate-900 bg-slate-900 px-1.5 text-[11px] font-semibold text-white whitespace-nowrap transition-colors hover:bg-slate-800 disabled:opacity-50 dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                  onClick={() => void onSaveEdit(item.id)}
                  disabled={
                    isPending ||
                    !editDraft.counterparty.trim() ||
                    Number.isNaN(Number(editDraft.originalAmount)) ||
                    Number.isNaN(Number(editDraft.remainingAmount))
                  }
                  title={t('debts.actions.save')}
                >
                  ✓ {t('debts.actions.save')}
                </button>
                <button
                  type="button"
                  className="inline-flex h-[22px] min-h-[22px] shrink-0 cursor-pointer items-center rounded-[2px] border border-slate-300 bg-slate-100 px-1.5 text-[11px] font-medium text-slate-700 whitespace-nowrap transition-colors hover:bg-slate-200 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                  onClick={onCancelEdit}
                  disabled={isPending}
                  title={t('debts.actions.cancel')}
                >
                  ✕
                </button>
              </div>
            );
          }

          const isSettled = getDebtStatus(item) === 'settled';

          return (
            <div className="flex flex-nowrap items-center justify-end gap-1 whitespace-nowrap">
              {!isSettled && onQuickSettle && (
                <button
                  type="button"
                  className="inline-flex h-[22px] min-h-[22px] shrink-0 cursor-pointer items-center rounded-[2px] border border-emerald-600 bg-emerald-50 px-1.5 text-[11px] font-semibold text-emerald-700 whitespace-nowrap transition-colors hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900/60"
                  onClick={() => void onQuickSettle(item)}
                  title={t('debts.actions.repay')}
                >
                  {t('debts.actions.repay')}
                </button>
              )}
              {onStartEdit && (
                <button
                  type="button"
                  className="inline-flex h-[22px] min-h-[22px] shrink-0 cursor-pointer items-center rounded-[2px] border border-slate-200 bg-white px-1.5 text-[11px] font-medium text-slate-700 whitespace-nowrap transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800"
                  onClick={() => onStartEdit(item)}
                  title={t('debts.actions.edit')}
                >
                  {t('debts.actions.edit')}
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  className="inline-flex h-[22px] min-h-[22px] shrink-0 cursor-pointer items-center rounded-[2px] border border-rose-200 bg-rose-50 px-1.5 text-[11px] font-medium text-rose-700 whitespace-nowrap transition-colors hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-950/70"
                  onClick={() => void onDelete(item.id)}
                  title={t('common.cancel')}
                >
                  ✕
                </button>
              )}
            </div>
          );
        },
      });
    }

    return list;
  }, [
    debts,
    editDraft,
    editingId,
    expandedIds,
    expandedPaymentDebtIds,
    isPending,
    locale,
    money,
    onCancelEdit,
    onChangeEditDraft,
    onCounterpartyChange,
    onDelete,
    onDeletePayment,
    onQuickSettle,
    onSaveEdit,
    onStartEdit,
    onToggleSelect,
    onToggleSelectAll,
    selectedIds,
    t,
  ]);

  return (
    <DataTable
      id={id}
      ariaLabel={ariaLabel ?? t('dashboard.openDebts')}
      rows={flattenedRows}
      emptyMessage={emptyMessage ?? t('dashboard.noDebts')}
      columns={columns}
      getRowKey={(item) => item.id}
      getRowClassName={(item) => {
        if (item._isPaymentChild) return 'bg-emerald-50/30 dark:bg-emerald-950/20';
        if (item.parentDebtId) return 'bg-slate-50/70 dark:bg-slate-900/40';
        return '';
      }}
      disableSorting
      loading={loading}
    />
  );
}
