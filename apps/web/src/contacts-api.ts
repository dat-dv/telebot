import { API_ROUTES, type IApiResponse, type IContactListItem } from '@telebot/contracts';
import { httpClient } from './http-client';

export async function getContacts(signal?: AbortSignal): Promise<IContactListItem[]> {
  const response = await httpClient.get<IApiResponse<IContactListItem[]>>(API_ROUTES.contacts, {
    signal,
  });
  return response.data.data;
}
