'use client';

import { useState, useMemo, useTransition } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { type IAnalyticsTrendBucket } from '@telebot/contracts';
import { useLocale } from '@/shared/providers/locale-provider';
import { useMoneyFormatter } from '@/shared/providers/money-visibility-provider';
import { DataPanel, DataTable, type DataTableColumn } from '@/shared/ui/data-table';
import { usePeriodFilter } from '@/shared/hooks/use-period-filter';
import { PeriodFilterToolbar } from '@/shared/ui/period-filter-toolbar';
import { useContactsQuery } from '@/modules/contacts/api/contacts-query';
import {
  useCreateDebtPaymentMutation,
  useUpdateDebtMutation,
} from '@/modules/debts/api/debts-query';
import { SessionStateScreen } from '@/modules/auth/view/session-state-screen';
import { dashboardQueryKeys, useDashboardQuery } from '../api/dashboard-query';
import {
  useDeleteTransactionMutation,
  useUpdateTransactionMutation,
} from '../api/transactions-query';
import { useFinanceAnalyticsQuery } from '../api/analytics-query';
import { CashflowTrendChart } from '@/shared/ui/charts/cashflow-trend-chart';
import { CategoryDonutChart } from '@/shared/ui/charts/category-donut-chart';
import { DebtStructureChart } from '@/shared/ui/charts/debt-structure-chart';
import {
  TransactionsTable,
  type TransactionEditDraft,
  type TransactionTableItem,
} from '@/modules/dashboard/view/transactions-table';
import { DebtsTable, type DebtEditDraft } from '@/modules/debts/view/debts-table';

type DashboardData = NonNullable<ReturnType<typeof useDashboardQuery>['data']>;
type DebtItem = DashboardData['debts'][number];

