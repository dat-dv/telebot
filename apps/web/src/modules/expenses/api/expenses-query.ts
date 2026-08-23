'use client';

import { useQuery } from '@tanstack/react-query';
import type { IExpenseListItem } from '@telebot/contracts';
import { getExpenses } from './expenses-api';

export const expensesQueryKeys = { list: () => ['expenses'] as const };

export function useExpensesQuery() {
  return useQuery<IExpenseListItem[]>({
    queryKey: expensesQueryKeys.list(),
    queryFn: ({ signal }) => getExpenses(signal),
  });
}
