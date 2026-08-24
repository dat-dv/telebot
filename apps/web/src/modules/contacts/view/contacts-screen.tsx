'use client';

import { useState, useMemo, useTransition } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { localeTag, type IContactListItem } from '@telebot/contracts';
import { useLocale } from '@/shared/providers/locale-provider';
import { DataPanel, DataTable, type DataTableColumn } from '@/shared/ui/data-table';
import { WorkspaceHeader } from '@/shared/ui/workspace-header';
import {
  contactsQueryKeys,
  useContactsQuery,
  useUpdateContactMutation,
} from '../api/contacts-query';
import { CombineContactsDialog } from './combine-contacts-dialog';

export function ContactsScreen() {
  const queryClient = useQueryClient();
  const { locale, t } = useLocale();
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{
    displayName: string;
    alias: string;
    descriptor: string;
    phoneNumber: string;
    bankAccountNumber: string;
    bankName: string;
  }>({
    displayName: '',
    alias: '',
    descriptor: '',
    phoneNumber: '',
    bankAccountNumber: '',
    bankName: '',
  });
  const [isCombineOpen, setIsCombineOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const contacts = useContactsQuery();
  const updateMutation = useUpdateContactMutation();

  const refresh = () => void queryClient.invalidateQueries({ queryKey: contactsQueryKeys.list() });

  const rawList = useMemo(() => contacts.data ?? [], [contacts.data]);

  const filteredContacts = useMemo(() => {
    if (!search.trim()) return rawList;
    const query = search.toLowerCase();
    return rawList.filter(
      (item) =>
        item.displayName.toLowerCase().includes(query) ||
        (item.alias && item.alias.toLowerCase().includes(query)) ||
        (item.descriptor && item.descriptor.toLowerCase().includes(query)),
    );
  }, [rawList, search]);

  const selectedContacts = useMemo(() => {
    return rawList.filter((c) => selectedIds.has(c.id));
  }, [rawList, selectedIds]);

  const date = (value?: string) =>
    value
      ? new Intl.DateTimeFormat(localeTag(locale), {
          dateStyle: 'short',
          timeStyle: 'short',
        }).format(new Date(value))
      : t('common.notSet');

  // Toggle single row selection
  const handleToggleRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Toggle select all filtered rows
  const handleToggleSelectAll = () => {
    if (selectedIds.size === filteredContacts.length && filteredContacts.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredContacts.map((c) => c.id)));
    }
  };

  // Start inline editing
  const handleStartEdit = (contact: IContactListItem) => {
    setEditingId(contact.id);
    setEditDraft({
      displayName: contact.displayName,
      alias: contact.alias || '',
      descriptor: contact.descriptor || '',
      phoneNumber: contact.phoneNumber || '',
      bankAccountNumber: contact.bankAccountNumber || '',
      bankName: contact.bankName || '',
    });
  };

  // Cancel inline editing
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditDraft({
      displayName: '',
      alias: '',
      descriptor: '',
      phoneNumber: '',
      bankAccountNumber: '',
      bankName: '',
    });
  };

  // Save inline editing
  const handleSaveEdit = async (id: string) => {
    const trimmedName = editDraft.displayName.trim();
    if (!trimmedName) return;

    try {
      await updateMutation.mutateAsync({
        id,
        data: {
          displayName: trimmedName,
          alias: editDraft.alias.trim() || undefined,
          descriptor: editDraft.descriptor.trim() || undefined,
          phoneNumber: editDraft.phoneNumber?.trim() || undefined,
          bankAccountNumber: editDraft.bankAccountNumber?.trim() || undefined,
          bankName: editDraft.bankName?.trim() || undefined,
        },
      });
      setEditingId(null);
      showToast(t('contacts.inlineEdit.saved'));
    } catch {
      // Error handled by mutation
    }
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      startTransition(() => {
        setToastMessage(null);
      });
    }, 3000);
  };

  const contactColumns: DataTableColumn<IContactListItem>[] = [
    {
      id: 'select',
      header: (
        <label className="table-select-cell">
          <input
            type="checkbox"
            className="table-select-checkbox"
            checked={filteredContacts.length > 0 && selectedIds.size === filteredContacts.length}
            onChange={handleToggleSelectAll}
            aria-label={t('contacts.selectAll')}
          />
        </label>
      ),
      label: t('contacts.selectAll'),
      minWidth: '44px',
      width: '44px',
      hideable: false,
      cell: (item) => (
        <label className="table-select-cell">
          <input
            type="checkbox"
            className="table-select-checkbox"
            checked={selectedIds.has(item.id)}
            onChange={() => handleToggleRow(item.id)}
            aria-label={item.displayName}
          />
        </label>
      ),
    },
    {
      id: 'displayName',
      header: t('dashboard.columns.name'),
      minWidth: '180px',
      hideable: false,
      cell: (item) => {
        if (editingId === item.id) {
          return (
            <input
              type="text"
              className="table-inline-input"
              value={editDraft.displayName}
              onChange={(e) => setEditDraft((prev) => ({ ...prev, displayName: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleSaveEdit(item.id);
                if (e.key === 'Escape') handleCancelEdit();
              }}
              placeholder={t('contacts.placeholder.name')}
              autoFocus
              required
            />
          );
        }
        return (
          <span
            className="cell-primary"
            onDoubleClick={() => handleStartEdit(item)}
            title={item.displayName}
          >
            {item.displayName}
          </span>
        );
      },
    },
    {
      id: 'alias',
      header: t('dashboard.columns.alias'),
      minWidth: '130px',
      cell: (item) => {
        if (editingId === item.id) {
          return (
            <input
              type="text"
              className="table-inline-input"
              value={editDraft.alias}
              onChange={(e) => setEditDraft((prev) => ({ ...prev, alias: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleSaveEdit(item.id);
                if (e.key === 'Escape') handleCancelEdit();
              }}
              placeholder={t('contacts.placeholder.alias')}
            />
          );
        }
        return (
          <span className="cell-muted" onDoubleClick={() => handleStartEdit(item)}>
            {item.alias || '—'}
          </span>
        );
      },
    },
    {
      id: 'descriptor',
      header: t('dashboard.columns.descriptor'),
      minWidth: '240px',
      cell: (item) => {
        if (editingId === item.id) {
          return (
            <input
              type="text"
              className="table-inline-input"
              value={editDraft.descriptor}
              onChange={(e) => setEditDraft((prev) => ({ ...prev, descriptor: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleSaveEdit(item.id);
                if (e.key === 'Escape') handleCancelEdit();
              }}
              placeholder={t('contacts.placeholder.descriptor')}
            />
          );
        }
        return (
          <span
            className="cell-muted"
            onDoubleClick={() => handleStartEdit(item)}
            title={item.descriptor}
          >
            {item.descriptor || '—'}
          </span>
        );
      },
    },
    {
      id: 'phoneNumber',
      header: t('contacts.columns.phone'),
      minWidth: '130px',
      defaultHidden: false,
      cell: (item) => {
        if (editingId === item.id) {
          return (
            <input
              type="text"
              className="table-inline-input"
              value={editDraft.phoneNumber}
              onChange={(e) => setEditDraft((prev) => ({ ...prev, phoneNumber: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleSaveEdit(item.id);
                if (e.key === 'Escape') handleCancelEdit();
              }}
              placeholder={t('contacts.placeholder.phone')}
            />
          );
        }
        return (
          <span className="cell-muted" onDoubleClick={() => handleStartEdit(item)}>
            {item.phoneNumber || '—'}
          </span>
        );
      },
    },
    {
      id: 'bankAccountNumber',
      header: t('contacts.columns.bankAccount'),
      minWidth: '150px',
      defaultHidden: false,
      cell: (item) => {
        if (editingId === item.id) {
          return (
            <input
              type="text"
              className="table-inline-input"
              value={editDraft.bankAccountNumber}
              onChange={(e) =>
                setEditDraft((prev) => ({ ...prev, bankAccountNumber: e.target.value }))
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleSaveEdit(item.id);
                if (e.key === 'Escape') handleCancelEdit();
              }}
              placeholder={t('contacts.placeholder.bankAccount')}
            />
          );
        }
        return (
          <span className="cell-code" onDoubleClick={() => handleStartEdit(item)}>
            {item.bankAccountNumber || '—'}
          </span>
        );
      },
    },
    {
      id: 'bankName',
      header: t('contacts.columns.bankName'),
      minWidth: '120px',
      defaultHidden: false,
      cell: (item) => {
        if (editingId === item.id) {
          return (
            <input
              type="text"
              className="table-inline-input"
              value={editDraft.bankName}
              onChange={(e) => setEditDraft((prev) => ({ ...prev, bankName: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleSaveEdit(item.id);
                if (e.key === 'Escape') handleCancelEdit();
              }}
              placeholder={t('contacts.placeholder.bankName')}
            />
          );
        }
        return (
          <span className="cell-muted" onDoubleClick={() => handleStartEdit(item)}>
            {item.bankName || '—'}
          </span>
        );
      },
    },
    {
      id: 'createdAt',
      header: t('dashboard.columns.date'),
      align: 'right',
      minWidth: '130px',
      cell: (item) => <span className="cell-muted">{date(item.createdAt)}</span>,
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
                disabled={updateMutation.isPending || !editDraft.displayName.trim()}
                title={t('contacts.actions.save')}
              >
                ✓ {t('contacts.actions.save')}
              </button>
              <button
                type="button"
                className="table-inline-action-btn table-inline-action-btn--cancel"
                onClick={handleCancelEdit}
                disabled={updateMutation.isPending}
                title={t('contacts.actions.cancel')}
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
              title={t('contacts.actions.edit')}
            >
              ✎ {t('contacts.actions.edit')}
            </button>
          </div>
        );
      },
    },
  ];

  const isPartiallySelected = selectedIds.size > 0 && selectedIds.size < filteredContacts.length;

  return (
    <>
      <WorkspaceHeader
        title={t('contacts.title')}
        subtitle={t('contacts.subtitle')}
        onRefresh={refresh}
      />

      {toastMessage && (
        <div className="toast-notification" role="status" aria-live="polite">
          {toastMessage}
        </div>
      )}

      {contacts.isError ? (
        <section className="inline-alert" role="alert">
          <strong>{t('dashboard.error.title')}</strong>
          <button type="button" onClick={refresh}>
            {t('common.retry')}
          </button>
        </section>
      ) : (
        <section className="content-grid content-grid--wide">
          <DataPanel
            title={t('contacts.title')}
            description={t('contacts.subtitle')}
            counter={t('table.rowsCount', { count: filteredContacts.length })}
            toolbar={
              <div className="contacts-toolbar">
                {selectedIds.size >= 2 && (
                  <button
                    type="button"
                    className="btn btn--primary btn--sm"
                    onClick={() => setIsCombineOpen(true)}
                  >
                    {t('contacts.actions.combine', { count: selectedIds.size })}
                  </button>
                )}
                {filteredContacts.length > 0 && (
                  <button
                    type="button"
                    className={`filter-pill ${selectedIds.size === filteredContacts.length ? 'is-active' : ''}`}
                    onClick={handleToggleSelectAll}
                  >
                    {selectedIds.size === filteredContacts.length
                      ? t('contacts.deselectAll')
                      : t('contacts.selectAll')}
                  </button>
                )}
                {isPartiallySelected && (
                  <button
                    type="button"
                    className="filter-pill is-active"
                    onClick={() => setSelectedIds(new Set())}
                    title={t('contacts.deselectAll')}
                  >
                    {t('contacts.selectedCount', { count: selectedIds.size })} ✕
                  </button>
                )}
                <input
                  type="search"
                  className="table-search-input"
                  placeholder={t('table.searchPlaceholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label={t('table.searchPlaceholder')}
                />
              </div>
            }
          >
            <DataTable
              id="contacts"
              ariaLabel={t('contacts.title')}
              rows={filteredContacts}
              loading={contacts.isLoading}
              emptyMessage={t('dashboard.noContacts')}
              columns={contactColumns}
              getRowKey={(item) => item.id}
            />
          </DataPanel>
        </section>
      )}

      <CombineContactsDialog
        isOpen={isCombineOpen}
        selectedContacts={selectedContacts}
        onClose={() => setIsCombineOpen(false)}
        onSuccess={(count) => {
          setSelectedIds(new Set());
          showToast(t('contacts.combine.success', { count }));
        }}
      />
    </>
  );
}
