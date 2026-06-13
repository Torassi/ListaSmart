/**
 * useCatalog — catálogo exibido nas telas: mescla o catálogo mockado (via React
 * Query) com os produtos adicionados manualmente (CatalogContext).
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getProducts } from '@/services';
import type { ProductWithPrice } from '@/services';
import { useCatalogStore } from './CatalogContext';

function lowestOf(prices: Record<string, number> | undefined): number | null {
  if (!prices) return null;
  const values = Object.values(prices);
  return values.length ? Math.min(...values) : null;
}

export function useCatalog() {
  const query = useQuery({ queryKey: ['products'], queryFn: getProducts });
  const { products: customProducts, prices: customPrices } = useCatalogStore();

  const data = useMemo<ProductWithPrice[]>(() => {
    const base = query.data ?? [];
    // Customizados primeiro, para o usuário ver imediatamente o que cadastrou.
    const custom: ProductWithPrice[] = customProducts.map((p) => ({
      ...p,
      lowestPrice: lowestOf(customPrices[p.id]),
    }));
    return [...custom, ...base];
  }, [query.data, customProducts, customPrices]);

  return {
    data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
