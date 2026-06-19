/**
 * Hooks de dados da Home via React Query.
 *
 * Produtos e categorias vêm da API (`getProducts`/`getCategories`); economia
 * recente e favoritos ainda são mocks (`getRecentSavings`/`getFavorites`).
 */
import { useQuery } from '@tanstack/react-query';
import { getCategories, getFavorites, getProducts, getRecentSavings } from '@/services';

export function useProducts() {
  return useQuery({ queryKey: ['products'], queryFn: () => getProducts() });
}

export function useCategories() {
  return useQuery({ queryKey: ['categories'], queryFn: getCategories });
}

export function useRecentSavings() {
  return useQuery({ queryKey: ['savings', 'recent'], queryFn: getRecentSavings });
}

export function useFavorites() {
  return useQuery({ queryKey: ['favorites'], queryFn: getFavorites });
}
