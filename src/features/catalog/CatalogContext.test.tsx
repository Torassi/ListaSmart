import { describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { CatalogProvider, useCatalogStore } from './CatalogContext';

function wrapper({ children }: { children: ReactNode }) {
  return <CatalogProvider>{children}</CatalogProvider>;
}

describe('CatalogContext', () => {
  it('inicia sem produtos customizados', () => {
    const { result } = renderHook(() => useCatalogStore(), { wrapper });
    expect(result.current.products).toHaveLength(0);
  });

  it('adiciona produto ao catálogo e registra o preço por mercado', () => {
    const { result } = renderHook(() => useCatalogStore(), { wrapper });

    let createdId = '';
    act(() => {
      const product = result.current.addProduct({
        name: 'Aveia em Flocos',
        category: 'Mercearia',
        unit: '500 g',
        barcode: '7891234567890',
        marketId: 'giassi',
        price: 8.49,
      });
      createdId = product.id;
    });

    expect(result.current.products).toHaveLength(1);
    expect(result.current.products[0].name).toBe('Aveia em Flocos');
    expect(result.current.products[0].barcode).toBe('7891234567890');
    expect(result.current.prices[createdId].giassi).toBe(8.49);
  });
});
