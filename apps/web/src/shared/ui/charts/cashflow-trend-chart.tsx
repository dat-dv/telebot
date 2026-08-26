'use client';

import { useState } from 'react';
import { useLocale } from '@/shared/providers/locale-provider';
import { useMoneyFormatter } from '@/shared/providers/money-visibility-provider';
import type { IAnalyticsTrendBucket } from '@telebot/contracts';

interface CashflowTrendChartProps {
  buckets: IAnalyticsTrendBucket[];
  height?: number;
}

export function CashflowTrendChart({ buckets, height = 180 }: CashflowTrendChartProps) {
  const { t } = useLocale();
  const money = useMoneyFormatter();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!buckets.length) {
    return (
      <div
        className="flex items-center justify-center text-[11px] text-slate-400 italic"
        style={{ height }}
      >
        <span>{t('analytics.emptyChartData')}</span>
      </div>
    );
  }

  const maxVal = Math.max(
    ...buckets.map((b) => Math.max(b.income, b.expense, Math.abs(b.balance))),
    1,
  );
  const svgWidth = 600;
  const labelH = 20;
  const chartH = height - labelH;
  const bucketWidth = svgWidth / buckets.length;
  const barWidth = Math.max(Math.min((bucketWidth - 8) / 2, 18), 3);
  const halfChart = chartH / 2;

  const hoveredBucket = hoveredIndex !== null ? buckets[hoveredIndex] : null;

  return (
    <div className="relative w-full" style={{ height: height + 28 }}>
      {/* Legend */}
      <div className="mb-1 flex items-center gap-3">
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-700 dark:text-sky-400">
          <span className="size-2 rounded-sm bg-sky-600 dark:bg-sky-500" />
          {t('chart.income')}
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-400">
          <span className="size-2 rounded-sm bg-amber-500 dark:bg-amber-400" />
          {t('chart.expense')}
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-violet-700 dark:text-violet-400">
          <span className="inline-block h-0.5 w-4 bg-violet-500 dark:bg-violet-400" />
          {t('analytics.chart.netBalance')}
        </span>
      </div>

      {/* Tooltip */}
      {hoveredBucket && (
        <div className="pointer-events-none absolute top-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-[3px] bg-slate-900 px-2 py-1 text-[11px] whitespace-nowrap text-slate-50 shadow-md dark:bg-slate-700">
          <span className="font-semibold text-slate-300">{hoveredBucket.label}</span>
          <span className="text-sky-400">+ {money(hoveredBucket.income)}</span>
          <span className="text-amber-400">- {money(hoveredBucket.expense)}</span>
          <span className={hoveredBucket.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
            = {money(hoveredBucket.balance)}
          </span>
        </div>
      )}

      <svg
        viewBox={`0 0 ${svgWidth} ${height}`}
        className="w-full overflow-visible"
        style={{ height }}
        preserveAspectRatio="none"
      >
        {/* Zero line */}
        <line
          x1="0"
          y1={halfChart}
          x2={svgWidth}
          y2={halfChart}
          strokeDasharray="3 3"
          strokeWidth="1"
          className="stroke-slate-200 dark:stroke-slate-700"
        />
        {/* Baseline */}
        <line
          x1="0"
          y1={chartH}
          x2={svgWidth}
          y2={chartH}
          strokeWidth="1"
          className="stroke-slate-200 dark:stroke-slate-700"
        />

        {/* Net balance polyline */}
        {buckets.length > 1 && (
          <polyline
            points={buckets
              .map((b, i) => {
                const cx = i * bucketWidth + bucketWidth / 2;
                const cy = chartH - ((b.balance / maxVal) * (chartH - 8) + 0);
                return `${cx},${cy}`;
              })
              .join(' ')}
            fill="none"
            strokeWidth="1.5"
            className="stroke-violet-500 dark:stroke-violet-400"
          />
        )}

        {buckets.map((bucket, i) => {
          const centerX = i * bucketWidth + bucketWidth / 2;
          const incomeH = (bucket.income / maxVal) * (chartH - 8);
          const expenseH = (bucket.expense / maxVal) * (chartH - 8);
          const incomeX = centerX - barWidth - 1;
          const expenseX = centerX + 1;
          const incomeY = chartH - incomeH;
          const expenseY = chartH - expenseH;
          const isHovered = hoveredIndex === i;

          return (
            <g
              key={bucket.key}
              className="group cursor-pointer"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <rect
                x={i * bucketWidth}
                y="0"
                width={bucketWidth}
                height={height}
                fill="transparent"
              />

              {bucket.income > 0 && (
                <rect
                  x={incomeX}
                  y={incomeY}
                  width={barWidth}
                  height={Math.max(incomeH, 2)}
                  rx="1"
                  className={`fill-sky-500 transition-opacity dark:fill-sky-500 ${isHovered ? 'opacity-100' : 'opacity-75'}`}
                />
              )}

              {bucket.expense > 0 && (
                <rect
                  x={expenseX}
                  y={expenseY}
                  width={barWidth}
                  height={Math.max(expenseH, 2)}
                  rx="1"
                  className={`fill-amber-500 transition-opacity dark:fill-amber-400 ${isHovered ? 'opacity-100' : 'opacity-75'}`}
                />
              )}

              <text
                x={centerX}
                y={chartH + labelH - 4}
                textAnchor="middle"
                className="fill-slate-400 text-[9px] font-medium dark:fill-slate-500"
              >
                {bucket.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
