import { useQuery } from '@tanstack/react-query';
import type { IDashboardData } from '@telebot/contracts';
import { getDashboard } from './dashboard-api';

export const dashboardQueryKeys = { detail: () => ['dashboard'] as const };

export function useDashboardQuery() {
  return useQuery<IDashboardData>({
    queryKey: dashboardQueryKeys.detail(),
    queryFn: ({ signal }) => getDashboard(signal),
  });
}
