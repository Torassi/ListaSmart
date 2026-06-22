import { describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@/hooks/useToast';
import { AuthProvider, useAuth } from './AuthContext';
import { ListProvider, useLists } from '@/features/list/ListContext';

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={qc}>
        <AuthProvider>
          <ToastProvider>
            <ListProvider>{children}</ListProvider>
          </ToastProvider>
        </AuthProvider>
      </QueryClientProvider>
    );
  };
}

const account = (n: string) => ({
  name: n,
  email: `${n}@x.com`,
  password: '12345678',
  confirmPassword: '12345678',
});

describe('troca de usuário (isolamento de cache)', () => {
  it('não vaza listas de uma conta para outra após logout/login', async () => {
    const { result } = renderHook(() => ({ auth: useAuth(), lists: useLists() }), {
      wrapper: makeWrapper(),
    });

    // Usuário A cria uma lista.
    await act(async () => {
      await result.current.auth.signup(account('alice'));
    });
    act(() => result.current.lists.createList('Lista da Alice'));
    await waitFor(() => expect(result.current.lists.lists).toHaveLength(1));

    // Logout limpa o cache privado.
    await act(async () => {
      await result.current.auth.logout();
    });

    // Usuário B entra e NÃO deve ver as listas de A.
    await act(async () => {
      await result.current.auth.signup(account('bob'));
    });
    await waitFor(() => expect(result.current.auth.isAuthenticated).toBe(true));
    await waitFor(() => expect(result.current.lists.lists).toHaveLength(0));
  });
});
