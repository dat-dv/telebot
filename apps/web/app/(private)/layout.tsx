import type { ReactNode } from 'react';
import { AppNavigation } from '@/shared/ui/app-navigation';

export default function PrivateLayout({ children }: { children: ReactNode }) {
  return (
    <main className="workspace app-shell">
      <AppNavigation />
      <section className="app-content">{children}</section>
    </main>
  );
}
