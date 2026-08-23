'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { APP_ROUTES } from '@telebot/contracts';
import { useTheme } from '@/shared/providers/theme-provider';
import { useLocale } from '@/shared/providers/locale-provider';

export type ReportsNavigationPage = 'home' | 'statistics' | 'contacts' | 'debts' | 'expenses';

type NavigationIcon = 'overview' | 'chart' | 'contacts' | 'debts' | 'expenses';

const items: Array<{
  page: ReportsNavigationPage;
  href: string;
  label: 'nav.home' | 'nav.statistics' | 'nav.contacts' | 'nav.debts' | 'nav.expenses';
  icon: NavigationIcon;
}> = [
  { page: 'home', href: APP_ROUTES.reports, label: 'nav.home', icon: 'overview' },
  { page: 'statistics', href: APP_ROUTES.statistics, label: 'nav.statistics', icon: 'chart' },
  { page: 'contacts', href: APP_ROUTES.contacts, label: 'nav.contacts', icon: 'contacts' },
  { page: 'debts', href: APP_ROUTES.debts, label: 'nav.debts', icon: 'debts' },
  { page: 'expenses', href: APP_ROUTES.expenses, label: 'nav.expenses', icon: 'expenses' },
];

export function ReportsNavigation({
  active,
  footer,
}: {
  active: ReportsNavigationPage;
  footer?: ReactNode;
}) {
  const { theme, toggleTheme } = useTheme();
  const { locale, setLocale, t } = useLocale();
  const nextThemeLabel = theme === 'light' ? t('nav.dark') : t('nav.light');

  return (
    <aside className="app-nav" aria-label={t('nav.reports')}>
      <div className="app-nav__brand">
        <span className="app-nav__brand-mark" aria-hidden="true">
          T
        </span>
        <span>
          <strong>Telebot</strong>
          <small>{t('nav.personalSpace')}</small>
        </span>
      </div>
      <nav aria-label={t('nav.reports')}>
        <p className="app-nav__section-label">{t('nav.reports')}</p>
        {items.map((item) => (
          <Link
            className={item.page === active ? 'app-nav__item is-active' : 'app-nav__item'}
            aria-current={item.page === active ? 'page' : undefined}
            href={item.href}
            key={item.page}
          >
            <NavigationItemIcon icon={item.icon} />
            <span>{t(item.label)}</span>
          </Link>
        ))}
      </nav>
      <div className="app-nav__footer">
        {footer}
        <button
          aria-label={nextThemeLabel}
          className="theme-toggle"
          onClick={toggleTheme}
          title={nextThemeLabel}
          type="button"
        >
          <ThemeIcon theme={theme} />
          <span>{theme === 'light' ? t('nav.dark') : t('nav.light')}</span>
        </button>
        <label className="theme-toggle">
          <span>{t('common.language')}</span>
          <select
            aria-label={t('common.language')}
            onChange={(event) => setLocale(event.target.value as typeof locale)}
            value={locale}
          >
            <option value="vi">{t('web.language.vi')}</option>
            <option value="en">{t('web.language.en')}</option>
          </select>
        </label>
      </div>
    </aside>
  );
}

function ThemeIcon({ theme }: { theme: 'light' | 'dark' }) {
  const sharedProps = {
    'aria-hidden': true,
    className: 'app-nav__icon',
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 1.8,
    viewBox: '0 0 24 24',
  };

  return theme === 'light' ? (
    <svg {...sharedProps}>
      <path d="M20.4 15.5A8.5 8.5 0 0 1 8.5 3.6 8.5 8.5 0 1 0 20.4 15.5Z" />
    </svg>
  ) : (
    <svg {...sharedProps}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function NavigationItemIcon({ icon }: { icon: NavigationIcon }) {
  const sharedProps = {
    'aria-hidden': true,
    className: 'app-nav__icon',
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 1.8,
    viewBox: '0 0 24 24',
  };

  if (icon === 'overview') {
    return (
      <svg {...sharedProps}>
        <rect height="6" width="6" x="3" y="3" />
        <rect height="6" width="6" x="15" y="3" />
        <rect height="6" width="6" x="3" y="15" />
        <rect height="6" width="6" x="15" y="15" />
      </svg>
    );
  }
  if (icon === 'chart') {
    return (
      <svg {...sharedProps}>
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="m7 15 4-4 3 2 4-6" />
      </svg>
    );
  }
  if (icon === 'contacts') {
    return (
      <svg {...sharedProps}>
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 20c.7-3.1 2.5-4.7 5.5-4.7s4.8 1.6 5.5 4.7" />
        <path d="M16 8h4" />
        <path d="M18 6v4" />
      </svg>
    );
  }
  if (icon === 'debts') {
    return (
      <svg {...sharedProps}>
        <rect height="15" rx="1.5" width="16" x="4" y="4.5" />
        <path d="M8 9.5h8" />
        <path d="M8 14.5h5" />
      </svg>
    );
  }
  return (
    <svg {...sharedProps}>
      <path d="M6 3v18" />
      <path d="M18 3v18" />
      <path d="M6 7h12" />
      <path d="M6 12h12" />
      <path d="M6 17h12" />
    </svg>
  );
}
