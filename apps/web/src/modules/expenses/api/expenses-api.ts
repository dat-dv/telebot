import { API_ROUTES, type IApiResponse, type IExpenseListItem } from '@telebot/contracts';
import { httpClient } from '@/shared/api/http-client';

export async function getExpenses(signal?: AbortSignal): Promise<IExpenseListItem[]> {
  const response = await httpClient.get<IApiResponse<IExpenseListItem[]>>(API_ROUTES.expenses, {
    signal,
  });
  return response.data.data;
}
