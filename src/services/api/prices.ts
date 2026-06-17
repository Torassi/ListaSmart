/**
 * Service de preços — implementação REAL (back-end FastAPI).
 * Mantém o tipo `PriceMatrix` do mock em `src/services/list.ts`.
 */
import type { Price } from '@/types';
import type { PriceMatrix } from '../list';
import { apiGet, apiPost } from '../http';

export type { PriceMatrix } from '../list';

export async function getPriceMatrix(): Promise<PriceMatrix> {
  return apiGet<PriceMatrix>('/prices/matrix');
}

export interface RegisterPriceInput {
  productId: string;
  marketId: string;
  value: number;
}

/** Registra (ou atualiza) o preço manual de um produto em um mercado. */
export async function registerPrice(input: RegisterPriceInput): Promise<Price> {
  return apiPost<Price>('/prices', input);
}
