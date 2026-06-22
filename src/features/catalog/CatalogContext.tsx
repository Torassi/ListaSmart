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
import { queryKeys } from '@/lib/queryKeys';
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
      // Novo produto + preço inicial: invalida catálogo, matriz e tudo que
      // depende de preços (comparações, analytics e economia recente).
      await Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.products }),
        qc.invalidateQueries({ queryKey: queryKeys.priceMatrix }),
        qc.invalidateQueries({ queryKey: ['comparison'] }),
        qc.invalidateQueries({ queryKey: queryKeys.analytics }),
        qc.invalidateQueries({ queryKey: queryKeys.savingsRecent }),
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
