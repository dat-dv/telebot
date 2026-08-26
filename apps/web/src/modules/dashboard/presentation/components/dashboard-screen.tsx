'use client';

import { DashboardHomeScreen } from './dashboard-home-screen';
import { AnalyticsScreen } from './analytics-screen';

export { DashboardHomeScreen } from './dashboard-home-screen';
export { AnalyticsScreen } from './analytics-screen';
export { TransactionsScreen } from './transactions-screen';
export { CalendarScreen } from './calendar-screen';
export { TasksScreen } from './tasks-screen';
export { RemindersScreen } from './reminders-screen';

export function DashboardScreen({ page }: { page: 'home' | 'statistics' }) {
  if (page === 'statistics') {
    return <AnalyticsScreen />;
  }
  return <DashboardHomeScreen />;
}
