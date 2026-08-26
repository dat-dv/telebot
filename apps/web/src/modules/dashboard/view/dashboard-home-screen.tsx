'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { APP_ROUTES, localeTag } from '@telebot/contracts';
import { useLocale } from '@/shared/providers/locale-provider';
import { useMoneyFormatter } from '@/shared/providers/money-visibility-provider';
import { SessionStateScreen } from '@/modules/auth/view/session-state-screen';
import { DataPanel, DataTable, type DataTableColumn } from '@/shared/ui/data-table';
import { WorkspaceHeader } from '@/shared/ui/workspace-header';
import { dashboardQueryKeys, useDashboardQuery } from '../api/dashboard-query';

type DashboardData = NonNullable<ReturnType<typeof useDashboardQuery>['data']>;

export function DashboardHomeScreen() {
  const queryClient = useQueryClient();
  const { t } = useLocale();
  const [isLoggedOut] = useState(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('status') === 'logged_out';
  });
  const dashboard = useDashboardQuery({ enabled: !isLoggedOut });

  const refresh = () =>
    void queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.detail() });

  if (isLoggedOut) {
    return <SessionStateScreen reason="logged_out" />;
  }

  if (dashboard.isError) {
    return <SessionStateScreen reason="expired" onRetry={refresh} />;
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
  const toneStyles = {
    neutral: 'text-slate-900 dark:text-slate-100',
    positive: 'text-emerald-700 dark:text-emerald-400',
    warning: 'text-amber-700 dark:text-amber-400',
    negative: 'text-rose-600 dark:text-rose-400',
  };

  return (
    <article className="flex min-h-[62px] flex-col justify-center rounded-[3px] border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900/60">
      <span className="block text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
        {label}
      </span>
      <strong
        className={`mt-0.5 block text-base font-bold tabular-nums tracking-tight ${toneStyles[tone]}`}
      >
        {value}
      </strong>
    </article>
  );
}

