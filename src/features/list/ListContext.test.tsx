import { describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@/hooks/useToast';
import { AuthProvider } from '@/features/auth/AuthContext';
import { ListProvider, useList, useLists } from './ListContext';
import { seedSession } from '@/test/fakeBackend';
import type { Product } from '@/types';

// O fake backend (ver src/test/setup.ts) já tem o produto "p1".
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

describe('ListContext (integrado à API)', () => {
  it('adiciona item e acumula quantidade do mesmo produto', async () => {
    seedSession();
    const { result } = setup();

    act(() => result.current.lists.createList('Compra'));
    await waitFor(() => expect(result.current.lists.activeId).toBeTruthy());

    act(() => result.current.list.addItem(product));
    await waitFor(() => expect(result.current.list.items).toHaveLength(1));

    act(() => result.current.list.addItem(product, 2));
    await waitFor(() => expect(result.current.list.count).toBe(3));
  });

  it('remove o item ao definir quantidade <= 0', async () => {
    seedSession();
    const { result } = setup();

    act(() => result.current.lists.createList('Compra'));
    await waitFor(() => expect(result.current.lists.activeId).toBeTruthy());

    act(() => result.current.list.addItem(product));
    await waitFor(() => expect(result.current.list.items).toHaveLength(1));

    act(() => result.current.list.setQuantity(product.id, 0));
    await waitFor(() => expect(result.current.list.items).toHaveLength(0));
  });

  it('cadastra produto manual e o adiciona à lista (addManualItem)', async () => {
    seedSession();
    const { result } = setup();

    act(() => result.current.lists.createList('Compra'));
    await waitFor(() => expect(result.current.lists.activeId).toBeTruthy());

    act(() =>
      result.current.list.addManualItem({
        name: 'Feijão',
        category: 'Mercearia',
        quantity: 2,
        marketId: 'giassi',
        price: 9.9,
      }),
    );

    await waitFor(() => expect(result.current.list.items).toHaveLength(1));
    expect(result.current.list.items[0].product.name).toBe('Feijão');
    expect(result.current.list.items[0].quantity).toBe(2);
  });
});
