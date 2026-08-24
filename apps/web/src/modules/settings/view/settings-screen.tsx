'use client';

import { useState, useMemo, useTransition } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { ICategoryItem } from '@telebot/contracts';
import { useLocale } from '@/shared/providers/locale-provider';
import { DataPanel, DataTable, type DataTableColumn } from '@/shared/ui/data-table';
import { WorkspaceHeader } from '@/shared/ui/workspace-header';
import {
  categoriesQueryKeys,
  useCategoriesQuery,
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useUpdateCategoryMutation,
} from '../api/categories-query';

export function SettingsScreen() {
  const queryClient = useQueryClient();
  const { t } = useLocale();

  const [activeTab, setActiveTab] = useState<'categories' | 'preferences'>('categories');
  const [expenseSearch, setExpenseSearch] = useState('');
  const [incomeSearch, setIncomeSearch] = useState('');

  // New category inputs
  const [newExpenseName, setNewExpenseName] = useState('');
  const [newIncomeName, setNewIncomeName] = useState('');
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [isAddingIncome, setIsAddingIncome] = useState(false);

  // Edit draft
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const categoriesQuery = useCategoriesQuery();
  const createMutation = useCreateCategoryMutation();
  const updateMutation = useUpdateCategoryMutation();
  const deleteMutation = useDeleteCategoryMutation();

  const refresh = () => void queryClient.invalidateQueries({ queryKey: categoriesQueryKeys.all });

  const rawList = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);

  const expenseCategories = useMemo(() => {
    const list = rawList.filter((c) => c.type === 'expense');
    if (!expenseSearch.trim()) return list;
    const q = expenseSearch.toLowerCase();
    return list.filter((c) => c.name.toLowerCase().includes(q));
  }, [rawList, expenseSearch]);

  const incomeCategories = useMemo(() => {
    const list = rawList.filter((c) => c.type === 'income');
    if (!incomeSearch.trim()) return list;
    const q = incomeSearch.toLowerCase();
    return list.filter((c) => c.name.toLowerCase().includes(q));
  }, [rawList, incomeSearch]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      startTransition(() => setToastMessage(null));
    }, 3000);
  };

  const handleStartEdit = (category: ICategoryItem) => {
    setEditingId(category.id);
    setEditName(category.name);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const handleSaveEdit = async (id: string) => {
    const trimmed = editName.trim();
    if (!trimmed) return;
    try {
      await updateMutation.mutateAsync({ id, data: { name: trimmed } });
      setEditingId(null);
      setEditName('');
      showToast(t('settings.categories.updated'));
    } catch {
      // Error handled by mutation
    }
  };

  const handleDelete = async (category: ICategoryItem) => {
    if (!window.confirm(t('settings.categories.deleteConfirm'))) return;
    try {
      await deleteMutation.mutateAsync(category.id);
      showToast(t('settings.categories.deleted'));
    } catch {
      // Error handled by mutation
    }
  };

  const handleCreateCategory = async (type: 'income' | 'expense') => {
    const name = (type === 'expense' ? newExpenseName : newIncomeName).trim();
    if (!name) return;
    try {
      await createMutation.mutateAsync({ type, name });
      if (type === 'expense') {
        setNewExpenseName('');
        setIsAddingExpense(false);
      } else {
        setNewIncomeName('');
        setIsAddingIncome(false);
      }
      showToast(t('settings.categories.created'));
    } catch {
      // Error handled by mutation
    }
  };

  const createCategoryColumns = (): DataTableColumn<ICategoryItem>[] => [
    {
      id: 'name',
      header: t('settings.categories.name'),
      minWidth: '220px',
      hideable: false,
      cell: (item) => {
        if (editingId === item.id) {
          return (
            <input
              type="text"
              className="table-inline-input"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleSaveEdit(item.id);
                if (e.key === 'Escape') handleCancelEdit();
              }}
              autoFocus
              required
              aria-label={t('settings.categories.name')}
            />
          );
        }
        return (
          <span
            className="cell-primary"
            onDoubleClick={() => handleStartEdit(item)}
            title={item.name}
          >
            {item.name}
          </span>
        );
      },
    },
    {
      id: 'type',
      header: t('settings.categories.type'),
      minWidth: '100px',
      cell: (item) => (
        <span
          className={`badge ${item.type === 'income' ? 'badge--receivable' : 'badge--payable'}`}
        >
          {item.type === 'income' ? t('table.filter.income') : t('table.filter.expense')}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      align: 'right',
      minWidth: '130px',
      hideable: false,
      cell: (item) => {
        if (editingId === item.id) {
          return (
            <div className="table-actions">
              <button
                type="button"
                className="btn-action btn-action--save"
                onClick={() => void handleSaveEdit(item.id)}
                title={t('expenses.actions.save')}
              >
                ✓
              </button>
              <button
                type="button"
                className="btn-action btn-action--cancel"
                onClick={handleCancelEdit}
                title={t('expenses.actions.cancel')}
              >
                ✕
              </button>
            </div>
          );
        }
        return (
          <div className="table-actions">
            <button
              type="button"
              className="btn-action"
              onClick={() => handleStartEdit(item)}
              title={t('expenses.actions.edit')}
            >
              ✎
            </button>
            <button
              type="button"
              className="btn-action btn-action--delete"
              onClick={() => void handleDelete(item)}
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
        title={t('settings.title')}
        subtitle={t('settings.subtitle')}
        onRefresh={refresh}
      />

      {toastMessage && (
        <div className="toast-notification" role="status" aria-live="polite">
          {toastMessage}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          type="button"
          className={`filter-pill ${activeTab === 'categories' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          {t('settings.tabs.categories')}
        </button>
        <button
          type="button"
          className={`filter-pill ${activeTab === 'preferences' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('preferences')}
        >
          {t('settings.tabs.preferences')}
        </button>
      </div>

      {categoriesQuery.isError ? (
        <section className="inline-alert" role="alert">
          <strong>{t('dashboard.error.title')}</strong>
          <button type="button" onClick={refresh}>
            {t('common.retry')}
          </button>
        </section>
      ) : activeTab === 'categories' ? (
        <div
          className="content-grid"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))' }}
        >
          {/* Expense Categories Panel */}
          <DataPanel
            title={t('settings.categories.expenseTitle')}
            counter={t('settings.categories.count', { count: expenseCategories.length })}
            toolbar={
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="search"
                  className="table-search-input"
                  placeholder={t('table.searchPlaceholder')}
                  value={expenseSearch}
                  onChange={(e) => setExpenseSearch(e.target.value)}
                  aria-label={t('table.searchPlaceholder')}
                />
                {!isAddingExpense && (
                  <button
                    type="button"
                    className="filter-pill is-active"
                    onClick={() => setIsAddingExpense(true)}
                  >
                    {t('settings.categories.addExpense')}
                  </button>
                )}
              </div>
            }
          >
            {isAddingExpense && (
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--border)',
                  background: 'var(--bg-subtle)',
                }}
              >
                <input
                  type="text"
                  className="table-inline-input"
                  style={{ flex: 1 }}
                  placeholder={t('settings.categories.namePlaceholder')}
                  value={newExpenseName}
                  onChange={(e) => setNewExpenseName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void handleCreateCategory('expense');
                    if (e.key === 'Escape') setIsAddingExpense(false);
                  }}
                  autoFocus
                />
                <button
                  type="button"
                  className="btn-action btn-action--save"
                  onClick={() => void handleCreateCategory('expense')}
                  title={t('expenses.actions.save')}
                >
                  ✓
                </button>
                <button
                  type="button"
                  className="btn-action btn-action--cancel"
                  onClick={() => {
                    setIsAddingExpense(false);
                    setNewExpenseName('');
                  }}
                  title={t('expenses.actions.cancel')}
                >
                  ✕
                </button>
              </div>
            )}
            <DataTable
              id="settings-expense-categories"
              ariaLabel={t('settings.categories.expenseTitle')}
              rows={expenseCategories}
              loading={categoriesQuery.isLoading}
              emptyMessage={t('settings.categories.empty')}
              columns={createCategoryColumns()}
              getRowKey={(item) => item.id}
            />
          </DataPanel>

          {/* Income Categories Panel */}
          <DataPanel
            title={t('settings.categories.incomeTitle')}
            counter={t('settings.categories.count', { count: incomeCategories.length })}
            toolbar={
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="search"
                  className="table-search-input"
                  placeholder={t('table.searchPlaceholder')}
                  value={incomeSearch}
                  onChange={(e) => setIncomeSearch(e.target.value)}
                  aria-label={t('table.searchPlaceholder')}
                />
                {!isAddingIncome && (
                  <button
                    type="button"
                    className="filter-pill is-active"
                    onClick={() => setIsAddingIncome(true)}
                  >
                    {t('settings.categories.addIncome')}
                  </button>
                )}
              </div>
            }
          >
            {isAddingIncome && (
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--border)',
                  background: 'var(--bg-subtle)',
                }}
              >
                <input
                  type="text"
                  className="table-inline-input"
                  style={{ flex: 1 }}
                  placeholder={t('settings.categories.namePlaceholder')}
                  value={newIncomeName}
                  onChange={(e) => setNewIncomeName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void handleCreateCategory('income');
                    if (e.key === 'Escape') setIsAddingIncome(false);
                  }}
                  autoFocus
                />
                <button
                  type="button"
                  className="btn-action btn-action--save"
                  onClick={() => void handleCreateCategory('income')}
                  title={t('expenses.actions.save')}
                >
                  ✓
                </button>
                <button
                  type="button"
                  className="btn-action btn-action--cancel"
                  onClick={() => {
                    setIsAddingIncome(false);
                    setNewIncomeName('');
                  }}
                  title={t('expenses.actions.cancel')}
                >
                  ✕
                </button>
              </div>
            )}
            <DataTable
              id="settings-income-categories"
              ariaLabel={t('settings.categories.incomeTitle')}
              rows={incomeCategories}
              loading={categoriesQuery.isLoading}
              emptyMessage={t('settings.categories.empty')}
              columns={createCategoryColumns()}
              getRowKey={(item) => item.id}
            />
          </DataPanel>
        </div>
      ) : (
        <section className="content-grid content-grid--wide">
          <DataPanel title={t('settings.tabs.preferences')} description={t('settings.subtitle')}>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <article
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <div>
                  <strong>{t('common.language')}</strong>
                  <p className="cell-muted" style={{ margin: '4px 0 0' }}>
                    {t('settings.preferences.languageDescription')}
                  </p>
                </div>
                <span className="badge badge--completed">
                  {t('settings.preferences.supported')}
                </span>
              </article>
              <article
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <div>
                  <strong>{t('settings.preferences.themeTitle')}</strong>
                  <p className="cell-muted" style={{ margin: '4px 0 0' }}>
                    {t('settings.preferences.themeDescription')}
                  </p>
                </div>
                <span className="badge badge--completed">
                  {t('settings.preferences.supported')}
                </span>
              </article>
            </div>
          </DataPanel>
        </section>
      )}
    </>
  );
}
