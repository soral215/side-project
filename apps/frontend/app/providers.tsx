'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { ToastProvider } from '../src/contexts/ToastContext';
import { FeatureFlagProvider } from '../src/contexts/FeatureFlagContext';
import { ThemeProvider } from '../src/contexts/ThemeContext';
import { FeatureFlagDevTools } from '../src/components/FeatureFlagDevTools';
import { ServerInfo } from '../src/components/ServerInfo';
import { NotificationListener } from '../src/components/NotificationListener';
import { Model3DJobListener } from '../src/components/Model3DJobListener';
import { Model3DJobStatusWidget } from '../src/components/Model3DJobStatusWidget';
import ErrorBoundary from '../src/components/ErrorBoundary';
import { AIChatbot } from '../src/components/AIChatbot';

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
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <FeatureFlagProvider>
          <ThemeProvider>
            <ToastProvider>
              {children}
              <NotificationListener />
              <Model3DJobListener />
              <Model3DJobStatusWidget />
              <AIChatbot />
              <FeatureFlagDevTools />
              <ServerInfo />
            </ToastProvider>
          </ThemeProvider>
        </FeatureFlagProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}


