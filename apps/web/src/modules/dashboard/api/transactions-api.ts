import {
  API_ROUTES,
  type IApiResponse,
  type ITransactionItem,
  type IUpdateTransactionRequest,
} from '@telebot/contracts';
import { httpClient } from '@/shared/api/http-client';

export async function updateTransaction(
  id: string,
  data: IUpdateTransactionRequest,
  signal?: AbortSignal,
): Promise<ITransactionItem> {
  const response = await httpClient.patch<IApiResponse<ITransactionItem>>(
    `${API_ROUTES.transactions}/${id}`,
    data,
    { signal },
  );
  return response.data.data;
}

export async function deleteTransaction(id: string, signal?: AbortSignal): Promise<boolean> {
  const response = await httpClient.delete<IApiResponse<{ deleted: boolean }>>(
    `${API_ROUTES.transactions}/${id}`,
    { signal },
  );
  return response.data.data.deleted;
}
