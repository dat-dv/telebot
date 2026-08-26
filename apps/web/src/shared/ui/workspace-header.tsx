'use client';

import type { ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { API_ROUTES, APP_ROUTES } from '@telebot/contracts';
import { clearAccessToken } from '@/modules/auth/client/auth-storage';
import { httpClient } from '@/shared/api/http-client';
import { useLocale } from '@/shared/providers/locale-provider';
import { useMoneyVisibility } from '@/shared/providers/money-visibility-provider';

interface WorkspaceHeaderProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  showLogout?: boolean;
  showMoneyToggle?: boolean;
  extraActions?: ReactNode;
}

export function WorkspaceHeader({
  title,
  subtitle,
  onRefresh,
  showLogout = true,
  showMoneyToggle = true,
  extraActions,
}: WorkspaceHeaderProps) {
  const queryClient = useQueryClient();
  const { t } = useLocale();
  const { isMoneyVisible, toggleMoneyVisibility } = useMoneyVisibility();

  const handleLogout = async () => {
    try {
      await httpClient.post(API_ROUTES.dashboardLogout);
    } finally {
      clearAccessToken();
      queryClient.clear();
      window.location.assign(`${APP_ROUTES.home}?status=logged_out`);
    }
  };

  return (
    <header className="flex min-h-12 items-center justify-between gap-4 rounded border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900 max-[960px]:flex-wrap max-[960px]:gap-2 max-[960px]:px-2.5">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold tracking-[.08em] text-slate-400 uppercase dark:text-slate-500">
          Telebot
        </p>
        <h1
          className="truncate text-base font-bold text-slate-900 dark:text-slate-100"
          title={title}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="truncate text-xs text-slate-500 dark:text-slate-400" title={subtitle}>
            {subtitle}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2 max-[960px]:flex-wrap">
        {extraActions}
        {showMoneyToggle && (
          <button
            className="inline-flex min-h-[30px] items-center justify-center gap-1.5 rounded-[3px] border border-slate-300 !bg-white px-2.5 text-xs font-medium text-slate-700 hover:!border-slate-400 hover:!bg-slate-100 hover:!text-slate-900 dark:border-slate-600 dark:!bg-slate-800 dark:!text-slate-200 dark:hover:!border-slate-500 dark:hover:!bg-slate-700"
            type="button"
            onClick={toggleMoneyVisibility}
            aria-pressed={!isMoneyVisible}
            aria-label={isMoneyVisible ? t('common.hideMoney') : t('common.showMoney')}
            title={isMoneyVisible ? t('common.hideMoney') : t('common.showMoney')}
          >
            <span aria-hidden="true" className="text-xs leading-none">
              {isMoneyVisible ? '👁️' : '🔒'}
            </span>
            <span>{isMoneyVisible ? t('common.hideMoney') : t('common.showMoney')}</span>
          </button>
        )}
        {onRefresh && (
          <button
            className="inline-flex min-h-[30px] items-center justify-center rounded-[3px] border border-slate-300 !bg-white px-2.5 text-xs font-medium text-slate-900 hover:!border-slate-400 hover:!bg-slate-100 dark:border-slate-600 dark:!bg-slate-800 dark:!text-slate-100 dark:hover:!border-slate-500 dark:hover:!bg-slate-700"
            type="button"
            onClick={onRefresh}
          >
            {t('common.refresh')}
          </button>
        )}
        {showLogout && (
          <button
            className="inline-flex min-h-[30px] items-center justify-center rounded-[3px] border border-transparent !bg-transparent px-2.5 text-xs font-medium text-slate-600 hover:!border-slate-200 hover:!bg-slate-100 hover:!text-slate-900 dark:!text-slate-300 dark:hover:!border-slate-700 dark:hover:!bg-slate-800 dark:hover:!text-slate-100"
            type="button"
            onClick={() => void handleLogout()}
          >
            {t('common.logout')}
          </button>
        )}
      </div>
    </header>
  );
}