function DashboardHomeContent({ data }: { data: DashboardData }) {
  const { locale, t } = useLocale();
  const money = useMoneyFormatter();
  const [taskSearch, setTaskSearch] = useState('');
  const [reminderSearch, setReminderSearch] = useState('');
  const [activitySearch, setActivitySearch] = useState('');

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
      cell: (item) => (
        <span className="font-semibold text-slate-900 dark:text-slate-100">{item.title}</span>
      ),
    },
    {
      id: 'dueAt',
      header: t('dashboard.columns.dueDate'),
      align: 'right',
      minWidth: '130px',
      cell: (item) => (
        <span className="text-[11.5px] text-slate-500 dark:text-slate-400">{date(item.dueAt)}</span>
      ),
    },
  ];

  const reminderColumns: DataTableColumn<DashboardData['reminders'][number]>[] = [
    {
      id: 'title',
      header: t('dashboard.columns.title'),
      minWidth: '180px',
      hideable: false,
      cell: (item) => (
        <span className="font-semibold text-slate-900 dark:text-slate-100">{item.title}</span>
      ),
    },
    {
      id: 'schedule',
      header: t('dashboard.columns.schedule'),
      align: 'right',
      minWidth: '140px',
      cell: (item) => (
        <span className="text-[11.5px] text-slate-500 dark:text-slate-400">
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
      cell: (item) => (
        <span className="font-semibold text-slate-900 dark:text-slate-100">{item.title}</span>
      ),
    },
    {
      id: 'startAt',
      header: t('dashboard.columns.date'),
      align: 'right',
      minWidth: '140px',
      cell: (item) => (
        <span className="text-[11.5px] text-slate-500 dark:text-slate-400">
          {date(item.startAt)}
        </span>
      ),
    },
  ];

  const activityColumns: DataTableColumn<DashboardData['activity'][number]>[] = [
    {
      id: 'action',
      header: t('dashboard.columns.action'),
      minWidth: '180px',
      hideable: false,
      cell: (item) => (
        <span className="font-semibold text-slate-900 dark:text-slate-100">
          {item.action} · {item.tableName}
        </span>
      ),
    },
    {
      id: 'createdAt',
      header: t('dashboard.columns.date'),
      align: 'right',
      minWidth: '140px',
      cell: (item) => (
        <span className="text-[11.5px] text-slate-500 dark:text-slate-400">
          {date(item.createdAt)}
        </span>
      ),
    },
  ];

  const recentTxColumns: DataTableColumn<DashboardData['transactions'][number]>[] = [
    {
      id: 'category',
      header: t('dashboard.columns.transaction'),
      minWidth: '160px',
      hideable: false,
      cell: (item) => (
        <span className="inline-flex flex-nowrap items-center font-semibold text-slate-900 whitespace-nowrap dark:text-slate-100">
          <span
            className={`mr-1.5 inline-flex shrink-0 items-center rounded-[2px] border px-1.5 py-0.5 text-[10px] font-semibold whitespace-nowrap ${
              item.type === 'income'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
            }`}
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
      cell: (item) => (
        <span className="text-[11.5px] text-slate-500 dark:text-slate-400">{item.note || '—'}</span>
      ),
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
        <span className="inline-flex flex-nowrap items-center font-semibold text-slate-900 whitespace-nowrap dark:text-slate-100">
          <span
            className={`mr-1.5 inline-flex shrink-0 items-center rounded-[2px] border px-1.5 py-0.5 text-[10px] font-semibold whitespace-nowrap ${
              item.direction === 'receivable'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
            }`}
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
      cell: (item) => (
        <span className="text-[11.5px] text-slate-500 dark:text-slate-400">{date(item.dueAt)}</span>
      ),
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
    <div className="flex flex-col gap-3">
      <section
        className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-2 max-[640px]:grid-cols-2"
        aria-label={t('dashboard.quickStats')}
      >
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

      <section
        className="flex flex-wrap gap-1.5 rounded border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900"
        aria-label={t('dashboard.quickStats')}
      >
        <Link
          href={APP_ROUTES.transactions}
          className="inline-flex h-6 min-h-6 items-center rounded-[3px] border border-slate-300 bg-slate-50 px-2 text-[11.5px] font-medium text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700"
        >
          {t('nav.transactions')}
        </Link>
        <Link
          href={APP_ROUTES.debts}
          className="inline-flex h-6 min-h-6 items-center rounded-[3px] border border-slate-300 bg-slate-50 px-2 text-[11.5px] font-medium text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700"
        >
          {t('nav.debts')}
        </Link>
        <Link
          href={APP_ROUTES.analytics}
          className="inline-flex h-6 min-h-6 items-center rounded-[3px] border border-slate-300 bg-slate-50 px-2 text-[11.5px] font-medium text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700"
        >
          {t('nav.analytics')}
        </Link>
        <Link
          href={APP_ROUTES.calendar}
          className="inline-flex h-6 min-h-6 items-center rounded-[3px] border border-slate-300 bg-slate-50 px-2 text-[11.5px] font-medium text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700"
        >
          {t('nav.calendar')}
        </Link>
        <Link
          href={APP_ROUTES.tasks}
          className="inline-flex h-6 min-h-6 items-center rounded-[3px] border border-slate-300 bg-slate-50 px-2 text-[11.5px] font-medium text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700"
        >
          {t('nav.tasks')}
        </Link>
        <Link
          href={APP_ROUTES.reminders}
          className="inline-flex h-6 min-h-6 items-center rounded-[3px] border border-slate-300 bg-slate-50 px-2 text-[11.5px] font-medium text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700"
        >
          {t('nav.reminders')}
        </Link>
        <Link
          href={APP_ROUTES.contacts}
          className="inline-flex h-6 min-h-6 items-center rounded-[3px] border border-slate-300 bg-slate-50 px-2 text-[11.5px] font-medium text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700"
        >
          {t('nav.contacts')}
        </Link>
      </section>

      {data.admin && (
        <section className="flex flex-wrap items-center gap-3 rounded border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-400">
          <strong className="font-semibold text-slate-900 dark:text-slate-100">
            {t('dashboard.admin')}
          </strong>
          <span>{t('dashboard.usersCount', { count: data.admin.userCount })}</span>
          <span>
            {t('dashboard.googleConnectedCount', { count: data.admin.googleConnectedCount })}
          </span>
        </section>
      )}

      <section className="grid grid-cols-2 gap-3 max-[960px]:grid-cols-1">
        <DataPanel
          title={t('dashboard.tasks')}
          description={data.user.googleConnected ? undefined : t('dashboard.connectGoogleTip')}
          counter={t('table.rowsCount', { count: filteredTasks.length })}
          toolbar={
            <input
              type="search"
              className="h-6 min-h-6 w-44 rounded-[3px] border border-slate-300 bg-white px-2 text-[11.5px] text-slate-900 outline-none focus:border-sky-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-sky-500 max-[640px]:w-full"
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
              className="h-6 min-h-6 w-44 rounded-[3px] border border-slate-300 bg-white px-2 text-[11.5px] text-slate-900 outline-none focus:border-sky-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-sky-500 max-[640px]:w-full"
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
              className="h-6 min-h-6 w-44 rounded-[3px] border border-slate-300 bg-white px-2 text-[11.5px] text-slate-900 outline-none focus:border-sky-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-sky-500 max-[640px]:w-full"
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
    </div>
  );
}

function DashboardHomeSkeleton() {
  const { t } = useLocale();
  return (
    <div aria-busy="true" className="flex flex-col gap-3">
      <header className="mb-1 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-2.5 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Telebot</p>
          <h1 className="m-0 text-base font-semibold text-slate-900 dark:text-slate-100">
            {t('common.loadingDashboard')}
          </h1>
        </div>
      </header>
      <section
        className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-2 max-[640px]:grid-cols-2"
        aria-hidden="true"
      >
        {Array.from({ length: 6 }, (_, index) => (
          <div
            className="flex min-h-[62px] flex-col justify-center rounded-[3px] border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900/60"
            key={index}
          >
            <span className="block h-2.5 w-16 animate-pulse rounded-[2px] bg-slate-200 dark:bg-slate-800" />
            <strong className="mt-2 block h-4 w-24 animate-pulse rounded-[2px] bg-slate-200 dark:bg-slate-800" />
          </div>
        ))}
      </section>
    </div>
  );
}
