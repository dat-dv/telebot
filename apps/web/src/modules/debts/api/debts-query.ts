'use client';

import { useQuery } from '@tanstack/react-query';
import type { IDebtListItem } from '@telebot/contracts';
import { getDebts } from './debts-api';

export const debtsQueryKeys = { list: () => ['debts'] as const };

export function useDebtsQuery() {
  return useQuery<IDebtListItem[]>({
    queryKey: debtsQueryKeys.list(),
    queryFn: ({ signal }) => getDebts(signal),
  });
}
