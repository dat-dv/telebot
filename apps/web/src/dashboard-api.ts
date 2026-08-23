import { API_ROUTES, type IApiResponse, type IDashboardData } from '@telebot/contracts';
import { httpClient } from './http-client';

export async function getDashboard(signal?: AbortSignal): Promise<IDashboardData> {
  const response = await httpClient.get<IApiResponse<IDashboardData>>(API_ROUTES.dashboard, {
    signal,
  });
  return response.data.data;
}