export function AnalyticsScreen() {
  const queryClient = useQueryClient();
  const { t } = useLocale();
  const periodFilter = usePeriodFilter('month');
  const [txSearch, setTxSearch] = useState('');
  const [debtSearch, setDebtSearch] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Transaction inline edit state
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [editTxDraft, setEditTxDraft] = useState<TransactionEditDraft>({
    type: 'expense',
    category: '',
    note: '',
    placeName: '',
    amount: '',
    occurredAt: '',
  });

  // Debt inline edit state
  const [editingDebtId, setEditingDebtId] = useState<string | null>(null);
  const [editDebtDraft, setEditDebtDraft] = useState<DebtEditDraft>({
    direction: 'receivable',
    counterparty: '',
    counterpartyAlias: '',
    contactId: '',
    originalAmount: '',
    remainingAmount: '',
    note: '',
    dueAt: '',
  });

  const dashboard = useDashboardQuery();
  const contactsQuery = useContactsQuery();

  const startAtStr = useMemo(() => {
    if (periodFilter.grain === 'all') return undefined;
    return periodFilter.startDate.toISOString();
  }, [periodFilter.grain, periodFilter.startDate]);

  const endAtStr = useMemo(() => {
    if (periodFilter.grain === 'all') return undefined;
    return periodFilter.endDate.toISOString();
  }, [periodFilter.grain, periodFilter.endDate]);

  const analyticsQuery = useFinanceAnalyticsQuery({
    startAt: startAtStr,
    endAt: endAtStr,
    grain: periodFilter.grain,
  });

  const updateTxMutation = useUpdateTransactionMutation();
  const deleteTxMutation = useDeleteTransactionMutation();
  const updateDebtMutation = useUpdateDebtMutation();
  const paymentDebtMutation = useCreateDebtPaymentMutation();

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.detail() });
    void queryClient.invalidateQueries({ queryKey: ['finance-analytics'] });
    void queryClient.invalidateQueries({ queryKey: ['contacts'] });
  };

  const money = useMoneyFormatter();

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

  const fallbackTrendBuckets = useMemo<IAnalyticsTrendBucket[]>(() => {
    return periodBuckets.map((b) => ({
      key: b.key,
      label: b.label,
      income: b.income,
      expense: b.expense,
      balance: b.income - b.expense,
      startAt: '',
      endAt: '',
    }));
  }, [periodBuckets]);

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
  const handleStartTxEdit = (item: TransactionTableItem) => {
    setEditingTxId(item.id);
    setEditTxDraft({
      type: item.type,
      category: item.category,
      note: item.note || '',
      placeName: item.placeName || '',
      amount: String(item.amount),
      occurredAt: item.occurredAt ? item.occurredAt.slice(0, 16) : '',
    });
  };

  const handleCancelTxEdit = () => {
    setEditingTxId(null);
    setEditTxDraft({
      type: 'expense',
      category: '',
      note: '',
      placeName: '',
      amount: '',
      occurredAt: '',
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
          placeName: editTxDraft.placeName.trim() || undefined,
          amount: parsedAmount,
          occurredAt: editTxDraft.occurredAt
            ? new Date(editTxDraft.occurredAt).toISOString()
            : undefined,
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
      counterpartyAlias: item.counterpartyAlias || '',
      contactId: item.contactId || '',
      originalAmount: String(item.originalAmount),
      remainingAmount: String(item.remainingAmount),
      note: item.note || '',
      dueAt: item.dueAt ? item.dueAt.slice(0, 10) : '',
    });
  };

  const handleCancelDebtEdit = () => {
    setEditingDebtId(null);
    setEditDebtDraft({
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
    const parsedOriginal = Number(editDebtDraft.originalAmount);
    const parsedRemaining = Number(editDebtDraft.remainingAmount);
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
      await updateDebtMutation.mutateAsync({
        id,
        data: {
          direction: editDebtDraft.direction,
          counterparty: trimmedCounterparty,
          counterpartyAlias: editDebtDraft.counterpartyAlias || undefined,
          contactId: editDebtDraft.contactId || undefined,
          originalAmount: parsedOriginal,
          remainingAmount: parsedRemaining,
          note: editDebtDraft.note.trim() || undefined,
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

  const totalIncome = analyticsQuery.data?.summary.income ?? periodIncome;
  const totalExpense = analyticsQuery.data?.summary.expense ?? periodExpense;
  const netSavings = analyticsQuery.data?.summary.balance ?? totalIncome - totalExpense;
  const savingsRate =
    analyticsQuery.data?.summary.netSavingsRate ??
    (totalIncome > 0 ? Math.max(0, ((totalIncome - totalExpense) / totalIncome) * 100) : 0);
  const netDebt =
    analyticsQuery.data?.debts.netDebt ??
    (rawData?.finance.receivable ?? 0) - (rawData?.finance.payable ?? 0);

  const trendBuckets = useMemo<IAnalyticsTrendBucket[]>(() => {
    return analyticsQuery.data?.trend ?? fallbackTrendBuckets;
  }, [analyticsQuery.data?.trend, fallbackTrendBuckets]);

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const ANALYTICS_TABS = [
    { key: 'charts', labelKey: 'analytics.tab.allCharts' as const },
    { key: 'cashflow', labelKey: 'analytics.tab.cashflow' as const },
    { key: 'spending', labelKey: 'analytics.tab.spending' as const },
    { key: 'debts', labelKey: 'analytics.tab.debts' as const },
    { key: 'records', labelKey: 'analytics.tab.records' as const },
  ] as const;
  type AnalyticsTabKey = (typeof ANALYTICS_TABS)[number]['key'];

  const rawTabParam = searchParams.get('tab') as AnalyticsTabKey | null;
  const activeTab: AnalyticsTabKey =
    rawTabParam && ANALYTICS_TABS.some((tab) => tab.key === rawTabParam) ? rawTabParam : 'charts';

  const setTab = (tab: AnalyticsTabKey) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === 'charts') {
      params.delete('tab');
    } else {
      params.set('tab', tab);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  const bucketCount = Math.max(trendBuckets.length, 1);
  const avgDailyIncome = totalIncome / bucketCount;
  const avgDailyExpense = totalExpense / bucketCount;

  type CashflowRow = IAnalyticsTrendBucket & { id: string };

  const cashflowRows = useMemo<CashflowRow[]>(() => {
    return trendBuckets.map((bucket) => ({
      ...bucket,
      id: bucket.key,
    }));
  }, [trendBuckets]);

  const cashflowColumns = useMemo<DataTableColumn<CashflowRow>[]>(
    () => [
      {
        id: 'period',
        header: t('analytics.cashflow.column.period'),
        width: '28%',
        cell: (item) => (
          <span className="font-semibold text-slate-900 dark:text-slate-100">{item.label}</span>
        ),
      },
      {
        id: 'income',
        header: t('analytics.cashflow.column.income'),
        align: 'right',
        width: '24%',
        cell: (item) => (
          <span className="tabular-nums font-medium text-sky-700 dark:text-sky-400">
            + {money(item.income)}
          </span>
        ),
      },
      {
        id: 'expense',
        header: t('analytics.cashflow.column.expense'),
        align: 'right',
        width: '24%',
        cell: (item) => (
          <span className="tabular-nums font-medium text-amber-700 dark:text-amber-400">
            - {money(item.expense)}
          </span>
        ),
      },
      {
        id: 'balance',
        header: t('analytics.cashflow.column.balance'),
        align: 'right',
        width: '24%',
        cell: (item) => {
          const isPos = item.balance >= 0;
          return (
            <span
              className={`tabular-nums font-bold ${
                isPos
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {isPos ? '+ ' : ''}
              {money(item.balance)}
            </span>
          );
        },
      },
    ],
    [money, t],
  );

  interface CategoryRow {
    id: string;
    category: string;
    amount: number;
    percentage: number;
  }

  const categoryRows = useMemo<CategoryRow[]>(() => {
    const categories = analyticsQuery.data?.categories ?? [];
    return categories.map((c) => ({
      id: c.category,
      category: c.category,
      amount: c.amount,
      percentage: totalExpense > 0 ? (c.amount / totalExpense) * 100 : c.percentage,
    }));
  }, [analyticsQuery.data?.categories, totalExpense]);

  const categoryColumns = useMemo<DataTableColumn<CategoryRow>[]>(
    () => [
      {
        id: 'category',
        header: t('dashboard.columns.category'),
        width: '45%',
        cell: (item) => (
          <span className="font-semibold text-slate-900 dark:text-slate-100">{item.category}</span>
        ),
      },
      {
        id: 'percentage',
        header: '%',
        align: 'right',
        width: '20%',
        cell: (item) => (
          <span className="tabular-nums text-slate-600 dark:text-slate-400">
            {item.percentage.toFixed(1)}%
          </span>
        ),
      },
      {
        id: 'amount',
        header: t('dashboard.columns.amount'),
        align: 'right',
        width: '35%',
        cell: (item) => (
          <span className="tabular-nums font-bold text-amber-700 dark:text-amber-400">
            {money(item.amount)}
          </span>
        ),
      },
    ],
    [money, t],
  );

  if (dashboard.isError) {
    return <SessionStateScreen reason="expired" onRetry={refresh} />;
  }

  if (dashboard.isLoading || !rawData) {
    return (
      <div aria-busy="true" className="flex flex-col gap-3">
        <section
          className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-2 max-[640px]:grid-cols-2"
          aria-hidden="true"
        >
          {Array.from({ length: 4 }, (_, i) => (
            <div
              className="flex min-h-[62px] flex-col justify-center rounded-[3px] border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900/60"
              key={i}
            >
              <span className="block h-2.5 w-16 animate-pulse rounded-[2px] bg-slate-200 dark:bg-slate-800" />
              <strong className="mt-2 block h-4 w-24 animate-pulse rounded-[2px] bg-slate-200 dark:bg-slate-800" />
            </div>
          ))}
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <datalist id="analytics-debt-contacts-autocomplete">
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

      <PeriodFilterToolbar filter={periodFilter} />

      {/* Sub-tab Navigation */}
      <nav
        className="flex flex-wrap items-center gap-1 border-b border-slate-200 pb-2 dark:border-slate-800"
        aria-label={t('analytics.title')}
      >
        {ANALYTICS_TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setTab(tab.key)}
              className={`inline-flex items-center gap-1.5 rounded-[3px] px-3 py-1 text-xs font-semibold transition-colors ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-900'
                  : 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              {t(tab.labelKey)}
            </button>
          );
        })}
      </nav>

      {/* TAB 1: ALL CHARTS (OVERVIEW) */}
      {activeTab === 'charts' && (
        <div className="flex flex-col gap-3">
          {/* KPI Cards Strip */}
          <section className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-2">
            <article className="flex min-h-[62px] flex-col justify-center rounded-[3px] border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900/60">
              <span className="block text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                {t('dashboard.incomeTotal')}
              </span>
              <strong className="mt-0.5 block text-base font-bold tabular-nums tracking-tight text-emerald-700 dark:text-emerald-400">
                {money(totalIncome)}
              </strong>
            </article>

            <article className="flex min-h-[62px] flex-col justify-center rounded-[3px] border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900/60">
              <span className="block text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                {t('dashboard.expenseTotal')}
              </span>
              <strong className="mt-0.5 block text-base font-bold tabular-nums tracking-tight text-amber-700 dark:text-amber-400">
                {money(totalExpense)}
              </strong>
            </article>

            <article className="flex min-h-[62px] flex-col justify-center rounded-[3px] border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900/60">
              <span className="block text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                {t('analytics.kpi.netSavings')}
              </span>
              <strong
                className={`mt-0.5 block text-base font-bold tabular-nums tracking-tight ${
                  netSavings >= 0
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {money(netSavings)}
              </strong>
            </article>

            <article className="flex min-h-[62px] flex-col justify-center rounded-[3px] border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900/60">
              <span className="block text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                {t('analytics.kpi.savingsRate')}
              </span>
              <strong
                className={`mt-0.5 block text-base font-bold tabular-nums tracking-tight ${
                  savingsRate >= 20
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : savingsRate > 0
                      ? 'text-amber-700 dark:text-amber-400'
                      : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                {savingsRate.toFixed(1)}%
              </strong>
            </article>

            <article className="flex min-h-[62px] flex-col justify-center rounded-[3px] border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900/60">
              <span className="block text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                {t('dashboard.netDebt')}
              </span>
              <strong
                className={`mt-0.5 block text-base font-bold tabular-nums tracking-tight ${
                  netDebt >= 0
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {money(netDebt)}
              </strong>
            </article>
          </section>

          {/* Visual Charts Grid */}
          <section className="grid grid-cols-1 gap-3 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <DataPanel title={t('analytics.chart.cashflowTrend')}>
                <div className="p-3">
                  <CashflowTrendChart buckets={trendBuckets} height={200} />
                </div>
              </DataPanel>
            </div>

            <div className="flex flex-col gap-3 lg:col-span-5">
              <DataPanel title={t('analytics.chart.spendingDistribution')}>
                <div className="p-3">
                  <CategoryDonutChart
                    categories={analyticsQuery.data?.categories ?? []}
                    totalAmount={totalExpense}
                    height={180}
                  />
                </div>
              </DataPanel>

              <DataPanel title={t('analytics.chart.debtBreakdown')}>
                <div className="p-3">
                  <DebtStructureChart
                    debts={
                      analyticsQuery.data?.debts ?? {
                        receivable: rawData.finance.receivable,
                        payable: rawData.finance.payable,
                        netDebt,
                        topReceivables: [],
                        topPayables: [],
                      }
                    }
                    height={160}
                  />
                </div>
              </DataPanel>
            </div>
          </section>
        </div>
      )}

      {/* TAB 2: CASHFLOW TREND DEEP-DIVE */}
      {activeTab === 'cashflow' && (
        <div className="flex flex-col gap-3">
          {/* Cashflow Specific Summary Strip */}
          <section className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2">
            <article className="flex min-h-[62px] flex-col justify-center rounded-[3px] border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900/60">
              <span className="block text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                {t('dashboard.incomeTotal')}
              </span>
              <strong className="mt-0.5 block text-base font-bold tabular-nums tracking-tight text-sky-700 dark:text-sky-400">
                {money(totalIncome)}
              </strong>
            </article>

            <article className="flex min-h-[62px] flex-col justify-center rounded-[3px] border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900/60">
              <span className="block text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                {t('dashboard.expenseTotal')}
              </span>
              <strong className="mt-0.5 block text-base font-bold tabular-nums tracking-tight text-amber-700 dark:text-amber-400">
                {money(totalExpense)}
              </strong>
            </article>

            <article className="flex min-h-[62px] flex-col justify-center rounded-[3px] border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900/60">
              <span className="block text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                {t('analytics.kpi.netSavings')}
              </span>
              <strong
                className={`mt-0.5 block text-base font-bold tabular-nums tracking-tight ${
                  netSavings >= 0
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {money(netSavings)}
              </strong>
            </article>

            <article className="flex min-h-[62px] flex-col justify-center rounded-[3px] border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900/60">
              <span className="block text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                {t('analytics.cashflow.avgDailyIncome')}
              </span>
              <strong className="mt-0.5 block text-base font-bold tabular-nums tracking-tight text-slate-900 dark:text-slate-100">
                {money(avgDailyIncome)}
              </strong>
            </article>

            <article className="flex min-h-[62px] flex-col justify-center rounded-[3px] border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900/60">
              <span className="block text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                {t('analytics.cashflow.avgDailyExpense')}
              </span>
              <strong className="mt-0.5 block text-base font-bold tabular-nums tracking-tight text-slate-900 dark:text-slate-100">
                {money(avgDailyExpense)}
              </strong>
            </article>
          </section>

          {/* Full-width Large Cashflow Chart */}
          <DataPanel title={t('analytics.chart.cashflowTrend')}>
            <div className="p-3">
              <CashflowTrendChart buckets={trendBuckets} height={260} />
            </div>
          </DataPanel>

          {/* Cashflow Breakdown Table by Period */}
          <DataPanel
            title={t('analytics.cashflow.breakdownTitle')}
            counter={t('table.rowsCount', { count: cashflowRows.length })}
          >
            <DataTable
              id="analytics-cashflow-breakdown"
              ariaLabel={t('analytics.cashflow.breakdownTitle')}
              rows={cashflowRows}
              emptyMessage={t('analytics.emptyChartData')}
              columns={cashflowColumns}
              getRowKey={(item) => item.id}
            />
          </DataPanel>
        </div>
      )}

      {/* TAB 3: SPENDING BREAKDOWN */}
      {activeTab === 'spending' && (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <DataPanel title={t('analytics.chart.spendingDistribution')}>
              <div className="p-4">
                <CategoryDonutChart
                  categories={analyticsQuery.data?.categories ?? []}
                  totalAmount={totalExpense}
                  height={240}
                />
              </div>
            </DataPanel>
          </div>

          <div className="lg:col-span-6">
            <DataPanel
              title={t('analytics.topCategories')}
              counter={t('table.rowsCount', { count: categoryRows.length })}
            >
              <DataTable
                id="analytics-spending-breakdown"
                ariaLabel={t('analytics.topCategories')}
                rows={categoryRows}
                emptyMessage={t('analytics.emptyChartData')}
                columns={categoryColumns}
                getRowKey={(item) => item.id}
              />
            </DataPanel>
          </div>
        </div>
      )}

      {/* TAB 4: DEBTS STRUCTURE */}
      {activeTab === 'debts' && (
        <div className="flex flex-col gap-3">
          <section className="grid grid-cols-1 gap-3 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <DataPanel title={t('analytics.chart.debtBreakdown')}>
                <div className="p-4">
                  <DebtStructureChart
                    debts={
                      analyticsQuery.data?.debts ?? {
                        receivable: rawData.finance.receivable,
                        payable: rawData.finance.payable,
                        netDebt,
                        topReceivables: [],
                        topPayables: [],
                      }
                    }
                    height={220}
                  />
                </div>
              </DataPanel>
            </div>

            <div className="lg:col-span-6">
              <DataPanel
                title={t('dashboard.openDebts')}
                counter={t('table.rowsCount', { count: filteredDebts.length })}
                toolbar={
                  <input
                    type="search"
                    className="h-6 min-h-6 w-44 rounded-[3px] border border-slate-300 bg-white px-2 text-[11.5px] text-slate-900 outline-none focus:border-sky-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-sky-500 max-[640px]:w-full"
                    placeholder={t('table.searchPlaceholder')}
                    value={debtSearch}
                    onChange={(e) => setDebtSearch(e.target.value)}
                    aria-label={t('table.searchPlaceholder')}
                  />
                }
              >
                <DebtsTable
                  id="analytics-debts-tab"
                  ariaLabel={t('dashboard.openDebts')}
                  debts={filteredDebts}
                  emptyMessage={t('dashboard.noDebts')}
                  editingId={editingDebtId}
                  editDraft={editDebtDraft}
                  onChangeEditDraft={setEditDebtDraft}
                  onStartEdit={handleStartDebtEdit}
                  onCancelEdit={handleCancelDebtEdit}
                  onSaveEdit={handleSaveDebtEdit}
                  onQuickSettle={handleQuickSettleDebt}
                  onCounterpartyChange={handleDebtCounterpartyChange}
                  isPending={updateDebtMutation.isPending || paymentDebtMutation.isPending}
                />
              </DataPanel>
            </div>
          </section>
        </div>
      )}

      {/* TAB 5: DETAILED RECORDS */}
      {activeTab === 'records' && (
        <div className="flex flex-col gap-3">
          {rawData.admin && (
            <section className="flex flex-wrap items-center gap-3 rounded border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-400">
              <strong className="font-semibold text-slate-900 dark:text-slate-100">
                {t('dashboard.admin')}
              </strong>
              <span>{t('dashboard.usersCount', { count: rawData.admin.userCount })}</span>
              <span>
                {t('dashboard.googleConnectedCount', {
                  count: rawData.admin.googleConnectedCount,
                })}
              </span>
            </section>
          )}

          <section className="grid gap-3">
            <DataPanel
              title={t('dashboard.transactions')}
              counter={t('table.rowsCount', { count: filteredTx.length })}
              toolbar={
                <input
                  type="search"
                  className="h-6 min-h-6 w-44 rounded-[3px] border border-slate-300 bg-white px-2 text-[11.5px] text-slate-900 outline-none focus:border-sky-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-sky-500 max-[640px]:w-full"
                  placeholder={t('table.searchPlaceholder')}
                  value={txSearch}
                  onChange={(e) => setTxSearch(e.target.value)}
                  aria-label={t('table.searchPlaceholder')}
                />
              }
            >
              <TransactionsTable
                id="analytics-transactions"
                ariaLabel={t('dashboard.transactions')}
                transactions={filteredTx}
                emptyMessage={t('dashboard.noTransactions')}
                editingId={editingTxId}
                editDraft={editTxDraft}
                onChangeEditDraft={setEditTxDraft}
                onStartEdit={handleStartTxEdit}
                onCancelEdit={handleCancelTxEdit}
                onSaveEdit={handleSaveTxEdit}
                onDelete={handleDeleteTx}
                isPending={updateTxMutation.isPending}
              />
            </DataPanel>

            <DataPanel
              title={t('dashboard.openDebts')}
              counter={t('table.rowsCount', { count: filteredDebts.length })}
              toolbar={
                <input
                  type="search"
                  className="h-6 min-h-6 w-44 rounded-[3px] border border-slate-300 bg-white px-2 text-[11.5px] text-slate-900 outline-none focus:border-sky-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-sky-500 max-[640px]:w-full"
                  placeholder={t('table.searchPlaceholder')}
                  value={debtSearch}
                  onChange={(e) => setDebtSearch(e.target.value)}
                  aria-label={t('table.searchPlaceholder')}
                />
              }
            >
              <DebtsTable
                id="analytics-debts"
                ariaLabel={t('dashboard.openDebts')}
                debts={filteredDebts}
                emptyMessage={t('dashboard.noDebts')}
                editingId={editingDebtId}
                editDraft={editDebtDraft}
                onChangeEditDraft={setEditDebtDraft}
                onStartEdit={handleStartDebtEdit}
                onCancelEdit={handleCancelDebtEdit}
                onSaveEdit={handleSaveDebtEdit}
                onQuickSettle={handleQuickSettleDebt}
                onCounterpartyChange={handleDebtCounterpartyChange}
                isPending={updateDebtMutation.isPending || paymentDebtMutation.isPending}
              />
            </DataPanel>
          </section>
        </div>
      )}
    </div>
  );
}
