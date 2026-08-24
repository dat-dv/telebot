'use client';

import { APP_ROUTES } from '@telebot/contracts';
import Link from 'next/link';
import { useLocale } from '@/shared/providers/locale-provider';

export default function PrivacyPage() {
  const { t } = useLocale();
  const email = t('public.supportEmail');

  return (
    <main className="legal-page">
      <header className="legal-header">
        <Link className="public-brand" href={APP_ROUTES.about}><span aria-hidden="true">TB</span> {t('public.brand')}</Link>
        <Link href={APP_ROUTES.terms}>{t('public.terms.title')}</Link>
      </header>
      <article>
        <p className="public-eyebrow">{t('public.updated')}</p>
        <h1>{t('public.privacy.title')}</h1>
        <p>{t('public.privacy.intro')}</p>

        <h2>{t('public.privacy.dataTitle')}</h2>
        <p>{t('public.privacy.dataDescription')}</p>
        <p>{t('public.privacy.scopesIntro')}</p>
        <ul>
          <li>{t('public.privacy.profileScope')}</li>
          <li>{t('public.privacy.calendarScope')}</li>
          <li>{t('public.privacy.tasksScope')}</li>
        </ul>

        <h2>{t('public.privacy.useTitle')}</h2>
        <p>{t('public.privacy.useDescription')}</p>
        <p>{t('public.privacy.policyPrefix')}<a href="https://developers.google.com/terms/api-services-user-data-policy" rel="noreferrer">{t('public.privacy.policyLink')}</a>{t('public.privacy.policySuffix')}</p>

        <h2>{t('public.privacy.securityTitle')}</h2>
        <p>{t('public.privacy.securityDescription')}</p>

        <h2>{t('public.privacy.retentionTitle')}</h2>
        <p>{t('public.privacy.retentionDescription', { email })}</p>

        <h2>{t('public.privacy.contactTitle')}</h2>
        <p>{t('public.privacy.contactDescription', { email })}</p>
      </article>
      <footer className="public-footer"><Link href={APP_ROUTES.about}>{t('public.privacy.about')}</Link><Link href={APP_ROUTES.terms}>{t('public.terms.title')}</Link></footer>
    </main>
  );
}
