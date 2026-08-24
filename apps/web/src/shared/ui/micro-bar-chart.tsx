'use client';

import { useState } from 'react';
import { localeTag } from '@telebot/contracts';
import { useLocale } from '@/shared/providers/locale-provider';

export interface ChartBucket {
  key: string;
  label: string;
  income: number;
  expense: number;
}

interface MicroBarChartProps {
  buckets: ChartBucket[];
  height?: number;
}

export function MicroBarChart({ buckets, height = 76 }: MicroBarChartProps) {
  const { locale, t } = useLocale();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const money = (val: number) =>
    new Intl.NumberFormat(localeTag(locale), {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(val);

  if (!buckets.length) {
    return (
      <div className="micro-chart-empty" style={{ height }}>
        <span>{t('chart.noData')}</span>
      </div>
    );
  }

  const maxVal = Math.max(...buckets.map((b) => Math.max(b.income, b.expense)), 1);

  const svgWidth = 500;
  const chartHeight = height - 18; // Leave 18px for bottom labels
  const bucketWidth = svgWidth / buckets.length;
  const barWidth = Math.max(Math.min((bucketWidth - 6) / 2, 14), 3);

  const hoveredBucket = hoveredIndex !== null ? buckets[hoveredIndex] : null;

  return (
    <div className="micro-chart-container" style={{ height }}>
      {hoveredBucket && (
        <div className="micro-chart-tooltip">
          <span className="tooltip-title">{hoveredBucket.label}</span>
          <span className="tooltip-item text-positive">+ {money(hoveredBucket.income)}</span>
          <span className="tooltip-item text-warning">- {money(hoveredBucket.expense)}</span>
        </div>
      )}

      <svg
        viewBox={`0 0 ${svgWidth} ${height}`}
        className="micro-chart-svg"
        preserveAspectRatio="none"
      >
        {/* Baseline grid */}
        <line
          x1="0"
          y1={chartHeight}
          x2={svgWidth}
          y2={chartHeight}
          className="micro-chart-baseline"
        />

        {buckets.map((bucket, i) => {
          const centerX = i * bucketWidth + bucketWidth / 2;
          const incomeHeight = (bucket.income / maxVal) * (chartHeight - 4);
          const expenseHeight = (bucket.expense / maxVal) * (chartHeight - 4);

          const incomeX = centerX - barWidth - 1;
          const expenseX = centerX + 1;
          const incomeY = chartHeight - incomeHeight;
          const expenseY = chartHeight - expenseHeight;

          const isHovered = hoveredIndex === i;

          return (
            <g
              key={bucket.key}
              className={`micro-chart-group ${isHovered ? 'is-hovered' : ''}`}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Invisible touch/hover hit area */}
              <rect
                x={i * bucketWidth}
                y="0"
                width={bucketWidth}
                height={height}
                fill="transparent"
                style={{ cursor: 'pointer' }}
              />

              {/* Income bar */}
              {bucket.income > 0 && (
                <rect
                  x={incomeX}
                  y={incomeY}
                  width={barWidth}
                  height={Math.max(incomeHeight, 2)}
                  rx="1"
                  className="bar-income"
                />
              )}

              {/* Expense bar */}
              {bucket.expense > 0 && (
                <rect
                  x={expenseX}
                  y={expenseY}
                  width={barWidth}
                  height={Math.max(expenseHeight, 2)}
                  rx="1"
                  className="bar-expense"
                />
              )}

              {/* Label */}
              <text x={centerX} y={height - 3} textAnchor="middle" className="micro-chart-label">
                {bucket.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
