import Link from 'next/link';
import type { ReactNode } from 'react';
import { APP_ROUTES } from '@telebot/contracts';

export type ReportsNavigationPage = 'home' | 'statistics' | 'contacts' | 'debts' | 'expenses';

const items: Array<{ page: ReportsNavigationPage; href: string; label: string }> = [
  { page: 'home', href: APP_ROUTES.reports, label: 'Trang chủ' },
  { page: 'statistics', href: APP_ROUTES.statistics, label: 'Thống kê' },
  { page: 'contacts', href: APP_ROUTES.contacts, label: 'Liên lạc' },
  { page: 'debts', href: APP_ROUTES.debts, label: 'Công nợ' },
  { page: 'expenses', href: APP_ROUTES.expenses, label: 'Khoản chi' },
];

export function ReportsNavigation({
  active,
  footer,
}: {
  active: ReportsNavigationPage;
  footer?: ReactNode;
}) {
  return (
    <aside className="app-nav" aria-label="Điều hướng dashboard">
      <div className="app-nav__brand">
        <span>Telebot</span>
        <small>Cá nhân</small>
      </div>
      <nav>
        {items.map((item) => (
          <Link
            className={item.page === active ? 'app-nav__item is-active' : 'app-nav__item'}
            aria-current={item.page === active ? 'page' : undefined}
            href={item.href}
            key={item.page}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      {footer}
    </aside>
  );
}
