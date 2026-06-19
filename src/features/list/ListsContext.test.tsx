import { describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@/hooks/useToast';
import { AuthProvider } from '@/features/auth/AuthContext';
import { ListProvider, useList, useLists } from './ListContext';
import { seedSession } from '@/test/fakeBackend';
import type { Product } from '@/types';

const product: Product = {
  id: 'p1',
  name: 'Banana Prata',
  category: 'Hortifrúti',
  unit: '1 kg',
  imageUrl: 'data:,',
};

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

function setup() {
  return renderHook(() => ({ list: useList(), lists: useLists() }), { wrapper: makeWrapper() });
}

describe('múltiplas listas (integrado à API)', () => {
  it('cria uma lista e a torna ativa', async () => {
    seedSession();
    const { result } = setup();

    act(() => result.current.lists.createList('Compra do mês'));
    await waitFor(() => {
      expect(result.current.lists.lists).toHaveLength(1);
      expect(result.current.lists.activeId).toBeTruthy();
    });
  });

  it('cria nova lista, torna-a ativa e isola os itens entre listas', async () => {
    seedSession();
    const { result } = setup();

    act(() => result.current.lists.createList('Lista A'));
    await waitFor(() => expect(result.current.lists.activeId).toBeTruthy());
    const firstId = result.current.lists.activeId;

    act(() => result.current.list.addItem(product));
    await waitFor(() => expect(result.current.list.items).toHaveLength(1));

    act(() => result.current.lists.createList('Churrasco'));
    await waitFor(() => expect(result.current.lists.activeId).not.toBe(firstId));
    expect(result.current.list.items).toHaveLength(0);

    act(() => result.current.lists.selectList(firstId));
    await waitFor(() => expect(result.current.list.items).toHaveLength(1));
  });

  it('exclui uma lista mantendo as demais', async () => {
    seedSession();
    const { result } = setup();

    act(() => result.current.lists.createList('Lista A'));
    await waitFor(() => expect(result.current.lists.lists).toHaveLength(1));
    const firstId = result.current.lists.activeId;

    act(() => result.current.lists.createList('Lista B'));
    await waitFor(() => expect(result.current.lists.lists).toHaveLength(2));

    act(() => result.current.lists.deleteList(firstId));
    await waitFor(() => expect(result.current.lists.lists).toHaveLength(1));
    expect(result.current.lists.lists.some((l) => l.id === firstId)).toBe(false);
  });
});
