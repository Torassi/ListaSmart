import { describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { ToastProvider } from '@/hooks/useToast';
import { AuthProvider } from '@/features/auth/AuthContext';
import { ListProvider, useList, useLists } from '@/features/list/ListContext';
import { queryKeys } from '@/lib/queryKeys';
import { compareList } from '@/services/api/comparison';
import { seedSession } from '@/test/fakeBackend';
import type { Product } from '@/types';

const banana: Product = {
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

function useHarness() {
  const list = useList();
  const lists = useLists();
  const comparison = useQuery({
    queryKey: queryKeys.comparison(lists.activeId),
    queryFn: () => compareList(lists.activeId),
    enabled: !!lists.activeId && list.items.length > 0,
  });
  return { list, lists, comparison };
}

function bistekTotal(data: ReturnType<typeof useHarness>['comparison']['data']) {
  return data?.totals.find((t) => t.marketId === 'bistek')?.total;
}

describe('comparação recalculada após alterações na lista', () => {
  it('atualiza os totais ao mudar a quantidade do item', async () => {
    seedSession();
    const { result } = renderHook(useHarness, { wrapper: makeWrapper() });

    await act(async () => {
      await result.current.lists.createList('Comparar');
    });
    await waitFor(() => expect(result.current.lists.lists).toHaveLength(1));

    act(() => result.current.list.addItem(banana)); // bistek: 5.00 (qtd 1)
    await waitFor(() => expect(bistekTotal(result.current.comparison.data)).toBe(5));

    act(() => result.current.list.setQuantity('p1', 3)); // bistek: 15.00 (qtd 3)
    await waitFor(() => expect(bistekTotal(result.current.comparison.data)).toBe(15));
  });
});
