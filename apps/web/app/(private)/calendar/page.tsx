import type { Metadata } from 'next';
import { CalendarScreen } from '@/modules/dashboard/view/calendar-screen';

export const metadata: Metadata = {
  title: 'Lịch trình sự kiện',
  description: 'Lịch trình sự kiện và công việc cá nhân 7 ngày tới.',
};

export default function CalendarPage() {
  return <CalendarScreen />;
}
