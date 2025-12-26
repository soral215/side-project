'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { ToastProvider } from '../src/contexts/ToastContext';
import { FeatureFlagProvider } from '../src/contexts/FeatureFlagContext';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1분
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <FeatureFlagProvider>
        <ToastProvider>{children}</ToastProvider>
      </FeatureFlagProvider>
    </QueryClientProvider>
  );
}


