import {
  API_ROUTES,
  type IApiResponse,
  type ICreateDebtPaymentRequest,
  type IDebtListItem,
  type IDebtPaymentItem,
  type IUpdateDebtRequest,
} from '@telebot/contracts';
import { httpClient } from '@/shared/api/http-client';

export async function getDebts(signal?: AbortSignal): Promise<IDebtListItem[]> {
  const response = await httpClient.get<IApiResponse<IDebtListItem[]>>(API_ROUTES.debts, {
    signal,
  });
  return response.data.data;
}

export async function updateDebt(
  id: string,
  data: IUpdateDebtRequest,
  signal?: AbortSignal,
): Promise<IDebtListItem> {
  const response = await httpClient.patch<IApiResponse<IDebtListItem>>(
    `${API_ROUTES.debts}/${id}`,
    data,
    { signal },
  );
  return response.data.data;
}

export async function createDebtPayment(
  data: ICreateDebtPaymentRequest,
  signal?: AbortSignal,
): Promise<IDebtPaymentItem> {
  const response = await httpClient.post<IApiResponse<IDebtPaymentItem>>(
    API_ROUTES.debtPayments,
    data,
    { signal },
  );
  return response.data.data;
}
