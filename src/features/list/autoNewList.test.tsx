/**
 * Auto-início de nova lista: ao adicionar um produto (catálogo) com a lista ativa
 * já FINALIZADA, o contexto inicia automaticamente uma nova lista — sem o usuário
 * precisar criá-la manualmente.
 */
import { describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider, QueryClient, useQueryClient } from '@tanstack/react-query';
import { ToastProvider } from '@/hooks/useToast';
import { AuthProvider } from '@/features/auth/AuthContext';
import { ListProvider, useList, useLists } from '@/features/list/ListContext';
import { createComparisonSnapshot } from '@/services/api/comparison';
import { seedSession } from '@/test/fakeBackend';
import type { Product } from '@/types';

const p1: Product = { id: 'p1', name: 'Banana Prata', category: 'Hortifrúti', unit: '1 kg', imageUrl: 'data:,' };
const p2: Product = { id: 'p2', name: 'Leite Integral', category: 'Laticínios', unit: '1 L', imageUrl: 'data:,' };

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

function useHarness() {
  return { list: useList(), lists: useLists(), qc: useQueryClient() };
}

describe('adicionar produto com lista finalizada', () => {
  it('inicia uma nova lista automaticamente em vez de falhar', async () => {
    seedSession();
    const { result } = renderHook(useHarness, { wrapper: makeWrapper() });

    // Monta e finaliza a primeira lista.
    await act(async () => {
      await result.current.lists.createList('Compra');
    });
    await waitFor(() => expect(result.current.lists.activeId).toBeTruthy());
    act(() => result.current.list.addItem(p1));
    act(() => result.current.list.addItem(p2));
    await waitFor(() => expect(result.current.list.items).toHaveLength(2));

    const finalizedId = result.current.lists.activeId;
    await act(async () => {
      await createComparisonSnapshot(finalizedId);
      await result.current.qc.invalidateQueries({ queryKey: ['lists'] });
    });
    await waitFor(() => expect(result.current.lists.activeFinalized).toBe(true));

    // Adicionar pelo catálogo com a lista finalizada → nova lista automática.
    act(() => result.current.list.addItem(p1));
    await waitFor(() => {
      expect(result.current.lists.activeId).not.toBe(finalizedId);
      expect(result.current.lists.activeFinalized).toBe(false);
    });

    // A nova lista (ativa) contém o produto e a finalizada foi preservada.
    expect(result.current.list.items.map((i) => i.product.id)).toContain('p1');
    expect(result.current.lists.lists).toHaveLength(2);
    expect(result.current.lists.lists.some((l) => l.id === finalizedId && l.finalized)).toBe(true);
  });
});
