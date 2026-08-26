'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLocale } from '@/shared/providers/locale-provider';

export type PeriodGrain = 'day' | 'week' | 'month' | 'quarter' | 'year' | 'all';

export interface ChartBucket {
  key: string;
  label: string;
  income: number;
  expense: number;
}

export interface PeriodFilterState {
  grain: PeriodGrain;
  refDate: Date;
  startDate: Date;
  endDate: Date;
  label: string;
  setGrain: (grain: PeriodGrain) => void;
  prevPeriod: () => void;
  nextPeriod: () => void;
  resetToToday: () => void;
  isItemInPeriod: (dateInput: string | Date | undefined | null) => boolean;
  generateBuckets: (
    items: Array<{ occurredAt: string; amount: number; type: 'income' | 'expense' }>,
  ) => ChartBucket[];
}

function getStartOfWeek(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getEndOfWeek(d: Date): Date {
  const start = getStartOfWeek(d);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

function getWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function formatDateRange(start: Date, end: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const sStr = `${pad(start.getDate())}/${pad(start.getMonth() + 1)}`;
  const eStr = `${pad(end.getDate())}/${pad(end.getMonth() + 1)}`;
  return `${sStr} - ${eStr}`;
}

export function usePeriodFilter(defaultGrain: PeriodGrain = 'month'): PeriodFilterState {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useLocale();

  const periodParam = searchParams.get('period');
  const refParam = searchParams.get('ref');

  const grain: PeriodGrain =
    periodParam === 'day' ||
    periodParam === 'week' ||
    periodParam === 'month' ||
    periodParam === 'quarter' ||
    periodParam === 'year' ||
    periodParam === 'all'
      ? periodParam
      : defaultGrain;

  const refDate = useMemo(() => {
    if (!refParam) return new Date();
    const parsed = new Date(refParam);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  }, [refParam]);

  const updateUrl = useCallback(
    (newGrain: PeriodGrain, newDate: Date) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('period', newGrain);
      const isoDate = newDate.toISOString().slice(0, 10);
      params.set('ref', isoDate);
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    },
    [router, pathname, searchParams],
  );

  const { startDate, endDate, label } = useMemo(() => {
    const year = refDate.getFullYear();
    const month = refDate.getMonth(); // 0-11
    const pad = (n: number) => String(n).padStart(2, '0');

    if (grain === 'day') {
      const start = new Date(year, month, refDate.getDate(), 0, 0, 0, 0);
      const end = new Date(year, month, refDate.getDate(), 23, 59, 59, 999);
      const formattedDate = `${pad(refDate.getDate())}/${pad(month + 1)}/${year}`;
      return {
        startDate: start,
        endDate: end,
        label: t('period.label.day', { date: formattedDate }),
      };
    }

    if (grain === 'week') {
      const start = getStartOfWeek(refDate);
      const end = getEndOfWeek(refDate);
      const weekNum = getWeekNumber(refDate);
      const range = formatDateRange(start, end);
      return {
        startDate: start,
        endDate: end,
        label: t('period.label.week', { week: weekNum, range }),
      };
    }

    if (grain === 'month') {
      const start = new Date(year, month, 1, 0, 0, 0, 0);
      const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
      return {
        startDate: start,
        endDate: end,
        label: t('period.label.month', { month: pad(month + 1), year }),
      };
    }

    if (grain === 'quarter') {
      const quarter = Math.floor(month / 3); // 0, 1, 2, 3
      const start = new Date(year, quarter * 3, 1, 0, 0, 0, 0);
      const end = new Date(year, (quarter + 1) * 3, 0, 23, 59, 59, 999);
      return {
        startDate: start,
        endDate: end,
        label: t('period.label.quarter', { quarter: quarter + 1, year }),
      };
    }

    if (grain === 'year') {
      const start = new Date(year, 0, 1, 0, 0, 0, 0);
      const end = new Date(year, 11, 31, 23, 59, 59, 999);
      return {
        startDate: start,
        endDate: end,
        label: t('period.label.year', { year }),
      };
    }

    // all
    return {
      startDate: new Date(0),
      endDate: new Date(8640000000000000),
      label: t('period.label.all'),
    };
  }, [grain, refDate, t]);

  const setGrain = useCallback(
    (nextGrain: PeriodGrain) => {
      updateUrl(nextGrain, refDate);
    },
    [updateUrl, refDate],
  );

  const prevPeriod = useCallback(() => {
    if (grain === 'all') return;
    const nextDate = new Date(refDate);
    if (grain === 'day') {
      nextDate.setDate(nextDate.getDate() - 1);
    } else if (grain === 'week') {
      nextDate.setDate(nextDate.getDate() - 7);
    } else if (grain === 'month') {
      nextDate.setMonth(nextDate.getMonth() - 1);
    } else if (grain === 'quarter') {
      nextDate.setMonth(nextDate.getMonth() - 3);
    } else {
      nextDate.setFullYear(nextDate.getFullYear() - 1);
    }
    updateUrl(grain, nextDate);
  }, [grain, refDate, updateUrl]);

  const nextPeriod = useCallback(() => {
    if (grain === 'all') return;
    const nextDate = new Date(refDate);
    if (grain === 'day') {
      nextDate.setDate(nextDate.getDate() + 1);
    } else if (grain === 'week') {
      nextDate.setDate(nextDate.getDate() + 7);
    } else if (grain === 'month') {
      nextDate.setMonth(nextDate.getMonth() + 1);
    } else if (grain === 'quarter') {
      nextDate.setMonth(nextDate.getMonth() + 3);
    } else {
      nextDate.setFullYear(nextDate.getFullYear() + 1);
    }
    updateUrl(grain, nextDate);
  }, [grain, refDate, updateUrl]);

  const resetToToday = useCallback(() => {
    updateUrl(grain, new Date());
  }, [grain, updateUrl]);

  const isItemInPeriod = useCallback(
    (dateInput: string | Date | undefined | null): boolean => {
      if (grain === 'all') return true;
      if (!dateInput) return false;
      const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
      if (isNaN(d.getTime())) return false;
      return d >= startDate && d <= endDate;
    },
    [grain, startDate, endDate],
  );

  const generateBuckets = useCallback(
    (
      items: Array<{ occurredAt: string; amount: number; type: 'income' | 'expense' }>,
    ): ChartBucket[] => {
      const month = refDate.getMonth();

      if (grain === 'week') {
        const dayNames = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
        const buckets: ChartBucket[] = dayNames.map((dName, idx) => ({
          key: `day-${idx}`,
          label: dName,
          income: 0,
          expense: 0,
        }));

        for (const item of items) {
          const d = new Date(item.occurredAt);
          if (isNaN(d.getTime()) || d < startDate || d > endDate) continue;
          const dayIdx = (d.getDay() + 6) % 7;
          if (item.type === 'income') {
            buckets[dayIdx].income += item.amount;
          } else {
            buckets[dayIdx].expense += item.amount;
          }
        }
        return buckets;
      }

      if (grain === 'month') {
        const lastDay = endDate.getDate();
        const intervals = [
          { key: 'p1', label: '1-5', start: 1, end: 5 },
          { key: 'p2', label: '6-10', start: 6, end: 10 },
          { key: 'p3', label: '11-15', start: 11, end: 15 },
          { key: 'p4', label: '16-20', start: 16, end: 20 },
          { key: 'p5', label: '21-25', start: 21, end: 25 },
          { key: 'p6', label: `26-${lastDay}`, start: 26, end: lastDay },
        ];

        const buckets: ChartBucket[] = intervals.map((iv) => ({
          key: iv.key,
          label: iv.label,
          income: 0,
          expense: 0,
        }));

        for (const item of items) {
          const d = new Date(item.occurredAt);
          if (isNaN(d.getTime()) || d < startDate || d > endDate) continue;
          const day = d.getDate();
          const bucketIndex = intervals.findIndex((iv) => day >= iv.start && day <= iv.end);
          if (bucketIndex >= 0) {
            if (item.type === 'income') {
              buckets[bucketIndex].income += item.amount;
            } else {
              buckets[bucketIndex].expense += item.amount;
            }
          }
        }
        return buckets;
      }

      if (grain === 'quarter') {
        const quarter = Math.floor(month / 3);
        const startMonth = quarter * 3;
        const pad = (n: number) => String(n).padStart(2, '0');
        const buckets: ChartBucket[] = [0, 1, 2].map((mIdx) => ({
          key: `m-${startMonth + mIdx}`,
          label: `T${pad(startMonth + mIdx + 1)}`,
          income: 0,
          expense: 0,
        }));

        for (const item of items) {
          const d = new Date(item.occurredAt);
          if (isNaN(d.getTime()) || d < startDate || d > endDate) continue;
          const m = d.getMonth();
          const bucketIndex = m - startMonth;
          if (bucketIndex >= 0 && bucketIndex < 3) {
            if (item.type === 'income') {
              buckets[bucketIndex].income += item.amount;
            } else {
              buckets[bucketIndex].expense += item.amount;
            }
          }
        }
        return buckets;
      }

      // year
      const pad = (n: number) => String(n).padStart(2, '0');
      const buckets: ChartBucket[] = Array.from({ length: 12 }, (_, i) => ({
        key: `m-${i}`,
        label: `T${pad(i + 1)}`,
        income: 0,
        expense: 0,
      }));

      for (const item of items) {
        const d = new Date(item.occurredAt);
        if (isNaN(d.getTime()) || d < startDate || d > endDate) continue;
        const m = d.getMonth();
        if (m >= 0 && m < 12) {
          if (item.type === 'income') {
            buckets[m].income += item.amount;
          } else {
            buckets[m].expense += item.amount;
          }
        }
      }
      return buckets;
    },
    [grain, refDate, startDate, endDate],
  );

  return useMemo(
    () => ({
      grain,
      refDate,
      startDate,
      endDate,
      label,
      setGrain,
      prevPeriod,
      nextPeriod,
      resetToToday,
      isItemInPeriod,
      generateBuckets,
    }),
    [
      grain,
      refDate,
      startDate,
      endDate,
      label,
      setGrain,
      prevPeriod,
      nextPeriod,
      resetToToday,
      isItemInPeriod,
      generateBuckets,
    ],
  );
}
