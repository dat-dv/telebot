'use client';

import { APP_ROUTES } from '@telebot/contracts';
import Link from 'next/link';
import { useLocale } from '@/shared/providers/locale-provider';

export default function AboutPage() {
  const { t } = useLocale();
  const email = t('public.supportEmail');

  return (
    <main className="public-page">
      <header className="public-header">
        <Link className="public-brand" href={APP_ROUTES.about} aria-label={t('public.brand')}>
          <span aria-hidden="true">TB</span> {t('public.brand')}
        </Link>
        <nav aria-label={t('public.about.navigation')}>
          <Link href={APP_ROUTES.privacy}>{t('public.about.privacy')}</Link>
          <Link href={APP_ROUTES.terms}>{t('public.about.terms')}</Link>
        </nav>
      </header>

      <section className="public-hero">
        <p className="public-eyebrow">{t('public.about.eyebrow')}</p>
        <h1>{t('public.about.title')}</h1>
        <p>{t('public.about.description')}</p>
        <a className="public-button" href="https://t.me" rel="noreferrer">
          {t('public.about.telegram')}
        </a>
      </section>

      <section className="public-grid" aria-label={t('public.about.features')}>
        <article>
          <h2>{t('public.about.financeTitle')}</h2>
          <p>{t('public.about.financeDescription')}</p>
        </article>
        <article>
          <h2>{t('public.about.planningTitle')}</h2>
          <p>{t('public.about.planningDescription')}</p>
        </article>
        <article>
          <h2>{t('public.about.googleTitle')}</h2>
          <p>{t('public.about.googleDescription')}</p>
        </article>
      </section>

      <footer className="public-footer">
        <span>{t('public.about.copyright', { year: new Date().getFullYear() })}</span>
        <span>{t('public.about.support', { email })}</span>
        <Link href={APP_ROUTES.privacy}>{t('public.about.privacyPolicy')}</Link>
        <Link href={APP_ROUTES.terms}>{t('public.about.termsOfService')}</Link>
      </footer>
    </main>
  );
}
