'use client';

import type { ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { API_ROUTES, APP_ROUTES } from '@telebot/contracts';
import { clearAccessToken } from '@/modules/auth/client/auth-storage';
import { httpClient } from '@/shared/api/http-client';
import { useLocale } from '@/shared/providers/locale-provider';

interface WorkspaceHeaderProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  showLogout?: boolean;
  extraActions?: ReactNode;
}

export function WorkspaceHeader({
  title,
  subtitle,
  onRefresh,
  showLogout = true,
  extraActions,
}: WorkspaceHeaderProps) {
  const queryClient = useQueryClient();
  const { t } = useLocale();

  const handleLogout = async () => {
    try {
      await httpClient.post(API_ROUTES.dashboardLogout);
    } finally {
      clearAccessToken();
      queryClient.clear();
      window.location.assign(APP_ROUTES.home);
    }
  };

  return (
    <header className="workspace__header">
      <div>
        <p className="eyebrow">Telebot</p>
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      <div className="header-status">
        {extraActions}
        {onRefresh && (
          <button type="button" onClick={onRefresh}>
            {t('common.refresh')}
          </button>
        )}
        {showLogout && (
          <button type="button" className="button--quiet" onClick={() => void handleLogout()}>
            {t('common.logout')}
          </button>
        )}
      </div>
    </header>
  );
}
