'use client';

import { useState, useMemo, useTransition } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { localeTag, type IDebtListItem } from '@telebot/contracts';
import { useLocale } from '@/shared/providers/locale-provider';
import { useMoneyFormatter } from '@/shared/providers/money-visibility-provider';
import { DataPanel, DataTable, type DataTableColumn } from '@/shared/ui/data-table';

import { useContactsQuery } from '@/modules/contacts/api/contacts-query';
import {
  debtsQueryKeys,
  useCreateDebtPaymentMutation,
  useDebtsQuery,
  useUpdateDebtMutation,
} from '../api/debts-query';

type DirectionFilter = 'all' | 'receivable' | 'payable';
type StatusFilter = 'all' | 'active' | 'settled';

export function DebtsScreen() {
  const queryClient = useQueryClient();
  const { locale, t } = useLocale();
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{
    direction: 'receivable' | 'payable';
    counterparty: string;
    counterpartyAlias: string;
    contactId: string;
    originalAmount: string;
    remainingAmount: string;
    note: string;
    dueAt: string;
  }>({
    direction: 'receivable',
    counterparty: '',
    counterpartyAlias: '',
    contactId: '',
    originalAmount: '',
    remainingAmount: '',
    note: '',
    dueAt: '',
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const debts = useDebtsQuery();
  const contactsQuery = useContactsQuery();
  const updateMutation = useUpdateDebtMutation();
  const paymentMutation = useCreateDebtPaymentMutation();

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: debtsQueryKeys.list() });
    void queryClient.invalidateQueries({ queryKey: ['contacts'] });
  };

  const rawList = useMemo(() => debts.data ?? [], [debts.data]);
  const contactsList = useMemo(() => contactsQuery.data ?? [], [contactsQuery.data]);

  const getDebtStatus = (item: IDebtListItem): 'active' | 'settled' => {
    if (item.status) return item.status;
    return item.remainingAmount === 0 || item.settledAt ? 'settled' : 'active';
  };

  const stats = useMemo(() => {
    let active = 0;
    let settled = 0;
    for (const d of rawList) {
      if (getDebtStatus(d) === 'settled') {
        settled++;
      } else {
        active++;
      }
    }
    return {
      total: rawList.length,
      active,
      settled,
    };
  }, [rawList]);

  const totalReceivable = useMemo(
    () =>
      rawList
        .filter((d) => d.direction === 'receivable' && getDebtStatus(d) === 'active')
        .reduce((sum, d) => sum + d.remainingAmount, 0),
    [rawList],
  );
  const totalPayable = useMemo(
    () =>
      rawList
        .filter((d) => d.direction === 'payable' && getDebtStatus(d) === 'active')
        .reduce((sum, d) => sum + d.remainingAmount, 0),
    [rawList],
  );

  const filteredDebts = useMemo(() => {
    return rawList.filter((item) => {
      if (directionFilter !== 'all' && item.direction !== directionFilter) return false;
      if (statusFilter !== 'all' && getDebtStatus(item) !== statusFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        item.counterparty.toLowerCase().includes(q) ||
        (item.counterpartyAlias && item.counterpartyAlias.toLowerCase().includes(q)) ||
        (item.note && item.note.toLowerCase().includes(q))
      );
    });
  }, [rawList, directionFilter, statusFilter, search]);

  const money = useMoneyFormatter();

  const date = (value?: string) =>
    value
      ? new Intl.DateTimeFormat(localeTag(locale), { dateStyle: 'short' }).format(new Date(value))
      : t('common.notSet');

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      startTransition(() => {
        setToastMessage(null);
      });
    }, 3000);
  };

  const handleStartEdit = (item: IDebtListItem) => {
    setEditingId(item.id);
    setEditDraft({
      direction: item.direction,
      counterparty: item.counterparty,
      counterpartyAlias: item.counterpartyAlias || '',
      contactId: item.contactId || '',
      originalAmount: String(item.originalAmount),
      remainingAmount: String(item.remainingAmount),
      note: item.note || '',
      dueAt: item.dueAt ? item.dueAt.slice(0, 10) : '',
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditDraft({
      direction: 'receivable',
      counterparty: '',
      counterpartyAlias: '',
      contactId: '',
      originalAmount: '',
      remainingAmount: '',
      note: '',
      dueAt: '',
    });
  };

  const handleCounterpartyChange = (val: string) => {
    const matched = contactsList.find(
      (c) =>
        c.displayName.toLowerCase() === val.trim().toLowerCase() ||
        (c.alias && c.alias.toLowerCase() === val.trim().toLowerCase()),
    );
    if (matched) {
      setEditDraft((prev) => ({
        ...prev,
        counterparty: matched.displayName,
        counterpartyAlias: matched.alias || '',
        contactId: matched.id,
      }));
    } else {
      setEditDraft((prev) => ({
        ...prev,
        counterparty: val,
        contactId: '',
        counterpartyAlias: '',
      }));
    }
  };

  const handleSaveEdit = async (id: string) => {
    const trimmedCounterparty = editDraft.counterparty.trim();
    const parsedOriginal = Number(editDraft.originalAmount);
    const parsedRemaining = Number(editDraft.remainingAmount);

    if (
      !trimmedCounterparty ||
      Number.isNaN(parsedOriginal) ||
      parsedOriginal < 0 ||
      Number.isNaN(parsedRemaining) ||
      parsedRemaining < 0
    ) {
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id,
        data: {
          direction: editDraft.direction,
          counterparty: trimmedCounterparty,
          counterpartyAlias: editDraft.counterpartyAlias || undefined,
          contactId: editDraft.contactId || undefined,
          originalAmount: parsedOriginal,
          remainingAmount: parsedRemaining,
          note: editDraft.note.trim() || undefined,
          dueAt: editDraft.dueAt
            ? new Date(`${editDraft.dueAt}T23:59:59.000Z`).toISOString()
            : undefined,
        },
      });
      setEditingId(null);
      showToast(t('debts.inlineEdit.saved'));
    } catch {
      // Error handled by mutation
    }
  };

  const handleQuickSettle = async (item: IDebtListItem) => {
    if (item.remainingAmount <= 0) return;
    try {
      await paymentMutation.mutateAsync({
        debtId: item.id,
        amount: item.remainingAmount,
        note: t('debts.actions.repay'),
      });
      showToast(t('debts.inlineEdit.saved'));
    } catch {
      // Error handled by mutation
    }
  };

  const debtColumns: DataTableColumn<IDebtListItem>[] = [
    {
      id: 'status',
      header: t('debts.columns.status'),
      minWidth: '100px',
      width: '100px',
      hideable: false,
      cell: (item) => {
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
        if (editingId === item.id) {
          return (
            <select
              className="h-6 min-h-6 w-full rounded-[2px] border border-sky-600 bg-white px-1 text-[11.5px] text-slate-900 shadow-[0_0_0_1px_rgba(2,132,199,0.2)] outline-none focus:border-sky-700 dark:border-sky-400 dark:bg-slate-950 dark:text-slate-100"
              value={editDraft.direction}
              onChange={(e) =>
                setEditDraft((prev) => ({
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
            className={`inline-flex cursor-pointer items-center rounded-[2px] border px-1.5 py-0.5 text-[10px] font-semibold select-none ${
              item.direction === 'receivable'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
            }`}
            onDoubleClick={() => handleStartEdit(item)}
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
      minWidth: '180px',
      hideable: false,
      cell: (item) => {
        if (editingId === item.id) {
          return (
            <input
              type="text"
              list="debt-contacts-autocomplete"
              className="h-6 min-h-6 w-full rounded-[2px] border border-sky-600 bg-white px-1.5 text-[11.5px] text-slate-900 shadow-[0_0_0_1px_rgba(2,132,199,0.2)] outline-none focus:border-sky-700 dark:border-sky-400 dark:bg-slate-950 dark:text-slate-100"
              value={editDraft.counterparty}
              onChange={(e) => handleCounterpartyChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleSaveEdit(item.id);
                if (e.key === 'Escape') handleCancelEdit();
              }}
              placeholder={t('debts.placeholder.counterparty')}
              autoFocus
              required
              aria-label={t('dashboard.columns.counterparty')}
            />
          );
        }
        return (
          <span
            className="cursor-pointer font-semibold text-slate-900 select-none dark:text-slate-100"
            onDoubleClick={() => handleStartEdit(item)}
            title={item.counterparty}
          >
            {item.counterparty}
            {item.counterpartyAlias ? ` · ${item.counterpartyAlias}` : ''}
          </span>
        );
      },
    },
    {
      id: 'originalAmount',
      header: t('dashboard.columns.original'),
      align: 'right',
      minWidth: '140px',
      cell: (item) => {
        if (editingId === item.id) {
          return (
            <input
              type="number"
              className="h-6 min-h-6 w-full rounded-[2px] border border-sky-600 bg-white px-1.5 text-right text-[11.5px] text-slate-900 shadow-[0_0_0_1px_rgba(2,132,199,0.2)] outline-none focus:border-sky-700 dark:border-sky-400 dark:bg-slate-950 dark:text-slate-100"
              value={editDraft.originalAmount}
              onChange={(e) =>
                setEditDraft((prev) => ({ ...prev, originalAmount: e.target.value }))
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleSaveEdit(item.id);
                if (e.key === 'Escape') handleCancelEdit();
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
            className="cursor-pointer tabular-nums text-slate-600 select-none dark:text-slate-300"
            onDoubleClick={() => handleStartEdit(item)}
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
        if (editingId === item.id) {
          return (
            <input
              type="number"
              className="h-6 min-h-6 w-full rounded-[2px] border border-sky-600 bg-white px-1.5 text-right text-[11.5px] text-slate-900 shadow-[0_0_0_1px_rgba(2,132,199,0.2)] outline-none focus:border-sky-700 dark:border-sky-400 dark:bg-slate-950 dark:text-slate-100"
              value={editDraft.remainingAmount}
              onChange={(e) =>
                setEditDraft((prev) => ({ ...prev, remainingAmount: e.target.value }))
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleSaveEdit(item.id);
                if (e.key === 'Escape') handleCancelEdit();
              }}
              placeholder={t('debts.placeholder.remainingAmount')}
              min="0"
              step="1000"
              required
              aria-label={t('dashboard.columns.remaining')}
            />
          );
        }
        return (
          <strong
            className={`cursor-pointer tabular-nums select-none ${
              item.direction === 'receivable'
                ? 'text-emerald-700 dark:text-emerald-400'
                : 'text-amber-700 dark:text-amber-400'
            }`}
            onDoubleClick={() => handleStartEdit(item)}
          >
            {money(item.remainingAmount)}
          </strong>
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
        if (editingId === item.id) {
          return (
            <input
              type="date"
              className="h-6 min-h-6 w-full rounded-[2px] border border-sky-600 bg-white px-1.5 text-[11.5px] text-slate-900 shadow-[0_0_0_1px_rgba(2,132,199,0.2)] outline-none focus:border-sky-700 dark:border-sky-400 dark:bg-slate-950 dark:text-slate-100"
              value={editDraft.dueAt}
              onChange={(e) => setEditDraft((prev) => ({ ...prev, dueAt: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleSaveEdit(item.id);
                if (e.key === 'Escape') handleCancelEdit();
              }}
              aria-label={t('dashboard.columns.dueDate')}
            />
          );
        }
        return (
          <span
            className="cursor-pointer text-[11.5px] text-slate-500 select-none dark:text-slate-400"
            onDoubleClick={() => handleStartEdit(item)}
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
      cell: (item) => (
        <span className="text-[11.5px] text-slate-500 select-none dark:text-slate-400">
          {item.settledAt ? date(item.settledAt) : '—'}
        </span>
      ),
    },
    {
      id: 'note',
      header: t('dashboard.columns.note'),
      minWidth: '150px',
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
              placeholder={t('debts.placeholder.note')}
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
      id: 'actions',
      header: t('dashboard.columns.action'),
      align: 'right',
      minWidth: '140px',
      hideable: false,
      cell: (item) => {
        const isEditing = editingId === item.id;
        if (isEditing) {
          return (
            <div className="flex flex-nowrap items-center justify-end gap-1 whitespace-nowrap">
              <button
                type="button"
                className="inline-flex h-[22px] min-h-[22px] shrink-0 cursor-pointer items-center rounded-[2px] border border-slate-900 bg-slate-900 px-1.5 text-[11px] font-semibold text-white whitespace-nowrap transition-colors hover:bg-slate-800 disabled:opacity-50 dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                onClick={() => void handleSaveEdit(item.id)}
                disabled={
                  updateMutation.isPending ||
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
                onClick={handleCancelEdit}
                disabled={updateMutation.isPending}
                title={t('debts.actions.cancel')}
              >
                ✕
              </button>
            </div>
          );
        }
        return (
          <div className="flex flex-nowrap items-center justify-end gap-1 whitespace-nowrap">
            <button
              type="button"
              className="inline-flex h-[22px] min-h-[22px] shrink-0 cursor-pointer items-center rounded-[2px] border border-slate-300 bg-slate-100 px-1.5 text-[11px] font-medium text-slate-700 whitespace-nowrap transition-colors hover:bg-slate-200 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100"
              onClick={() => handleStartEdit(item)}
              title={t('debts.actions.edit')}
            >
              ✎ {t('debts.actions.edit')}
            </button>
            {item.remainingAmount > 0 && !item.settledAt && (
              <button
                type="button"
                className="inline-flex h-[22px] min-h-[22px] shrink-0 cursor-pointer items-center rounded-[2px] border border-emerald-300 bg-emerald-50 px-1.5 text-[11px] font-semibold text-emerald-800 whitespace-nowrap transition-colors hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900"
                onClick={() => void handleQuickSettle(item)}
                disabled={paymentMutation.isPending}
                title={t('debts.actions.repay')}
              >
                + {t('debts.actions.repay')}
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <datalist id="debt-contacts-autocomplete">
        {contactsList.map((contact) => (
          <option key={contact.id} value={contact.displayName}>
            {contact.alias ? `${contact.displayName} (${contact.alias})` : contact.displayName}
          </option>
        ))}
      </datalist>

      {toastMessage && (
        <div
          className="fixed top-4 left-1/2 z-[1000] -translate-x-1/2 rounded bg-slate-900 px-4 py-2 text-xs font-medium text-white shadow-lg dark:bg-slate-100 dark:text-slate-900"
          role="status"
          aria-live="polite"
        >
          {toastMessage}
        </div>
      )}

      <section
        className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-2 max-[640px]:grid-cols-2"
        aria-label={t('debts.title')}
      >
        <article className="flex min-h-[62px] flex-col justify-center rounded-[3px] border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900/60">
          <span className="block text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
            {t('dashboard.receivableTotal')}
          </span>
          <strong className="mt-0.5 block text-base font-bold tabular-nums tracking-tight text-emerald-700 dark:text-emerald-400">
            {money(totalReceivable)}
          </strong>
        </article>
        <article className="flex min-h-[62px] flex-col justify-center rounded-[3px] border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900/60">
          <span className="block text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
            {t('dashboard.payableTotal')}
          </span>
          <strong className="mt-0.5 block text-base font-bold tabular-nums tracking-tight text-amber-700 dark:text-amber-400">
            {money(totalPayable)}
          </strong>
        </article>
        <article className="flex min-h-[62px] flex-col justify-center rounded-[3px] border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900/60">
          <span className="block text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
            {t('dashboard.netDebt')}
          </span>
          <strong
            className={`mt-0.5 block text-base font-bold tabular-nums tracking-tight ${
              totalReceivable >= totalPayable
                ? 'text-emerald-700 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {money(totalReceivable - totalPayable)}
          </strong>
        </article>
      </section>

      {debts.isError ? (
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
            title={t('dashboard.openDebts')}
            description={t('debts.subtitle')}
            counter={t('table.rowsCount', { count: filteredDebts.length })}
            toolbar={
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex gap-1">
                  <button
                    type="button"
                    className={`inline-flex h-6 min-h-6 cursor-pointer items-center rounded-[3px] border px-2 text-[11px] font-medium transition-colors ${
                      statusFilter === 'all'
                        ? 'border-sky-500 bg-sky-50 text-sky-700 dark:border-sky-400 dark:bg-sky-950/50 dark:text-sky-300'
                        : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                    onClick={() => setStatusFilter('all')}
                  >
                    {t('debts.filter.statusAll')} ({stats.total})
                  </button>
                  <button
                    type="button"
                    className={`inline-flex h-6 min-h-6 cursor-pointer items-center rounded-[3px] border px-2 text-[11px] font-medium transition-colors ${
                      statusFilter === 'active'
                        ? 'border-sky-500 bg-sky-50 text-sky-700 dark:border-sky-400 dark:bg-sky-950/50 dark:text-sky-300'
                        : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                    onClick={() => setStatusFilter('active')}
                  >
                    {t('debts.filter.statusActive')} ({stats.active})
                  </button>
                  <button
                    type="button"
                    className={`inline-flex h-6 min-h-6 cursor-pointer items-center rounded-[3px] border px-2 text-[11px] font-medium transition-colors ${
                      statusFilter === 'settled'
                        ? 'border-sky-500 bg-sky-50 text-sky-700 dark:border-sky-400 dark:bg-sky-950/50 dark:text-sky-300'
                        : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                    onClick={() => setStatusFilter('settled')}
                  >
                    {t('debts.filter.statusSettled')} ({stats.settled})
                  </button>
                </div>
                <div className="inline-flex gap-1">
                  <button
                    type="button"
                    className={`inline-flex h-6 min-h-6 cursor-pointer items-center rounded-[3px] border px-2 text-[11px] font-medium transition-colors ${
                      directionFilter === 'all'
                        ? 'border-sky-500 bg-sky-50 text-sky-700 dark:border-sky-400 dark:bg-sky-950/50 dark:text-sky-300'
                        : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                    onClick={() => setDirectionFilter('all')}
                  >
                    {t('debts.filter.directionAll')}
                  </button>
                  <button
                    type="button"
                    className={`inline-flex h-6 min-h-6 cursor-pointer items-center rounded-[3px] border px-2 text-[11px] font-medium transition-colors ${
                      directionFilter === 'receivable'
                        ? 'border-sky-500 bg-sky-50 text-sky-700 dark:border-sky-400 dark:bg-sky-950/50 dark:text-sky-300'
                        : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                    onClick={() => setDirectionFilter('receivable')}
                  >
                    {t('table.filter.receivable')}
                  </button>
                  <button
                    type="button"
                    className={`inline-flex h-6 min-h-6 cursor-pointer items-center rounded-[3px] border px-2 text-[11px] font-medium transition-colors ${
                      directionFilter === 'payable'
                        ? 'border-sky-500 bg-sky-50 text-sky-700 dark:border-sky-400 dark:bg-sky-950/50 dark:text-sky-300'
                        : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                    onClick={() => setDirectionFilter('payable')}
                  >
                    {t('table.filter.payable')}
                  </button>
                </div>
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
              id="debts"
              ariaLabel={t('debts.title')}
              rows={filteredDebts}
              loading={debts.isLoading}
              emptyMessage={t('dashboard.noDebts')}
              columns={debtColumns}
              getRowKey={(item) => item.id}
            />
          </DataPanel>
        </section>
      )}
    </div>
  );
}
