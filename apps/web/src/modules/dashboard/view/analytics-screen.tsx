'use client';

import { useState, useMemo, useTransition } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { localeTag, type TransactionType } from '@telebot/contracts';
import { useLocale } from '@/shared/providers/locale-provider';
import { useMoneyFormatter } from '@/shared/providers/money-visibility-provider';
import { DataPanel, DataTable, type DataTableColumn } from '@/shared/ui/data-table';
import { WorkspaceHeader } from '@/shared/ui/workspace-header';
import { usePeriodFilter } from '@/shared/hooks/use-period-filter';
import { PeriodFilterToolbar } from '@/shared/ui/period-filter-toolbar';
import { TrendSummaryStrip } from '@/shared/ui/trend-summary-strip';
import { useContactsQuery } from '@/modules/contacts/api/contacts-query';
import {
  useCreateDebtPaymentMutation,
  useUpdateDebtMutation,
} from '@/modules/debts/api/debts-query';
import { dashboardQueryKeys, useDashboardQuery } from '../api/dashboard-query';
import {
  useDeleteTransactionMutation,
  useUpdateTransactionMutation,
} from '../api/transactions-query';

type DashboardData = NonNullable<ReturnType<typeof useDashboardQuery>['data']>;
type TransactionItem = DashboardData['transactions'][number];
type DebtItem = DashboardData['debts'][number];

