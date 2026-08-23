import type { Metadata } from 'next';
import '../src/styles.css';
import { AppProviders } from '@/shared/providers/app-providers';

export const metadata: Metadata = {
  title: 'Telebot Dashboard',
  description: 'Dashboard cá nhân mở từ Telegram',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" suppressHydrationWarning>
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
