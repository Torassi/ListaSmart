import { describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { ListProvider, useList } from './ListContext';
import type { Product } from '@/types';

const product: Product = {
  id: 'p1',
  name: 'Arroz',
  category: 'Mercearia',
  unit: '5 kg',
  imageUrl: 'data:image/svg+xml;utf8,<svg/>',
};

function wrapper({ children }: { children: ReactNode }) {
  return <ListProvider>{children}</ListProvider>;
}

describe('ListContext', () => {
  it('adiciona item e acumula quantidade do mesmo produto', () => {
    const { result } = renderHook(() => useList(), { wrapper });

    act(() => result.current.addItem(product));
    act(() => result.current.addItem(product, 2));

    expect(result.current.items).toHaveLength(1);
    expect(result.current.count).toBe(3);
  });

  it('remove o item ao definir quantidade <= 0', () => {
    const { result } = renderHook(() => useList(), { wrapper });

    act(() => result.current.addItem(product));
    act(() => result.current.setQuantity(product.id, 0));

    expect(result.current.items).toHaveLength(0);
    expect(result.current.count).toBe(0);
  });

  it('registra preço manual ao adicionar item via addManualItem', () => {
    const { result } = renderHook(() => useList(), { wrapper });

    act(() =>
      result.current.addManualItem({
        name: 'Feijão',
        category: 'Mercearia',
        quantity: 2,
        marketId: 'giassi',
        price: 9.9,
      }),
    );

    expect(result.current.items).toHaveLength(1);
    const id = result.current.items[0].product.id;
    expect(result.current.customPrices[id].giassi).toBe(9.9);
  });
});
