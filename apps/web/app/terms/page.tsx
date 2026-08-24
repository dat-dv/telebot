'use client';

import { APP_ROUTES } from '@telebot/contracts';
import Link from 'next/link';
import { useLocale } from '@/shared/providers/locale-provider';

export default function TermsPage() {
  const { t } = useLocale();
  const email = t('public.supportEmail');

  return (
    <main className="legal-page">
      <header className="legal-header">
        <Link className="public-brand" href={APP_ROUTES.about}>
          <span aria-hidden="true">TB</span> {t('public.brand')}
        </Link>
        <Link href={APP_ROUTES.privacy}>{t('public.privacy.title')}</Link>
      </header>
      <article>
        <p className="public-eyebrow">{t('public.updated')}</p>
        <h1>{t('public.terms.title')}</h1>
        <h2>{t('public.terms.acceptanceTitle')}</h2><p>{t('public.terms.acceptanceDescription')}</p>
        <h2>{t('public.terms.scopeTitle')}</h2><p>{t('public.terms.scopeDescription')}</p>
        <h2>{t('public.terms.accountTitle')}</h2><p>{t('public.terms.accountDescription')}</p>
        <h2>{t('public.terms.legalTitle')}</h2><p>{t('public.terms.legalDescription')}</p>
        <h2>{t('public.terms.changeTitle')}</h2><p>{t('public.terms.changeDescription')}</p>
        <h2>{t('public.terms.contactTitle')}</h2><p>{t('public.terms.contactDescription', { email })}</p>
      </article>
      <footer className="public-footer">
        <Link href={APP_ROUTES.about}>{t('public.privacy.about')}</Link>
        <Link href={APP_ROUTES.privacy}>{t('public.privacy.title')}</Link>
      </footer>
    </main>
  );
}
