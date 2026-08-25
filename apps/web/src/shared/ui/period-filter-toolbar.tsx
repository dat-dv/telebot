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
    <div className="flex flex-wrap items-center gap-2" role="toolbar">
      <div className="inline-flex rounded-[3px] border border-slate-200 bg-slate-50 p-0.5" role="group">
        {grains.map((g) => (
          <button
            key={g}
            type="button"
            className={filter.grain === g ? 'min-h-7 rounded-[2px] !border-0 !bg-slate-900 px-2 text-xs font-semibold text-white' : 'min-h-7 rounded-[2px] !border-0 !bg-transparent px-2 text-xs font-medium text-slate-600 hover:!bg-white hover:!text-slate-900'}
            onClick={() => filter.setGrain(g)}
          >
            {t(GRAIN_LABELS[g])}
          </button>
        ))}
      </div>

      {!isAll ? (
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="inline-flex size-7 items-center justify-center rounded-[3px] border border-slate-300 !bg-white !p-0 text-base text-slate-600 hover:!bg-slate-100"
            onClick={filter.prevPeriod}
            aria-label={t('period.prev')}
            title={t('period.prev')}
          >
            ‹
          </button>
          <span className="min-w-24 text-center text-xs font-medium text-slate-700">{filter.label}</span>
          <button
            type="button"
            className="inline-flex size-7 items-center justify-center rounded-[3px] border border-slate-300 !bg-white !p-0 text-base text-slate-600 hover:!bg-slate-100"
            onClick={filter.nextPeriod}
            aria-label={t('period.next')}
            title={t('period.next')}
          >
            ›
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1">
          <span className="min-w-24 text-center text-xs font-medium text-slate-700">{filter.label}</span>
        </div>
      )}

      {children && <div className="ml-auto flex items-center gap-2">{children}</div>}
    </div>
  );
}
