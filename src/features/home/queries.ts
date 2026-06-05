/**
 * Hooks de dados da Home via React Query.
 * Consomem a camada `services/` (mock hoje). As query keys já ficam organizadas
 * para quando a API real entrar.
 */
import { useQuery } from '@tanstack/react-query';
import { getCategories, getFavorites, getProducts, getRecentSavings } from '@/services';

export function useProducts() {
  return useQuery({ queryKey: ['products'], queryFn: getProducts });
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
