import type { Metadata } from 'next';
import { Suspense } from 'react';
import { TransactionsScreen } from '@/modules/dashboard/view/transactions-screen';

export const metadata: Metadata = {
  title: 'Thu chi',
  description: 'Lịch sử dòng tiền và các giao dịch thu chi cá nhân.',
};

export default function TransactionsPage() {
  return (
    <Suspense>
      <TransactionsScreen />
    </Suspense>
  );
}
