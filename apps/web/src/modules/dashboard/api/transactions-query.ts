'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ITransactionItem, IUpdateTransactionRequest } from '@telebot/contracts';
import { dashboardQueryKeys } from './dashboard-query';
import { deleteTransaction, updateTransaction } from './transactions-api';

export function useUpdateTransactionMutation() {
  const queryClient = useQueryClient();
  return useMutation<ITransactionItem, Error, { id: string; data: IUpdateTransactionRequest }>({
    mutationFn: ({ id, data }) => updateTransaction(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.detail() });
      void queryClient.invalidateQueries({ queryKey: ['transactions'] });
      void queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}

export function useDeleteTransactionMutation() {
  const queryClient = useQueryClient();
  return useMutation<boolean, Error, string>({
    mutationFn: (id) => deleteTransaction(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.detail() });
      void queryClient.invalidateQueries({ queryKey: ['transactions'] });
      void queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}
