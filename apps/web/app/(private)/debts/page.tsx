import type { Metadata } from 'next';
import { DebtsScreen } from '@/modules/debts/view/debts-screen';

export const metadata: Metadata = {
  title: 'Vay & cho vay',
  description: 'Theo dõi tiền bạn cho mượn và tiền bạn đang vay chính xác, minh bạch.',
};

export default function DebtsPage() {
  return <DebtsScreen />;
}
