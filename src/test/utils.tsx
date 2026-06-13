/* eslint-disable react-refresh/only-export-components -- arquivo só de testes, fora do fast-refresh */
/**
 * Utilitário de teste — renderiza componentes dentro dos providers necessários
 * (React Query, Toast, Lista). Reexporta a API do Testing Library.
 */
import type { ReactElement, ReactNode } from 'react';
import { render } from '@testing-library/react';
import type { RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@/hooks/useToast';
import { ListProvider } from '@/features/list/ListContext';
import { AuthProvider } from '@/features/auth/AuthContext';
import { PreferencesProvider } from '@/features/profile/PreferencesContext';
import { CatalogProvider } from '@/features/catalog/CatalogContext';

function AllProviders({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PreferencesProvider>
          <CatalogProvider>
            <ToastProvider>
              <ListProvider>{children}</ListProvider>
            </ToastProvider>
          </CatalogProvider>
        </PreferencesProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: AllProviders, ...options });
}

export * from '@testing-library/react';
