'use client';

import { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { localeTag, type IContactListItem } from '@telebot/contracts';
import { useLocale } from '@/shared/providers/locale-provider';
import { DataPanel, DataTable, type DataTableColumn } from '@/shared/ui/data-table';
import { WorkspaceHeader } from '@/shared/ui/workspace-header';
import { contactsQueryKeys, useContactsQuery } from '../api/contacts-query';

export function ContactsScreen() {
  const queryClient = useQueryClient();
  const { locale, t } = useLocale();
  const [search, setSearch] = useState('');
  const contacts = useContactsQuery();

  const refresh = () => void queryClient.invalidateQueries({ queryKey: contactsQueryKeys.list() });

  const filteredContacts = useMemo(() => {
    const rawList = contacts.data ?? [];
    if (!search.trim()) return rawList;
    const query = search.toLowerCase();
    return rawList.filter(
      (item) =>
        item.displayName.toLowerCase().includes(query) ||
        (item.alias && item.alias.toLowerCase().includes(query)) ||
        (item.descriptor && item.descriptor.toLowerCase().includes(query)),
    );
  }, [contacts.data, search]);

  const date = (value?: string) =>
    value
      ? new Intl.DateTimeFormat(localeTag(locale), {
          dateStyle: 'short',
          timeStyle: 'short',
        }).format(new Date(value))
      : t('common.notSet');

  const contactColumns: DataTableColumn<IContactListItem>[] = [
    {
      id: 'displayName',
      header: t('dashboard.columns.name'),
      cell: (item) => <span className="cell-primary">{item.displayName}</span>,
    },
    {
      id: 'alias',
      header: t('dashboard.columns.alias'),
      cell: (item) => <span className="cell-muted">{item.alias || '—'}</span>,
    },
    {
      id: 'descriptor',
      header: t('dashboard.columns.descriptor'),
      cell: (item) => <span className="cell-muted">{item.descriptor || '—'}</span>,
    },
    {
      id: 'createdAt',
      header: t('dashboard.columns.date'),
      align: 'right',
      cell: (item) => <span className="cell-muted">{date(item.createdAt)}</span>,
    },
  ];

  return (
    <>
      <WorkspaceHeader
        title={t('contacts.title')}
        subtitle={t('contacts.subtitle')}
        onRefresh={refresh}
      />

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
              <input
                type="search"
                className="table-search-input"
                placeholder={t('table.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label={t('table.searchPlaceholder')}
              />
            }
          >
            <DataTable
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
    </>
  );
}
