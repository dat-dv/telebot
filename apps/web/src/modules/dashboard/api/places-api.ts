import { API_ROUTES, type IApiResponse, type IFinancePlace } from '@telebot/contracts';
import { httpClient } from '@/shared/api/http-client';

export async function getPlaces(signal?: AbortSignal): Promise<IFinancePlace[]> {
  const response = await httpClient.get<IApiResponse<IFinancePlace[]>>(API_ROUTES.places, { signal });
  return response.data.data;
}
