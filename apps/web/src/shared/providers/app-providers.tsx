'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useEffect, useState } from 'react';
import { captureDashboardToken } from '@/modules/auth/client/auth-storage';
import { ThemeProvider } from './theme-provider';
import { LocaleProvider } from './locale-provider';
import { MoneyVisibilityProvider } from './money-visibility-provider';
import { ReactScanProvider } from './react-scan-provider';

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, gcTime: 300_000, refetchOnWindowFocus: false, retry: 1 },
        },
      }),
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    captureDashboardToken();
    setReady(true);
  }, []);

  if (!ready) return null;
  return (
    <ReactScanProvider>
      <QueryClientProvider client={queryClient}>
        <LocaleProvider>
          <MoneyVisibilityProvider>
            <ThemeProvider>{children}</ThemeProvider>
          </MoneyVisibilityProvider>
        </LocaleProvider>
      </QueryClientProvider>
    </ReactScanProvider>
  );
}
