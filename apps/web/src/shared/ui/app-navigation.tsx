'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, type ReactNode } from 'react';
import { APP_ROUTES, type TranslationKey } from '@telebot/contracts';
import { useTheme } from '@/shared/providers/theme-provider';
import { useLocale } from '@/shared/providers/locale-provider';

export type NavigationPage =
  'home' | 'transactions' | 'debts' | 'analytics' | 'calendar' | 'tasks' | 'reminders' | 'contacts';

type NavigationIcon =
  | 'overview'
  | 'transactions'
  | 'debts'
  | 'analytics'
  | 'calendar'
  | 'tasks'
  | 'reminders'
  | 'contacts';

interface NavItem {
  page: NavigationPage;
  href: string;
  labelKey: TranslationKey;
  icon: NavigationIcon;
}

interface NavSection {
  titleKey: TranslationKey;
  items: NavItem[];
}

const navSections: readonly NavSection[] = [
  {
    titleKey: 'nav.section.overview',
    items: [{ page: 'home', href: APP_ROUTES.home, labelKey: 'nav.home', icon: 'overview' }],
  },
  {
    titleKey: 'nav.section.finance',
    items: [
      {
        page: 'transactions',
        href: APP_ROUTES.transactions,
        labelKey: 'nav.transactions',
        icon: 'transactions',
      },
      { page: 'debts', href: APP_ROUTES.debts, labelKey: 'nav.debts', icon: 'debts' },
      {
        page: 'analytics',
        href: APP_ROUTES.analytics,
        labelKey: 'nav.analytics',
        icon: 'analytics',
      },
    ],
  },
  {
    titleKey: 'nav.section.planning',
    items: [
      {
        page: 'calendar',
        href: APP_ROUTES.calendar,
        labelKey: 'nav.calendar',
        icon: 'calendar',
      },
      { page: 'tasks', href: APP_ROUTES.tasks, labelKey: 'nav.tasks', icon: 'tasks' },
      {
        page: 'reminders',
        href: APP_ROUTES.reminders,
        labelKey: 'nav.reminders',
        icon: 'reminders',
      },
    ],
  },
  {
    titleKey: 'nav.section.data',
    items: [
      {
        page: 'contacts',
        href: APP_ROUTES.contacts,
        labelKey: 'nav.contacts',
        icon: 'contacts',
      },
    ],
  },
];

export function AppNavigation({ active, footer }: { active?: NavigationPage; footer?: ReactNode }) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { locale, setLocale, t } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const nextThemeLabel = theme === 'light' ? t('nav.dark') : t('nav.light');

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const isItemActive = (item: NavItem): boolean => {
    if (active) return active === item.page;
    if (item.href === APP_ROUTES.home) {
      return pathname === '/' || pathname === '';
    }
    return pathname.startsWith(item.href);
  };

  return (
    <>
      <header className="mobile-header">
        <Link
          className="mobile-header__brand"
          href={APP_ROUTES.home}
          onClick={() => setIsOpen(false)}
        >
          <span className="app-nav__brand-mark" aria-hidden="true">
            T
          </span>
          <strong>Telebot</strong>
        </Link>
        <button
          aria-controls="app-navigation-drawer"
          aria-expanded={isOpen}
          aria-label={isOpen ? t('nav.closeMenu') : t('nav.openMenu')}
          className="mobile-header__toggle"
          onClick={() => setIsOpen((prev) => !prev)}
          type="button"
        >
          {isOpen ? <CloseIcon /> : <HamburgerIcon />}
        </button>
      </header>

      {isOpen && (
        <div aria-hidden="true" className="app-nav__backdrop" onClick={() => setIsOpen(false)} />
      )}

      <aside
        id="app-navigation-drawer"
        className={isOpen ? 'app-nav is-open' : 'app-nav'}
        aria-label={t('nav.personalSpace')}
      >
        <div className="app-nav__header">
          <div className="app-nav__brand">
            <span className="app-nav__brand-mark" aria-hidden="true">
              T
            </span>
            <span>
              <strong>Telebot</strong>
              <small>{t('nav.personalSpace')}</small>
            </span>
          </div>
          <button
            aria-label={t('nav.closeMenu')}
            className="app-nav__close-btn"
            onClick={() => setIsOpen(false)}
            type="button"
          >
            <CloseIcon />
          </button>
        </div>

        <nav aria-label={t('nav.personalSpace')}>
          {navSections.map((section) => (
            <div key={section.titleKey} className="app-nav__group">
              <p className="app-nav__section-label">{t(section.titleKey)}</p>
              {section.items.map((item) => {
                const activeState = isItemActive(item);
                return (
                  <Link
                    className={activeState ? 'app-nav__item is-active' : 'app-nav__item'}
                    aria-current={activeState ? 'page' : undefined}
                    href={item.href}
                    key={item.page}
                    onClick={() => setIsOpen(false)}
                  >
                    <NavigationItemIcon icon={item.icon} />
                    <span>{t(item.labelKey)}</span>
                  </Link>
                );
              })}
            </div>
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
          <div className="language-selector">
            <span>{t('common.language')}</span>
            <select
              aria-label={t('common.language')}
              onChange={(event) => setLocale(event.target.value as typeof locale)}
              value={locale}
            >
              <option value="vi">{t('web.language.vi')}</option>
              <option value="en">{t('web.language.en')}</option>
            </select>
          </div>
        </div>
      </aside>
    </>
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
  if (icon === 'transactions') {
    return (
      <svg {...sharedProps}>
        <path d="m7 16 4-4-4-4" />
        <path d="m17 8-4 4 4 4" />
        <path d="M3 12h18" />
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
  if (icon === 'analytics') {
    return (
      <svg {...sharedProps}>
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="m7 15 4-4 3 2 4-6" />
      </svg>
    );
  }
  if (icon === 'calendar') {
    return (
      <svg {...sharedProps}>
        <rect height="16" rx="2" width="18" x="3" y="4" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    );
  }
  if (icon === 'tasks') {
    return (
      <svg {...sharedProps}>
        <path d="m9 11 3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    );
  }
  if (icon === 'reminders') {
    return (
      <svg {...sharedProps}>
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
    );
  }
  return (
    <svg {...sharedProps}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 20c.7-3.1 2.5-4.7 5.5-4.7s4.8 1.6 5.5 4.7" />
      <path d="M16 8h4" />
      <path d="M18 6v4" />
    </svg>
  );
}

function HamburgerIcon() {
  const sharedProps = {
    'aria-hidden': true,
    className: 'app-nav__icon',
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 2,
    viewBox: '0 0 24 24',
  };

  return (
    <svg {...sharedProps}>
      <line x1="3" x2="21" y1="6" y2="6" />
      <line x1="3" x2="21" y1="12" y2="12" />
      <line x1="3" x2="21" y1="18" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  const sharedProps = {
    'aria-hidden': true,
    className: 'app-nav__icon',
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 2,
    viewBox: '0 0 24 24',
  };

  return (
    <svg {...sharedProps}>
      <line x1="18" x2="6" y1="6" y2="18" />
      <line x1="6" x2="18" y1="6" y2="18" />
    </svg>
  );
}
