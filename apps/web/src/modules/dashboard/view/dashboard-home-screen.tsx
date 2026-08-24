'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { APP_ROUTES, localeTag } from '@telebot/contracts';
import { useLocale } from '@/shared/providers/locale-provider';
import { DataPanel, DataTable, type DataTableColumn } from '@/shared/ui/data-table';
import { WorkspaceHeader } from '@/shared/ui/workspace-header';
import { dashboardQueryKeys, useDashboardQuery } from '../api/dashboard-query';

type DashboardData = NonNullable<ReturnType<typeof useDashboardQuery>['data']>;

export function DashboardHomeScreen() {
  const queryClient = useQueryClient();
  const { t } = useLocale();
  const dashboard = useDashboardQuery();

  const refresh = () =>
    void queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.detail() });

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

  if (dashboard.isLoading || !dashboard.data) {
    return <DashboardHomeSkeleton />;
  }

  const data = dashboard.data;

  return (
    <>
      <WorkspaceHeader
        title={t('dashboard.welcome')}
        subtitle={t('dashboard.overviewSubtitle')}
        onRefresh={refresh}
      />
      <DashboardHomeContent data={data} />
    </>
  );
}

function Metric({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  tone?: 'neutral' | 'positive' | 'warning' | 'negative';
}) {
  return (
    <article className={`metric metric--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function DashboardHomeContent({ data }: { data: DashboardData }) {
  const { locale, t } = useLocale();
  const [taskSearch, setTaskSearch] = useState('');
  const [reminderSearch, setReminderSearch] = useState('');
  const [activitySearch, setActivitySearch] = useState('');

  const money = (value: number) =>
    new Intl.NumberFormat(localeTag(locale), {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value);

  const date = (value?: string) =>
    value
      ? new Intl.DateTimeFormat(localeTag(locale), {
          dateStyle: 'short',
          timeStyle: 'short',
        }).format(new Date(value))
      : t('common.notSet');

  const attentionCount = data.debts.length + data.reminders.length + data.tasks.length;

  const filteredTasks = useMemo(() => {
    if (!taskSearch.trim()) return data.tasks;
    const q = taskSearch.toLowerCase();
    return data.tasks.filter((item) => item.title.toLowerCase().includes(q));
  }, [data.tasks, taskSearch]);

  const filteredReminders = useMemo(() => {
    if (!reminderSearch.trim()) return data.reminders;
    const q = reminderSearch.toLowerCase();
    return data.reminders.filter((item) => item.title.toLowerCase().includes(q));
  }, [data.reminders, reminderSearch]);

  const filteredActivity = useMemo(() => {
    if (!activitySearch.trim()) return data.activity;
    const q = activitySearch.toLowerCase();
    return data.activity.filter(
      (item) => item.action.toLowerCase().includes(q) || item.tableName.toLowerCase().includes(q),
    );
  }, [data.activity, activitySearch]);

  const taskColumns: DataTableColumn<DashboardData['tasks'][number]>[] = [
    {
      id: 'title',
      header: t('dashboard.columns.title'),
      minWidth: '180px',
      hideable: false,
      cell: (item) => <span className="cell-primary">{item.title}</span>,
    },
    {
      id: 'dueAt',
      header: t('dashboard.columns.dueDate'),
      align: 'right',
      minWidth: '130px',
      cell: (item) => <span className="cell-muted">{date(item.dueAt)}</span>,
    },
  ];

  const reminderColumns: DataTableColumn<DashboardData['reminders'][number]>[] = [
    {
      id: 'title',
      header: t('dashboard.columns.title'),
      minWidth: '180px',
      hideable: false,
      cell: (item) => <span className="cell-primary">{item.title}</span>,
    },
    {
      id: 'schedule',
      header: t('dashboard.columns.schedule'),
      align: 'right',
      minWidth: '140px',
      cell: (item) => (
        <span className="cell-muted">
          {item.notifyType === 'call' ? '📞' : '💬'} {date(item.remindAt)}
        </span>
      ),
    },
  ];

  const calendarColumns: DataTableColumn<DashboardData['calendar'][number]>[] = [
    {
      id: 'title',
      header: t('dashboard.columns.title'),
      minWidth: '180px',
      hideable: false,
      cell: (item) => <span className="cell-primary">{item.title}</span>,
    },
    {
      id: 'startAt',
      header: t('dashboard.columns.date'),
      align: 'right',
      minWidth: '140px',
      cell: (item) => <span className="cell-muted">{date(item.startAt)}</span>,
    },
  ];

  const activityColumns: DataTableColumn<DashboardData['activity'][number]>[] = [
    {
      id: 'action',
      header: t('dashboard.columns.action'),
      minWidth: '180px',
      hideable: false,
      cell: (item) => (
        <span className="cell-primary">
          {item.action} · {item.tableName}
        </span>
      ),
    },
    {
      id: 'createdAt',
      header: t('dashboard.columns.date'),
      align: 'right',
      minWidth: '140px',
      cell: (item) => <span className="cell-muted">{date(item.createdAt)}</span>,
    },
  ];

  const recentTxColumns: DataTableColumn<DashboardData['transactions'][number]>[] = [
    {
      id: 'category',
      header: t('dashboard.columns.transaction'),
      minWidth: '160px',
      hideable: false,
      cell: (item) => (
        <span className="cell-primary">
          <span
            className={`badge ${item.type === 'income' ? 'badge--receivable' : 'badge--payable'}`}
            style={{ marginRight: '6px' }}
          >
            {item.type === 'income' ? t('table.filter.income') : t('table.filter.expense')}
          </span>
          {item.category}
        </span>
      ),
    },
    {
      id: 'note',
      header: t('dashboard.columns.note'),
      minWidth: '140px',
      cell: (item) => <span className="cell-muted">{item.note || '—'}</span>,
    },
    {
      id: 'amount',
      header: t('dashboard.columns.amount'),
      align: 'right',
      minWidth: '130px',
      hideable: false,
      cell: (item) => <strong>{money(item.amount)}</strong>,
    },
  ];

  const recentDebtsColumns: DataTableColumn<DashboardData['debts'][number]>[] = [
    {
      id: 'counterparty',
      header: t('dashboard.columns.counterparty'),
      minWidth: '160px',
      hideable: false,
      cell: (item) => (
        <span className="cell-primary">
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
      ),
    },
    {
      id: 'dueAt',
      header: t('dashboard.columns.dueDate'),
      minWidth: '110px',
      cell: (item) => <span className="cell-muted">{date(item.dueAt)}</span>,
    },
    {
      id: 'remainingAmount',
      header: t('dashboard.columns.remaining'),
      align: 'right',
      minWidth: '130px',
      hideable: false,
      cell: (item) => <strong>{money(item.remainingAmount)}</strong>,
    },
  ];

  return (
    <>
      <section className="metric-grid" aria-label={t('dashboard.quickStats')}>
        <Metric
          label={t('dashboard.incomeTotal')}
          value={money(data.finance.income)}
          tone="positive"
        />
        <Metric
          label={t('dashboard.expenseTotal')}
          value={money(data.finance.expense)}
          tone="warning"
        />
        <Metric
          label={t('dashboard.balance')}
          value={money(data.finance.balance)}
          tone={data.finance.balance >= 0 ? 'positive' : 'negative'}
        />
        <Metric
          label={t('dashboard.receivableTotal')}
          value={money(data.finance.receivable)}
          tone="positive"
        />
        <Metric
          label={t('dashboard.payableTotal')}
          value={money(data.finance.payable)}
          tone="warning"
        />
        <Metric
          label={t('dashboard.attentionItems')}
          value={String(attentionCount)}
          tone="warning"
        />
      </section>

      <section className="quick-actions" aria-label={t('dashboard.quickStats')}>
        <Link href={APP_ROUTES.transactions}>{t('nav.transactions')}</Link>
        <Link href={APP_ROUTES.debts}>{t('nav.debts')}</Link>
        <Link href={APP_ROUTES.analytics}>{t('nav.analytics')}</Link>
        <Link href={APP_ROUTES.calendar}>{t('nav.calendar')}</Link>
        <Link href={APP_ROUTES.tasks}>{t('nav.tasks')}</Link>
        <Link href={APP_ROUTES.reminders}>{t('nav.reminders')}</Link>
        <Link href={APP_ROUTES.contacts}>{t('nav.contacts')}</Link>
      </section>

      {data.admin && (
        <section className="admin-strip">
          <strong>{t('dashboard.admin')}</strong>
          <span>{t('dashboard.usersCount', { count: data.admin.userCount })}</span>
          <span>
            {t('dashboard.googleConnectedCount', { count: data.admin.googleConnectedCount })}
          </span>
        </section>
      )}

      <section className="content-grid">
        <DataPanel
          title={t('dashboard.tasks')}
          description={data.user.googleConnected ? undefined : t('dashboard.connectGoogleTip')}
          counter={t('table.rowsCount', { count: filteredTasks.length })}
          toolbar={
            <input
              type="search"
              className="table-search-input"
              placeholder={t('table.searchPlaceholder')}
              value={taskSearch}
              onChange={(e) => setTaskSearch(e.target.value)}
              aria-label={t('table.searchPlaceholder')}
            />
          }
        >
          <DataTable
            id="home-tasks"
            ariaLabel={t('dashboard.tasks')}
            rows={filteredTasks}
            emptyMessage={t('dashboard.noTasks')}
            columns={taskColumns}
            getRowKey={(item) => item.id}
          />
        </DataPanel>

        <DataPanel
          title={t('dashboard.reminders')}
          counter={t('table.rowsCount', { count: filteredReminders.length })}
          toolbar={
            <input
              type="search"
              className="table-search-input"
              placeholder={t('table.searchPlaceholder')}
              value={reminderSearch}
              onChange={(e) => setReminderSearch(e.target.value)}
              aria-label={t('table.searchPlaceholder')}
            />
          }
        >
          <DataTable
            id="home-reminders"
            ariaLabel={t('dashboard.reminders')}
            rows={filteredReminders}
            emptyMessage={t('dashboard.noReminders')}
            columns={reminderColumns}
            getRowKey={(item) => item.id}
          />
        </DataPanel>

        <DataPanel
          title={t('dashboard.calendar')}
          description={data.user.googleConnected ? undefined : t('dashboard.connectGoogleTip')}
          counter={t('table.rowsCount', { count: data.calendar.length })}
        >
          <DataTable
            id="home-calendar"
            ariaLabel={t('dashboard.calendar')}
            rows={data.calendar}
            emptyMessage={t('dashboard.noCalendar')}
            columns={calendarColumns}
            getRowKey={(item) => item.id}
          />
        </DataPanel>

        <DataPanel
          title={t('dashboard.transactions')}
          counter={t('table.rowsCount', { count: data.transactions.length })}
        >
          <DataTable
            id="home-transactions"
            ariaLabel={t('dashboard.transactions')}
            rows={data.transactions.slice(0, 5)}
            emptyMessage={t('dashboard.noTransactions')}
            columns={recentTxColumns}
            getRowKey={(item) => item.id}
          />
        </DataPanel>

        <DataPanel
          title={t('dashboard.openDebts')}
          counter={t('table.rowsCount', { count: data.debts.length })}
        >
          <DataTable
            id="home-debts"
            ariaLabel={t('dashboard.openDebts')}
            rows={data.debts.slice(0, 5)}
            emptyMessage={t('dashboard.noDebts')}
            columns={recentDebtsColumns}
            getRowKey={(item) => item.id}
          />
        </DataPanel>

        <DataPanel
          title={t('dashboard.activity')}
          counter={t('table.rowsCount', { count: filteredActivity.length })}
          toolbar={
            <input
              type="search"
              className="table-search-input"
              placeholder={t('table.searchPlaceholder')}
              value={activitySearch}
              onChange={(e) => setActivitySearch(e.target.value)}
              aria-label={t('table.searchPlaceholder')}
            />
          }
        >
          <DataTable
            id="home-activity"
            ariaLabel={t('dashboard.activity')}
            rows={filteredActivity}
            emptyMessage={t('dashboard.noActivity')}
            columns={activityColumns}
            getRowKey={(item) => item.id}
          />
        </DataPanel>
      </section>
    </>
  );
}

function DashboardHomeSkeleton() {
  const { t } = useLocale();
  return (
    <div aria-busy="true">
      <header className="workspace__header">
        <div>
          <p className="eyebrow">Telebot</p>
          <h1>{t('common.loadingDashboard')}</h1>
        </div>
      </header>
      <section className="metric-grid skeleton-grid" aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => (
          <div className="metric" key={index}>
            <span className="skeleton skeleton--label" />
            <strong className="skeleton skeleton--value" />
          </div>
        ))}
      </section>
    </div>
  );
}
