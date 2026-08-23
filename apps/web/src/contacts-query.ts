import { useQuery } from '@tanstack/react-query';
import { type IContactListItem } from '@telebot/contracts';
import { getContacts } from './contacts-api';

export const contactsQueryKeys = { list: () => ['contacts'] as const };

export function useContactsQuery(enabled: boolean) {
  return useQuery<IContactListItem[]>({
    queryKey: contactsQueryKeys.list(),
    queryFn: ({ signal }) => getContacts(signal),
    enabled,
  });
}