export function AnalyticsScreen() {
  const queryClient = useQueryClient();
  const { locale, t } = useLocale();
  const periodFilter = usePeriodFilter('month');
  const [txSearch, setTxSearch] = useState('');
  const [debtSearch, setDebtSearch] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Transaction inline edit state
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [editTxDraft, setEditTxDraft] = useState<{
    type: TransactionType;
    category: string;
    note: string;
    amount: string;
  }>({
    type: 'expense',
    category: '',
    note: '',
    amount: '',
  });

  // Debt inline edit state
  const [editingDebtId, setEditingDebtId] = useState<string | null>(null);
  const [editDebtDraft, setEditDebtDraft] = useState<{
    direction: 'receivable' | 'payable';
    counterparty: string;
    counterpartyAlias: string;
    contactId: string;
    dueAt: string;
    remainingAmount: string;
  }>({
    direction: 'receivable',
    counterparty: '',
    counterpartyAlias: '',
    contactId: '',
    dueAt: '',
    remainingAmount: '',
  });

  const dashboard = useDashboardQuery();
  const contactsQuery = useContactsQuery();
  const updateTxMutation = useUpdateTransactionMutation();
  const deleteTxMutation = useDeleteTransactionMutation();
  const updateDebtMutation = useUpdateDebtMutation();
  const paymentDebtMutation = useCreateDebtPaymentMutation();

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.detail() });
    void queryClient.invalidateQueries({ queryKey: ['contacts'] });
  };

  const money = useMoneyFormatter();

  const date = (value?: string) =>
    value
      ? new Intl.DateTimeFormat(localeTag(locale), {
          dateStyle: 'short',
          timeStyle: 'short',
        }).format(new Date(value))
      : t('common.notSet');

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      startTransition(() => {
        setToastMessage(null);
      });
    }, 3000);
  };

  const rawData = dashboard.data;
  const rawTransactions = useMemo(() => rawData?.transactions ?? [], [rawData?.transactions]);
  const contactsList = useMemo(() => contactsQuery.data ?? [], [contactsQuery.data]);

  // Filter transactions by period
  const periodTransactions = useMemo(() => {
    return rawTransactions.filter((item) => periodFilter.isItemInPeriod(item.occurredAt));
  }, [rawTransactions, periodFilter]);

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

  const filteredTx = useMemo(() => {
    if (!txSearch.trim()) return periodTransactions;
    const q = txSearch.toLowerCase();
    return periodTransactions.filter(
      (item) =>
        item.category.toLowerCase().includes(q) ||
        (item.note && item.note.toLowerCase().includes(q)),
    );
  }, [periodTransactions, txSearch]);

  const filteredDebts = useMemo(() => {
    if (!rawData?.debts) return [];
    if (!debtSearch.trim()) return rawData.debts;
    const q = debtSearch.toLowerCase();
    return rawData.debts.filter((item) => item.counterparty.toLowerCase().includes(q));
  }, [rawData?.debts, debtSearch]);

  // Handle Transaction Edit
  const handleStartTxEdit = (item: TransactionItem) => {
    setEditingTxId(item.id);
    setEditTxDraft({
      type: item.type,
      category: item.category,
      note: item.note || '',
      amount: String(item.amount),
    });
  };

  const handleCancelTxEdit = () => {
    setEditingTxId(null);
    setEditTxDraft({
      type: 'expense',
      category: '',
      note: '',
      amount: '',
    });
  };

  const handleSaveTxEdit = async (id: string) => {
    const trimmedCat = editTxDraft.category.trim();
    const trimmedNote = editTxDraft.note.trim();
    const parsedAmount = Number(editTxDraft.amount);
    if (!trimmedCat || !trimmedNote || Number.isNaN(parsedAmount) || parsedAmount <= 0) return;

    try {
      await updateTxMutation.mutateAsync({
        id,
        data: {
          type: editTxDraft.type,
          category: trimmedCat,
          note: trimmedNote,
          amount: parsedAmount,
        },
      });
      setEditingTxId(null);
      showToast(t('transactions.inlineEdit.saved'));
    } catch {
      // Error handled by mutation
    }
  };

  const handleDeleteTx = async (id: string) => {
    if (!window.confirm(t('transactions.delete.confirm'))) return;
    try {
      await deleteTxMutation.mutateAsync(id);
      showToast(t('transactions.delete.success'));
    } catch {
      // Error handled by mutation
    }
  };

  // Handle Debt Edit
  const handleStartDebtEdit = (item: DebtItem) => {
    setEditingDebtId(item.id);
    setEditDebtDraft({
      direction: item.direction,
      counterparty: item.counterparty,
      counterpartyAlias: '',
      contactId: '',
      dueAt: item.dueAt ? item.dueAt.slice(0, 10) : '',
      remainingAmount: String(item.remainingAmount),
    });
  };

  const handleCancelDebtEdit = () => {
    setEditingDebtId(null);
    setEditDebtDraft({
      direction: 'receivable',
      counterparty: '',
      counterpartyAlias: '',
      contactId: '',
      dueAt: '',
      remainingAmount: '',
    });
  };

  const handleDebtCounterpartyChange = (val: string) => {
    const matched = contactsList.find(
      (c) =>
        c.displayName.toLowerCase() === val.trim().toLowerCase() ||
        (c.alias && c.alias.toLowerCase() === val.trim().toLowerCase()),
    );
    if (matched) {
      setEditDebtDraft((prev) => ({
        ...prev,
        counterparty: matched.displayName,
        counterpartyAlias: matched.alias || '',
        contactId: matched.id,
      }));
    } else {
      setEditDebtDraft((prev) => ({
        ...prev,
        counterparty: val,
        contactId: '',
        counterpartyAlias: '',
      }));
    }
  };

  const handleSaveDebtEdit = async (id: string) => {
    const trimmedCounterparty = editDebtDraft.counterparty.trim();
    const parsedRemaining = Number(editDebtDraft.remainingAmount);
    if (!trimmedCounterparty || Number.isNaN(parsedRemaining) || parsedRemaining < 0) return;

    try {
      await updateDebtMutation.mutateAsync({
        id,
        data: {
          direction: editDebtDraft.direction,
          counterparty: trimmedCounterparty,
          counterpartyAlias: editDebtDraft.counterpartyAlias || undefined,
          contactId: editDebtDraft.contactId || undefined,
          remainingAmount: parsedRemaining,
          dueAt: editDebtDraft.dueAt
            ? new Date(`${editDebtDraft.dueAt}T23:59:59.000Z`).toISOString()
            : undefined,
        },
      });
      setEditingDebtId(null);
      showToast(t('debts.inlineEdit.saved'));
    } catch {
      // Error handled by mutation
    }
  };

  const handleQuickSettleDebt = async (item: DebtItem) => {
    if (item.remainingAmount <= 0) return;
    try {
      await paymentDebtMutation.mutateAsync({
        debtId: item.id,
        amount: item.remainingAmount,
        note: t('debts.actions.repay'),
      });
      showToast(t('debts.inlineEdit.saved'));
    } catch {
      // Error handled by mutation
    }
  };

  const transactionColumns: DataTableColumn<TransactionItem>[] = [
    {
      id: 'category',
      header: t('dashboard.columns.transaction'),
      minWidth: '170px',
      hideable: false,
      cell: (item) => {
        if (editingTxId === item.id) {
          return (
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <select
                className="table-inline-input"
                style={{ width: '80px', flexShrink: 0 }}
                value={editTxDraft.type}
                onChange={(e) =>
                  setEditTxDraft((prev) => ({
                    ...prev,
                    type: e.target.value as TransactionType,
                  }))
                }
                aria-label={t('dashboard.columns.direction')}
              >
                <option value="income">{t('table.filter.income')}</option>
                <option value="expense">{t('table.filter.expense')}</option>
              </select>
              <input
                type="text"
                className="table-inline-input"
                value={editTxDraft.category}
                onChange={(e) => setEditTxDraft((prev) => ({ ...prev, category: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleSaveTxEdit(item.id);
                  if (e.key === 'Escape') handleCancelTxEdit();
                }}
                placeholder={t('transactions.placeholder.category')}
                autoFocus
                required
                aria-label={t('dashboard.columns.category')}
              />
            </div>
          );
        }
        return (
          <span
            className="cell-primary"
            onDoubleClick={() => handleStartTxEdit(item)}
            title={item.category}
          >
            <span
              className={`badge ${item.type === 'income' ? 'badge--receivable' : 'badge--payable'}`}
              style={{ marginRight: '6px' }}
            >
              {item.type === 'income' ? t('table.filter.income') : t('table.filter.expense')}
            </span>
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
        if (editingTxId === item.id) {
          return (
            <input
              type="text"
              className="table-inline-input"
              value={editTxDraft.note}
              onChange={(e) => setEditTxDraft((prev) => ({ ...prev, note: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleSaveTxEdit(item.id);
                if (e.key === 'Escape') handleCancelTxEdit();
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
            onDoubleClick={() => handleStartTxEdit(item)}
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
      minWidth: '130px',
      hideable: false,
      cell: (item) => {
        if (editingTxId === item.id) {
          return (
            <input
              type="number"
              className="table-inline-input"
              value={editTxDraft.amount}
              onChange={(e) => setEditTxDraft((prev) => ({ ...prev, amount: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleSaveTxEdit(item.id);
                if (e.key === 'Escape') handleCancelTxEdit();
              }}
              placeholder={t('transactions.placeholder.amount')}
              style={{ textAlign: 'right' }}
              min="0"
              required
              aria-label={t('dashboard.columns.amount')}
            />
          );
        }
        return (
          <strong
            className={item.type === 'income' ? 'text-positive' : 'text-warning'}
            onDoubleClick={() => handleStartTxEdit(item)}
          >
            {money(item.amount)}
          </strong>
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
        const isEditing = editingTxId === item.id;
        if (isEditing) {
          return (
            <div className="table-inline-actions">
              <button
                type="button"
                className="table-inline-action-btn table-inline-action-btn--save"
                onClick={() => void handleSaveTxEdit(item.id)}
                disabled={
                  updateTxMutation.isPending ||
                  !editTxDraft.category.trim() ||
                  !editTxDraft.note.trim() ||
                  !Number(editTxDraft.amount)
                }
                title={t('transactions.actions.save')}
              >
                ✓ {t('transactions.actions.save')}
              </button>
              <button
                type="button"
                className="table-inline-action-btn table-inline-action-btn--cancel"
                onClick={handleCancelTxEdit}
                disabled={updateTxMutation.isPending}
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
              onClick={() => handleStartTxEdit(item)}
              title={t('transactions.actions.edit')}
            >
              ✎ {t('transactions.actions.edit')}
            </button>
            <button
              type="button"
              className="table-inline-action-btn table-inline-action-btn--cancel"
              onClick={() => void handleDeleteTx(item.id)}
              disabled={deleteTxMutation.isPending}
              title={t('transactions.actions.delete')}
            >
              🗑
            </button>
          </div>
        );
      },
    },
  ];

  const debtColumns: DataTableColumn<DebtItem>[] = [
    {
      id: 'counterparty',
      header: t('dashboard.columns.counterparty'),
      minWidth: '180px',
      hideable: false,
      cell: (item) => {
        if (editingDebtId === item.id) {
          return (
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <select
                className="table-inline-input"
                style={{ width: '80px', flexShrink: 0 }}
                value={editDebtDraft.direction}
                onChange={(e) =>
                  setEditDebtDraft((prev) => ({
                    ...prev,
                    direction: e.target.value as 'receivable' | 'payable',
                  }))
                }
                aria-label={t('dashboard.columns.direction')}
              >
                <option value="receivable">{t('table.filter.receivable')}</option>
                <option value="payable">{t('table.filter.payable')}</option>
              </select>
              <input
                type="text"
                list="analytics-debt-contacts-autocomplete"
                className="table-inline-input"
                value={editDebtDraft.counterparty}
                onChange={(e) => handleDebtCounterpartyChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleSaveDebtEdit(item.id);
                  if (e.key === 'Escape') handleCancelDebtEdit();
                }}
                placeholder={t('debts.placeholder.counterparty')}
                autoFocus
                required
                aria-label={t('dashboard.columns.counterparty')}
              />
            </div>
          );
        }
        return (
          <span
            className="cell-primary"
            onDoubleClick={() => handleStartDebtEdit(item)}
            title={item.counterparty}
          >
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
        );
      },
    },
    {
      id: 'dueAt',
      header: t('dashboard.columns.dueDate'),
      minWidth: '120px',
      cell: (item) => {
        if (editingDebtId === item.id) {
          return (
            <input
              type="date"
              className="table-inline-input"
              value={editDebtDraft.dueAt}
              onChange={(e) => setEditDebtDraft((prev) => ({ ...prev, dueAt: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleSaveDebtEdit(item.id);
                if (e.key === 'Escape') handleCancelDebtEdit();
              }}
              aria-label={t('dashboard.columns.dueDate')}
            />
          );
        }
        return (
          <span className="cell-muted" onDoubleClick={() => handleStartDebtEdit(item)}>
            {date(item.dueAt)}
          </span>
        );
      },
    },
    {
      id: 'amount',
      header: t('dashboard.columns.remaining'),
      align: 'right',
      minWidth: '130px',
      hideable: false,
      cell: (item) => {
        if (editingDebtId === item.id) {
          return (
            <input
              type="number"
              className="table-inline-input"
              value={editDebtDraft.remainingAmount}
              onChange={(e) =>
                setEditDebtDraft((prev) => ({ ...prev, remainingAmount: e.target.value }))
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleSaveDebtEdit(item.id);
                if (e.key === 'Escape') handleCancelDebtEdit();
              }}
              placeholder={t('debts.placeholder.remainingAmount')}
              style={{ textAlign: 'right' }}
              min="0"
              step="1000"
              required
              aria-label={t('dashboard.columns.remaining')}
            />
          );
        }
        return (
          <strong onDoubleClick={() => handleStartDebtEdit(item)}>
            {money(item.remainingAmount)}
          </strong>
        );
      },
    },
    {
      id: 'actions',
      header: t('dashboard.columns.action'),
      align: 'right',
      minWidth: '120px',
      hideable: false,
      cell: (item) => {
        const isEditing = editingDebtId === item.id;
        if (isEditing) {
          return (
            <div className="table-inline-actions">
              <button
                type="button"
                className="table-inline-action-btn table-inline-action-btn--save"
                onClick={() => void handleSaveDebtEdit(item.id)}
                disabled={
                  updateDebtMutation.isPending ||
                  !editDebtDraft.counterparty.trim() ||
                  Number.isNaN(Number(editDebtDraft.remainingAmount))
                }
                title={t('debts.actions.save')}
              >
                ✓ {t('debts.actions.save')}
              </button>
              <button
                type="button"
                className="table-inline-action-btn table-inline-action-btn--cancel"
                onClick={handleCancelDebtEdit}
                disabled={updateDebtMutation.isPending}
                title={t('debts.actions.cancel')}
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
              onClick={() => handleStartDebtEdit(item)}
              title={t('debts.actions.edit')}
            >
              ✎ {t('debts.actions.edit')}
            </button>
            {item.remainingAmount > 0 && (
              <button
                type="button"
                className="table-inline-action-btn table-inline-action-btn--save"
                onClick={() => void handleQuickSettleDebt(item)}
                disabled={paymentDebtMutation.isPending}
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

  const netDebt = rawData.finance.receivable - rawData.finance.payable;

  return (
    <>
      <WorkspaceHeader
        title={t('analytics.title')}
        subtitle={t('analytics.subtitle')}
        onRefresh={refresh}
      />

      <datalist id="analytics-debt-contacts-autocomplete">
        {contactsList.map((contact) => (
          <option key={contact.id} value={contact.displayName}>
            {contact.alias ? `${contact.displayName} (${contact.alias})` : contact.displayName}
          </option>
        ))}
      </datalist>

      {toastMessage && (
        <div className="toast-notification" role="status" aria-live="polite">
          {toastMessage}
        </div>
      )}

      <PeriodFilterToolbar filter={periodFilter} />

      <TrendSummaryStrip
        income={periodIncome}
        expense={periodExpense}
        buckets={periodBuckets}
        extraMetrics={
          <article className={`metric ${netDebt >= 0 ? 'metric--positive' : 'metric--negative'}`}>
            <span>{t('dashboard.netDebt')}</span>
            <strong>{money(netDebt)}</strong>
          </article>
        }
      />

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
            id="analytics-transactions"
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
            id="analytics-debts"
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
