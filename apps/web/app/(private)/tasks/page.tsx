import type { Metadata } from 'next';
import { TasksScreen } from '@/modules/dashboard/view/tasks-screen';

export const metadata: Metadata = {
  title: 'Việc cần làm',
  description: 'Danh sách công việc và kế hoạch cá nhân từ Google Tasks.',
};

export default function TasksPage() {
  return <TasksScreen />;
}
