'use client';

import { type ReactNode } from 'react';
import { useLocale } from '@/shared/providers/locale-provider';
import { type PeriodFilterState } from '@/shared/hooks/use-period-filter';

interface PeriodFilterToolbarProps {
  filter: PeriodFilterState;
  children?: ReactNode;
}

export function PeriodFilterToolbar({ filter, children }: PeriodFilterToolbarProps) {
  const { t } = useLocale();

  return (
    <div className="period-toolbar" role="toolbar">
      <div className="period-segmented" role="group">
        <button
          type="button"
          className={`period-btn ${filter.grain === 'week' ? 'is-active' : ''}`}
          onClick={() => filter.setGrain('week')}
        >
          {t('period.week')}
        </button>
        <button
          type="button"
          className={`period-btn ${filter.grain === 'month' ? 'is-active' : ''}`}
          onClick={() => filter.setGrain('month')}
        >
          {t('period.month')}
        </button>
        <button
          type="button"
          className={`period-btn ${filter.grain === 'quarter' ? 'is-active' : ''}`}
          onClick={() => filter.setGrain('quarter')}
        >
          {t('period.quarter')}
        </button>
        <button
          type="button"
          className={`period-btn ${filter.grain === 'year' ? 'is-active' : ''}`}
          onClick={() => filter.setGrain('year')}
        >
          {t('period.year')}
        </button>
      </div>

      <div className="period-navigator">
        <button
          type="button"
          className="period-nav-btn"
          onClick={filter.prevPeriod}
          aria-label={t('period.prev')}
          title={t('period.prev')}
        >
          ‹
        </button>
        <span className="period-label">{filter.label}</span>
        <button
          type="button"
          className="period-nav-btn"
          onClick={filter.nextPeriod}
          aria-label={t('period.next')}
          title={t('period.next')}
        >
          ›
        </button>
      </div>

      {children && <div className="period-toolbar__actions">{children}</div>}
    </div>
  );
}
