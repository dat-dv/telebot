import type { Metadata } from 'next';
import { AnalyticsScreen } from '@/modules/dashboard/view/analytics-screen';

export const metadata: Metadata = {
  title: 'Phân tích tài chính',
  description: 'Tổng quan xu hướng tài chính và phân bổ chi tiêu cá nhân.',
};

export default function AnalyticsPage() {
  return <AnalyticsScreen />;
}
