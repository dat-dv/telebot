'use client';

import { useState } from 'react';
import { useLocale } from '@/shared/providers/locale-provider';
import { useMoneyFormatter } from '@/shared/providers/money-visibility-provider';
import type { IAnalyticsCategoryBreakdown } from '@telebot/contracts';

interface CategoryDonutChartProps {
  categories: IAnalyticsCategoryBreakdown[];
  totalAmount?: number;
  height?: number;
}

const PALETTE = [
  '#0284c7', // sky-600
  '#f59e0b', // amber-500
  '#10b981', // emerald-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#f97316', // orange-500
  '#06b6d4', // cyan-500
  '#64748b', // slate-500
];

export function CategoryDonutChart({
  categories,
  totalAmount,
  height = 180,
}: CategoryDonutChartProps) {
  const { t } = useLocale();
  const money = useMoneyFormatter();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const expenseCategories = categories.filter((c) => c.type === 'expense' && c.amount > 0);
  const sum = totalAmount ?? expenseCategories.reduce((acc, c) => acc + c.amount, 0);

  if (!expenseCategories.length || sum <= 0) {
    return (
      <div
        className="flex items-center justify-center text-[11px] text-slate-400 italic"
        style={{ height }}
      >
        <span>{t('analytics.emptyChartData')}</span>
      </div>
    );
  }

  // Top 5 and others
  const top5 = expenseCategories.slice(0, 5);
  const remaining = expenseCategories.slice(5);
  const remainingAmount = remaining.reduce((acc, c) => acc + c.amount, 0);

  const slices: Array<{ label: string; amount: number; percentage: number; color: string }> = [
    ...top5.map((c, i) => ({
      label: c.category,
      amount: c.amount,
      percentage: sum > 0 ? (c.amount / sum) * 100 : 0,
      color: c.color || PALETTE[i % PALETTE.length],
    })),
  ];

  if (remainingAmount > 0) {
    slices.push({
      label: t('common.allCategories'),
      amount: remainingAmount,
      percentage: sum > 0 ? (remainingAmount / sum) * 100 : 0,
      color: PALETTE[5 % PALETTE.length],
    });
  }

  // Calculate SVG donut segments (using stroke-dasharray on circle)
  const size = 110;
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativeOffset = 0;
  const donutSegments = slices.map((slice) => {
    const dashLength = (slice.percentage / 100) * circumference;
    const strokeDasharray = `${dashLength} ${circumference - dashLength}`;
    const strokeDashoffset = -cumulativeOffset;
    cumulativeOffset += dashLength;
    return {
      ...slice,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  const activeSlice = hoveredIdx !== null ? slices[hoveredIdx] : null;

  return (
    <div className="grid grid-cols-[110px_minmax(0,1fr)] items-center gap-3 max-[480px]:grid-cols-1">
      {/* Donut SVG */}
      <div className="relative flex size-[110px] items-center justify-center self-center max-[480px]:mx-auto">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="size-[110px] -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            strokeWidth={strokeWidth}
            className="stroke-slate-100 dark:stroke-slate-800"
          />
          {donutSegments.map((segment, idx) => (
            <circle
              key={segment.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke={segment.color}
              strokeWidth={hoveredIdx === idx ? strokeWidth + 2 : strokeWidth}
              strokeDasharray={segment.strokeDasharray}
              strokeDashoffset={segment.strokeDashoffset}
              className="cursor-pointer transition-all duration-200"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            />
          ))}
        </svg>

        {/* Center label */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[9px] font-semibold text-slate-400 uppercase">
            {activeSlice ? activeSlice.label : t('dashboard.columns.category')}
          </span>
          <strong className="text-[10.5px] font-bold text-slate-900 tabular-nums dark:text-slate-100">
            {activeSlice ? `${activeSlice.percentage.toFixed(1)}%` : `${slices.length}`}
          </strong>
        </div>
      </div>

      {/* Legend list */}
      <div className="flex flex-col justify-center gap-1.5 overflow-hidden">
        <div className="mb-0.5 flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          <span>{t('analytics.topCategories')}</span>
          <span>{money(sum)}</span>
        </div>
        {slices.map((slice, idx) => (
          <div
            key={slice.label}
            className={`group flex cursor-pointer flex-col gap-0.5 rounded px-1 py-0.5 text-xs transition-colors ${
              hoveredIdx === idx
                ? 'bg-slate-100 dark:bg-slate-800'
                : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 truncate">
                <span
                  className="size-2 shrink-0 rounded-xs"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="truncate font-medium text-slate-700 dark:text-slate-300">
                  {slice.label}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 tabular-nums">
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {money(slice.amount)}
                </span>
                <span className="text-[10px] text-slate-400">({slice.percentage.toFixed(1)}%)</span>
              </div>
            </div>
            {/* Progress track */}
            <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(slice.percentage, 100)}%`,
                  backgroundColor: slice.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
