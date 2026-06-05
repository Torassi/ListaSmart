/**
 * Providers globais da aplicação.
 *
 * - React Query: cache de dados de servidor (hoje, dos mocks).
 * - ToastProvider: notificações.
 * - ListProvider: estado global da lista de compras.
 */
import { useState } from 'react';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@/hooks/useToast';
import { ListProvider } from '@/features/list/ListContext';
import { AuthProvider } from '@/features/auth/AuthContext';
import { PreferencesProvider } from '@/features/profile/PreferencesContext';

export function AppProviders({ children }: { children: ReactNode }) {
  // QueryClient criado uma única vez por instância da app.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PreferencesProvider>
          <ToastProvider>
            <ListProvider>{children}</ListProvider>
          </ToastProvider>
        </PreferencesProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
