import { API_ROUTES, type IApiResponse, type IDebtListItem } from '@telebot/contracts';
import { httpClient } from '@/shared/api/http-client';

export async function getDebts(signal?: AbortSignal): Promise<IDebtListItem[]> {
  const response = await httpClient.get<IApiResponse<IDebtListItem[]>>(API_ROUTES.debts, {
    signal,
  });
  return response.data.data;
}
