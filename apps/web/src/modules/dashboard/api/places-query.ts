'use client';

import { useQuery } from '@tanstack/react-query';
import type { IFinancePlace } from '@telebot/contracts';
import { getPlaces } from './places-api';

export const placesQueryKeys = {
  all: ['places'] as const,
  list: () => ['places', 'list'] as const,
};

export function usePlacesQuery() {
  return useQuery<IFinancePlace[]>({
    queryKey: placesQueryKeys.list(),
    queryFn: ({ signal }) => getPlaces(signal),
  });
}
