'use client';

import { useState, type ReactNode } from 'react';
import { useLocale } from '@/shared/providers/locale-provider';
import { useMoneyFormatter } from '@/shared/providers/money-visibility-provider';
import { MicroBarChart, type ChartBucket } from './micro-bar-chart';

interface TrendSummaryStripProps {
  income: number;
  expense: number;
  buckets: ChartBucket[];
  collapsible?: boolean;
  extraMetrics?: ReactNode;
}

export function TrendSummaryStrip({
  income,
  expense,
  buckets,
  collapsible = true,
  extraMetrics,
}: TrendSummaryStripProps) {
  const { t } = useLocale();
  const money = useMoneyFormatter();
  const [isExpanded, setIsExpanded] = useState(true);

  const balance = income - expense;

  return (
    <section className="trend-strip" aria-label={t('chart.incomeVsExpense')}>
      <div className="trend-strip__metrics">
        <article className="metric metric--positive">
          <span>{t('dashboard.incomeTotal')}</span>
          <strong>{money(income)}</strong>
        </article>
        <article className="metric metric--warning">
          <span>{t('dashboard.expenseTotal')}</span>
          <strong>{money(expense)}</strong>
        </article>
        <article className={`metric ${balance >= 0 ? 'metric--positive' : 'metric--negative'}`}>
          <span>{t('dashboard.balance')}</span>
          <strong>{money(balance)}</strong>
        </article>
        {extraMetrics}
      </div>

      <div className="trend-strip__chart-area">
        <div className="trend-strip__chart-header">
          <span className="trend-chart-title">{t('chart.incomeVsExpense')}</span>
          <div className="chart-legend">
            <span className="legend-item text-positive">
              <span className="legend-dot bg-positive" />
              {t('chart.income')}
            </span>
            <span className="legend-item text-warning">
              <span className="legend-dot bg-warning" />
              {t('chart.expense')}
            </span>
          </div>
          {collapsible && (
            <button
              type="button"
              className="chart-toggle-btn"
              onClick={() => setIsExpanded((prev) => !prev)}
              aria-expanded={isExpanded}
            >
              <span>{isExpanded ? t('chart.toggleHide') : t('chart.toggleShow')}</span>
              <span className="chart-toggle-icon">{isExpanded ? '▴' : '▾'}</span>
            </button>
          )}
        </div>

        {isExpanded && (
          <div className="trend-strip__chart-body">
            <MicroBarChart buckets={buckets} height={70} />
          </div>
        )}
      </div>
    </section>
  );
}
