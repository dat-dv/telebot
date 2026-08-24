'use client';

import { useState, useMemo, useTransition } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { localeTag, type ITaskListItem } from '@telebot/contracts';
import { useLocale } from '@/shared/providers/locale-provider';
import { DataPanel, DataTable, type DataTableColumn } from '@/shared/ui/data-table';
import { WorkspaceHeader } from '@/shared/ui/workspace-header';
import { usePeriodFilter, type PeriodGrain } from '@/shared/hooks/use-period-filter';
import { PeriodFilterToolbar } from '@/shared/ui/period-filter-toolbar';
import {
  tasksQueryKeys,
  useTasksQuery,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
} from '@/modules/tasks/api/tasks-query';
import { dashboardQueryKeys, useDashboardQuery } from '../api/dashboard-query';

const TASK_GRAINS: PeriodGrain[] = ['day', 'week', 'month', 'quarter', 'year', 'all'];

export function TasksScreen() {
  const queryClient = useQueryClient();
  const { locale, t } = useLocale();
  const periodFilter = usePeriodFilter('month');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'needsAction' | 'completed'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{
    title: string;
    notes: string;
    due: string;
    status: 'needsAction' | 'completed';
  }>({
    title: '',
    notes: '',
    due: '',
    status: 'needsAction',
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const dashboard = useDashboardQuery();
  const tasksQuery = useTasksQuery();
  const updateMutation = useUpdateTaskMutation();
  const deleteMutation = useDeleteTaskMutation();

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: tasksQueryKeys.list() });
    void queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.detail() });
  };

  const rawList = useMemo(() => {
    if (tasksQuery.data && tasksQuery.data.length > 0) {
      return tasksQuery.data;
    }
    return dashboard.data?.tasks ?? [];
  }, [tasksQuery.data, dashboard.data?.tasks]);

  const isGoogleConnected = dashboard.data?.user.googleConnected;

  // 1. Filter by period first
  const periodTasks = useMemo(() => {
    return rawList.filter((item) => {
      const dateToCheck = item.dueAt || item.updatedAt;
      return periodFilter.isItemInPeriod(dateToCheck);
    });
  }, [rawList, periodFilter]);

  // 2. Compute quick summary stats for selected period
  const stats = useMemo(() => {
    let pending = 0;
    let completed = 0;
    let overdue = 0;
    const now = new Date();

    for (const task of periodTasks) {
      const isCompleted = task.status === 'completed';
      if (isCompleted) {
        completed++;
      } else {
        pending++;
        if (task.dueAt && new Date(task.dueAt) < now) {
          overdue++;
        }
      }
    }

    return {
      total: periodTasks.length,
      pending,
      completed,
      overdue,
    };
  }, [periodTasks]);

  // 3. Filter by status & search
  const filteredTasks = useMemo(() => {
    return periodTasks.filter((item) => {
      if (statusFilter !== 'all') {
        const itemStatus = item.status || 'needsAction';
        if (itemStatus !== statusFilter) return false;
      }
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) || (item.notes && item.notes.toLowerCase().includes(q))
      );
    });
  }, [periodTasks, statusFilter, search]);

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

  const handleStartEdit = (task: ITaskListItem) => {
    setEditingId(task.id);
    setEditDraft({
      title: task.title,
      notes: task.notes || '',
      due: task.dueAt ? task.dueAt.slice(0, 10) : '',
      status: task.status || 'needsAction',
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditDraft({
      title: '',
      notes: '',
      due: '',
      status: 'needsAction',
    });
  };

  const handleSaveEdit = async (id: string) => {
    const trimmedTitle = editDraft.title.trim();
    if (!trimmedTitle) return;

    try {
      await updateMutation.mutateAsync({
        id,
        data: {
          title: trimmedTitle,
          notes: editDraft.notes.trim() || undefined,
          due: editDraft.due ? new Date(`${editDraft.due}T23:59:59.000Z`).toISOString() : undefined,
          status: editDraft.status,
        },
      });
      setEditingId(null);
      showToast(t('tasks.inlineEdit.saved'));
    } catch {
      // Error handled by mutation
    }
  };

  const handleToggleStatus = async (task: ITaskListItem) => {
    const newStatus: 'needsAction' | 'completed' =
      task.status === 'completed' ? 'needsAction' : 'completed';
    try {
      await updateMutation.mutateAsync({
        id: task.id,
        data: {
          status: newStatus,
        },
      });
      showToast(t('tasks.inlineEdit.saved'));
    } catch {
      // Error handled by mutation
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('tasks.delete.confirm'))) return;
    try {
      await deleteMutation.mutateAsync(id);
      showToast(t('tasks.delete.success'));
    } catch {
      // Error handled by mutation
    }
  };

  const taskColumns: DataTableColumn<ITaskListItem>[] = [
    {
      id: 'status',
      header: t('tasks.columns.status'),
      minWidth: '130px',
      width: '130px',
      hideable: false,
      cell: (item) => {
        const isEditing = editingId === item.id;
        if (isEditing) {
          return (
            <select
              className="table-inline-input"
              value={editDraft.status}
              onChange={(e) =>
                setEditDraft((prev) => ({
                  ...prev,
                  status: e.target.value as 'needsAction' | 'completed',
                }))
              }
              aria-label={t('tasks.columns.status')}
            >
              <option value="needsAction">{t('tasks.status.needsAction')}</option>
              <option value="completed">{t('tasks.status.completed')}</option>
            </select>
          );
        }

        const isCompleted = item.status === 'completed';
        return (
          <label
            className="table-select-cell"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
          >
            <input
              type="checkbox"
              className="table-select-checkbox"
              checked={isCompleted}
              onChange={() => void handleToggleStatus(item)}
              aria-label={t('tasks.actions.complete')}
            />
            <span className={isCompleted ? 'badge badge--completed' : 'badge badge--pending'}>
              {isCompleted ? t('tasks.status.completed') : t('tasks.status.needsAction')}
            </span>
          </label>
        );
      },
    },
    {
      id: 'title',
      header: t('dashboard.columns.title'),
      minWidth: '220px',
      hideable: false,
      cell: (item) => {
        if (editingId === item.id) {
          return (
            <input
              type="text"
              className="table-inline-input"
              value={editDraft.title}
              onChange={(e) => setEditDraft((prev) => ({ ...prev, title: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleSaveEdit(item.id);
                if (e.key === 'Escape') handleCancelEdit();
              }}
              placeholder={t('tasks.placeholder.title')}
              autoFocus
              required
              aria-label={t('dashboard.columns.title')}
            />
          );
        }
        return (
          <span
            className="cell-primary"
            onDoubleClick={() => handleStartEdit(item)}
            title={item.title}
            style={{
              textDecoration: item.status === 'completed' ? 'line-through' : 'none',
              opacity: item.status === 'completed' ? 0.7 : 1,
            }}
          >
            {item.title}
          </span>
        );
      },
    },
    {
      id: 'notes',
      header: t('tasks.columns.notes'),
      minWidth: '200px',
      cell: (item) => {
        if (editingId === item.id) {
          return (
            <input
              type="text"
              className="table-inline-input"
              value={editDraft.notes}
              onChange={(e) => setEditDraft((prev) => ({ ...prev, notes: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleSaveEdit(item.id);
                if (e.key === 'Escape') handleCancelEdit();
              }}
              placeholder={t('tasks.placeholder.notes')}
              aria-label={t('tasks.columns.notes')}
            />
          );
        }
        return (
          <span
            className="cell-muted"
            onDoubleClick={() => handleStartEdit(item)}
            title={item.notes}
          >
            {item.notes || '—'}
          </span>
        );
      },
    },
    {
      id: 'dueAt',
      header: t('dashboard.columns.dueDate'),
      align: 'right',
      minWidth: '150px',
      cell: (item) => {
        if (editingId === item.id) {
          return (
            <input
              type="date"
              className="table-inline-input"
              value={editDraft.due}
              onChange={(e) => setEditDraft((prev) => ({ ...prev, due: e.target.value }))}
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
      id: 'updatedAt',
      header: t('tasks.columns.updatedAt'),
      align: 'right',
      minWidth: '130px',
      defaultHidden: false,
      cell: (item) => <span className="cell-muted">{date(item.updatedAt)}</span>,
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
                disabled={updateMutation.isPending || !editDraft.title.trim()}
                title={t('tasks.actions.save')}
              >
                ✓ {t('tasks.actions.save')}
              </button>
              <button
                type="button"
                className="table-inline-action-btn table-inline-action-btn--cancel"
                onClick={handleCancelEdit}
                disabled={updateMutation.isPending}
                title={t('tasks.actions.cancel')}
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
              title={t('tasks.actions.edit')}
            >
              ✎ {t('tasks.actions.edit')}
            </button>
            <button
              type="button"
              className="table-inline-action-btn table-inline-action-btn--cancel"
              onClick={() => void handleDelete(item.id)}
              disabled={deleteMutation.isPending}
              title={t('tasks.actions.delete')}
            >
              🗑
            </button>
          </div>
        );
      },
    },
  ];

  const isLoading = dashboard.isLoading || tasksQuery.isLoading;
  const isError = dashboard.isError && tasksQuery.isError;

  return (
    <>
      <WorkspaceHeader
        title={t('tasks.title')}
        subtitle={t('tasks.subtitle')}
        onRefresh={refresh}
      />

      {toastMessage && (
        <div className="toast-notification" role="status" aria-live="polite">
          {toastMessage}
        </div>
      )}

      <PeriodFilterToolbar filter={periodFilter} grains={TASK_GRAINS} />

      {isError ? (
        <section className="inline-alert" role="alert">
          <strong>{t('dashboard.error.title')}</strong>
          <button type="button" onClick={refresh}>
            {t('common.retry')}
          </button>
        </section>
      ) : (
        <section className="content-grid content-grid--wide">
          <DataPanel
            title={t('dashboard.tasks')}
            description={isGoogleConnected ? undefined : t('dashboard.connectGoogleTip')}
            counter={t('table.rowsCount', { count: filteredTasks.length })}
            toolbar={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'inline-flex', gap: '4px' }}>
                  <button
                    type="button"
                    className={`filter-pill ${statusFilter === 'all' ? 'is-active' : ''}`}
                    onClick={() => setStatusFilter('all')}
                  >
                    {t('tasks.filter.all')} ({stats.total})
                  </button>
                  <button
                    type="button"
                    className={`filter-pill ${statusFilter === 'needsAction' ? 'is-active' : ''}`}
                    onClick={() => setStatusFilter('needsAction')}
                  >
                    {t('tasks.filter.needsAction')} ({stats.pending})
                  </button>
                  <button
                    type="button"
                    className={`filter-pill ${statusFilter === 'completed' ? 'is-active' : ''}`}
                    onClick={() => setStatusFilter('completed')}
                  >
                    {t('tasks.filter.completed')} ({stats.completed})
                  </button>
                </div>
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
              id="tasks"
              ariaLabel={t('dashboard.tasks')}
              rows={filteredTasks}
              loading={isLoading}
              emptyMessage={t('dashboard.noTasks')}
              columns={taskColumns}
              getRowKey={(item) => item.id}
            />
          </DataPanel>
        </section>
      )}
    </>
  );
}
