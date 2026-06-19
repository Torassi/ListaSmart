import { describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CatalogProvider, useCatalogStore } from './CatalogContext';
import { getPriceMatrix, getProducts } from '@/services';
import { seedSession } from '@/test/fakeBackend';

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={qc}>
        <CatalogProvider>{children}</CatalogProvider>
      </QueryClientProvider>
    );
  };
}

describe('CatalogContext (integrado à API)', () => {
  it('cadastra produto no catálogo, persiste e registra o preço por mercado', async () => {
    seedSession(); // POST /products exige autenticação
    const { result } = renderHook(() => useCatalogStore(), { wrapper: makeWrapper() });

    const created = await result.current.addProduct({
      name: 'Aveia em Flocos',
      category: 'Mercearia',
      unit: '500 g',
      barcode: '7891234567890',
      marketId: 'giassi',
      price: 8.49,
    });

    expect(created.name).toBe('Aveia em Flocos');
    expect(created.barcode).toBe('7891234567890');

    // Persistido no catálogo (GET /products) com o preço inicial (GET /prices/matrix).
    const products = await getProducts({ barcode: '7891234567890' });
    expect(products).toHaveLength(1);
    expect(products[0].id).toBe(created.id);

    const matrix = await getPriceMatrix();
    expect(matrix[created.id].giassi).toBe(8.49);
  });

  it('impede código de barras duplicado', async () => {
    seedSession();
    const { result } = renderHook(() => useCatalogStore(), { wrapper: makeWrapper() });

    // 7891000000000 já pertence ao produto "p1" do fake backend.
    await expect(
      result.current.addProduct({
        name: 'Repetido',
        category: 'Mercearia',
        unit: 'unidade',
        barcode: '7891000000000',
        marketId: 'giassi',
        price: 1,
      }),
    ).rejects.toThrow();
  });
});
