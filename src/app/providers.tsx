'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LiffProvider } from '@/features/line/liff-provider';
import { I18nProvider } from '@/lib/i18n/i18n-context';
import { PwaRegister } from '@/components/shared/pwa-register';

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 2000,
            refetchOnWindowFocus: true,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <LiffProvider>
        <I18nProvider>
          <PwaRegister />
          {children}
        </I18nProvider>
      </LiffProvider>
    </QueryClientProvider>
  );
}
