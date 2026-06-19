/**
 * useCatalog — catálogo exibido nas telas (produtos vindos da API via React Query).
 *
 * Produtos cadastrados manualmente são persistidos no back-end (ver
 * CatalogContext) e já voltam em `GET /products`, então não há mais mesclagem
 * com um catálogo local.
 */
import { useQuery } from '@tanstack/react-query';
import { getProducts } from '@/services';

export function useCatalog() {
  const query = useQuery({ queryKey: ['products'], queryFn: () => getProducts() });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
