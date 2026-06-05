/** Hooks de dados da tela de lista (React Query). */
import { useQuery } from '@tanstack/react-query';
import { getMarkets, getPriceMatrix } from '@/services';

export function useMarkets() {
  return useQuery({ queryKey: ['markets'], queryFn: getMarkets });
}

export function usePriceMatrix() {
  return useQuery({ queryKey: ['priceMatrix'], queryFn: getPriceMatrix });
}
