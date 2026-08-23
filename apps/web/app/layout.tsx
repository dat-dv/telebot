import type { Metadata } from 'next';
import '../src/styles.css';
import { AppProviders } from '@/shared/providers/app-providers';

export const metadata: Metadata = {
  title: 'Telebot Dashboard',
  description: 'Dashboard cá nhân mở từ Telegram',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
