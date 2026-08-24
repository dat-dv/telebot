'use client';

import { useState, useMemo, useTransition } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { localeTag, type IDebtListItem } from '@telebot/contracts';
import { useLocale } from '@/shared/providers/locale-provider';
import { DataPanel, DataTable, type DataTableColumn } from '@/shared/ui/data-table';
import { WorkspaceHeader } from '@/shared/ui/workspace-header';
import { useContactsQuery } from '@/modules/contacts/api/contacts-query';
import {
  debtsQueryKeys,
  useCreateDebtPaymentMutation,
  useDebtsQuery,
  useUpdateDebtMutation,
} from '../api/debts-query';

type DirectionFilter = 'all' | 'receivable' | 'payable';

export function DebtsScreen() {
  const queryClient = useQueryClient();
  const { locale, t } = useLocale();
  const [filter, setFilter] = useState<DirectionFilter>('all');
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

  const totalReceivable = useMemo(
    () =>
      rawList
        .filter((d) => d.direction === 'receivable')
        .reduce((sum, d) => sum + d.remainingAmount, 0),
    [rawList],
  );
  const totalPayable = useMemo(
    () =>
      rawList
        .filter((d) => d.direction === 'payable')
        .reduce((sum, d) => sum + d.remainingAmount, 0),
    [rawList],
  );

  const filteredDebts = useMemo(() => {
    return rawList.filter((item) => {
      if (filter !== 'all' && item.direction !== filter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        item.counterparty.toLowerCase().includes(q) ||
        (item.counterpartyAlias && item.counterpartyAlias.toLowerCase().includes(q)) ||
        (item.note && item.note.toLowerCase().includes(q))
      );
    });
  }, [rawList, filter, search]);

  const money = (value: number) =>
    new Intl.NumberFormat(localeTag(locale), {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value);

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
      id: 'direction',
      header: t('dashboard.columns.direction'),
      minWidth: '100px',
      cell: (item) => {
        if (editingId === item.id) {
          return (
            <select
              className="table-inline-input"
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
            className={`badge ${item.direction === 'receivable' ? 'badge--receivable' : 'badge--payable'}`}
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
              className="table-inline-input"
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
            className="cell-primary"
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
              className="table-inline-input"
              value={editDraft.originalAmount}
              onChange={(e) =>
                setEditDraft((prev) => ({ ...prev, originalAmount: e.target.value }))
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleSaveEdit(item.id);
                if (e.key === 'Escape') handleCancelEdit();
              }}
              placeholder={t('debts.placeholder.originalAmount')}
              style={{ textAlign: 'right' }}
              min="0"
              step="1000"
              required
              aria-label={t('dashboard.columns.original')}
            />
          );
        }
        return (
          <span onDoubleClick={() => handleStartEdit(item)}>{money(item.originalAmount)}</span>
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
              className="table-inline-input"
              value={editDraft.remainingAmount}
              onChange={(e) =>
                setEditDraft((prev) => ({ ...prev, remainingAmount: e.target.value }))
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleSaveEdit(item.id);
                if (e.key === 'Escape') handleCancelEdit();
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
          <strong onDoubleClick={() => handleStartEdit(item)}>{money(item.remainingAmount)}</strong>
        );
      },
    },
    {
      id: 'currency',
      header: t('debts.columns.currency'),
      minWidth: '80px',
      cell: (item) => <span className="badge">{item.currency || 'VND'}</span>,
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
              className="table-inline-input"
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
          <span className="cell-muted" onDoubleClick={() => handleStartEdit(item)}>
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
        <span className="cell-muted">{item.settledAt ? date(item.settledAt) : '—'}</span>
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
              className="table-inline-input"
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
      id: 'actions',
      header: t('dashboard.columns.action'),
      align: 'right',
      minWidth: '120px',
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
                className="table-inline-action-btn table-inline-action-btn--cancel"
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
          <div className="table-inline-actions">
            <button
              type="button"
              className="table-inline-action-btn"
              onClick={() => handleStartEdit(item)}
              title={t('debts.actions.edit')}
            >
              ✎ {t('debts.actions.edit')}
            </button>
            {item.remainingAmount > 0 && !item.settledAt && (
              <button
                type="button"
                className="table-inline-action-btn table-inline-action-btn--save"
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
    <>
      <WorkspaceHeader
        title={t('debts.title')}
        subtitle={t('debts.subtitle')}
        onRefresh={refresh}
      />

      <datalist id="debt-contacts-autocomplete">
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

      <section className="metric-grid" aria-label={t('debts.title')}>
        <article className="metric metric--positive">
          <span>{t('dashboard.receivableTotal')}</span>
          <strong>{money(totalReceivable)}</strong>
        </article>
        <article className="metric metric--warning">
          <span>{t('dashboard.payableTotal')}</span>
          <strong>{money(totalPayable)}</strong>
        </article>
        <article
          className={`metric ${totalReceivable >= totalPayable ? 'metric--positive' : 'metric--negative'}`}
        >
          <span>{t('dashboard.netDebt')}</span>
          <strong>{money(totalReceivable - totalPayable)}</strong>
        </article>
      </section>

      {debts.isError ? (
        <section className="inline-alert" role="alert">
          <strong>{t('dashboard.error.title')}</strong>
          <button type="button" onClick={refresh}>
            {t('common.retry')}
          </button>
        </section>
      ) : (
        <section className="content-grid content-grid--wide">
          <DataPanel
            title={t('dashboard.openDebts')}
            description={t('debts.subtitle')}
            counter={t('table.rowsCount', { count: filteredDebts.length })}
            toolbar={
              <>
                <button
                  type="button"
                  className={`filter-pill ${filter === 'all' ? 'is-active' : ''}`}
                  onClick={() => setFilter('all')}
                >
                  {t('table.filter.all')}
                </button>
                <button
                  type="button"
                  className={`filter-pill ${filter === 'receivable' ? 'is-active' : ''}`}
                  onClick={() => setFilter('receivable')}
                >
                  {t('table.filter.receivable')}
                </button>
                <button
                  type="button"
                  className={`filter-pill ${filter === 'payable' ? 'is-active' : ''}`}
                  onClick={() => setFilter('payable')}
                >
                  {t('table.filter.payable')}
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
    </>
  );
}
