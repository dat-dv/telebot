'use client';

import { type ReactNode } from 'react';
import { type TranslationKey } from '@telebot/contracts';
import { useLocale } from '@/shared/providers/locale-provider';
import { type PeriodFilterState, type PeriodGrain } from '@/shared/hooks/use-period-filter';

interface PeriodFilterToolbarProps {
  filter: PeriodFilterState;
  grains?: PeriodGrain[];
  children?: ReactNode;
}

const DEFAULT_GRAINS: PeriodGrain[] = ['week', 'month', 'quarter', 'year'];

const GRAIN_LABELS: Record<PeriodGrain, TranslationKey> = {
  day: 'period.day',
  week: 'period.week',
  month: 'period.month',
  quarter: 'period.quarter',
  year: 'period.year',
  all: 'period.all',
};

export function PeriodFilterToolbar({
  filter,
  grains = DEFAULT_GRAINS,
  children,
}: PeriodFilterToolbarProps) {
  const { t } = useLocale();
  const isAll = filter.grain === 'all';

  return (
    <div className="period-toolbar" role="toolbar">
      <div className="period-segmented" role="group">
        {grains.map((g) => (
          <button
            key={g}
            type="button"
            className={`period-btn ${filter.grain === g ? 'is-active' : ''}`}
            onClick={() => filter.setGrain(g)}
          >
            {t(GRAIN_LABELS[g])}
          </button>
        ))}
      </div>

      {!isAll ? (
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
      ) : (
        <div className="period-navigator">
          <span className="period-label">{filter.label}</span>
        </div>
      )}

      {children && <div className="period-toolbar__actions">{children}</div>}
    </div>
  );
}
