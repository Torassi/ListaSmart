/**
 * CatalogContext — cadastro manual de produtos no catálogo (INTEGRADO).
 *
 * Antes os produtos customizados viviam em localStorage. Agora são persistidos
 * no back-end (`POST /products`), que também faz a deduplicação por código de
 * barras e cria o preço inicial no mercado escolhido. Após cadastrar, a query
 * `['products']` é invalidada para o catálogo refletir o novo item.
 */
import { createContext, useCallback, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Product } from '@/types';
import type { CatalogProductInput } from '@/lib/validation';
import { createProduct } from '@/services/api/catalog';

interface CatalogContextValue {
  /** Cadastra um produto no catálogo (+ preço inicial); resolve com o produto criado. */
  addProduct: (input: CatalogProductInput, imageUrl?: string) => Promise<Product>;
}

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();

  const addProduct = useCallback(
    async (input: CatalogProductInput, imageUrl?: string): Promise<Product> => {
      const product = await createProduct({
        name: input.name,
        category: input.category,
        unit: input.unit,
        marketId: input.marketId,
        price: input.price,
        ...(input.barcode ? { barcode: input.barcode } : {}),
        ...(imageUrl ? { imageUrl } : {}),
      });
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['products'] }),
        qc.invalidateQueries({ queryKey: ['priceMatrix'] }),
      ]);
      return product;
    },
    [qc],
  );

  const value = useMemo<CatalogContextValue>(() => ({ addProduct }), [addProduct]);

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCatalogStore(): CatalogContextValue {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error('useCatalogStore deve ser usado dentro de <CatalogProvider>.');
  return ctx;
}
