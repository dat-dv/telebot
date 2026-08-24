import type { Metadata, Viewport } from 'next';
import '../src/styles.css';
import { AppProviders } from '@/shared/providers/app-providers';

const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
const appUrl =
  rawAppUrl && /^https?:\/\//i.test(rawAppUrl) ? rawAppUrl : 'https://telebot.datintech.site';

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: 'Telebot — Quản lý Tài chính & Kế hoạch Cá nhân',
    template: '%s | Telebot',
  },
  description:
    'Nền tảng quản lý chi tiêu, công nợ, lịch trình và ghi chú cá nhân thông minh tích hợp Telegram Bot.',
  applicationName: 'Telebot',
  authors: [{ name: 'Telebot', url: 'https://telebot.datintech.site/about' }],
  generator: 'Next.js',
  keywords: [
    'telebot',
    'telegram bot',
    'quản lý tài chính',
    'thu chi',
    'công nợ',
    'lịch trình',
    'ghi chú cá nhân',
    'personal finance',
    'task manager',
  ],
  creator: 'Telebot',
  publisher: 'Telebot',
  category: 'productivity',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: ['/favicon.ico'],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    alternateLocale: ['en_US'],
    url: '/',
    siteName: 'Telebot',
    title: 'Telebot — Quản lý Tài chính & Kế hoạch Cá nhân',
    description:
      'Nền tảng quản lý chi tiêu, công nợ, lịch trình và ghi chú cá nhân thông minh tích hợp Telegram Bot.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Telebot — Trợ lý Cá nhân & Quản lý Tài chính Thông minh',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Telebot — Quản lý Tài chính & Kế hoạch Cá nhân',
    description:
      'Nền tảng quản lý chi tiêu, công nợ, lịch trình và ghi chú cá nhân thông minh tích hợp Telegram Bot.',
    images: ['/og-image.png'],
  },
  appleWebApp: {
    capable: true,
    title: 'Telebot',
    statusBarStyle: 'black-translucent',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0f172a' },
    { media: '(prefers-color-scheme: dark)', color: '#090d16' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi-VN" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => { try { const saved = localStorage.getItem('telebot-theme'); const theme = saved === 'light' || saved === 'dark' ? saved : matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; document.documentElement.dataset.theme = theme; } catch { } })()`,
          }}
        />
      </head>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
