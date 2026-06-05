/**
 * Service da lista — matriz de preços por produto/mercado.
 * Substituível por chamadas reais (ver `http.ts`).
 */
import { prices } from './mockData';
import { delay } from './http';

/** productId -> (marketId -> valor). Construída a partir dos preços mockados. */
export type PriceMatrix = Record<string, Record<string, number>>;

export async function getPriceMatrix(): Promise<PriceMatrix> {
  const matrix: PriceMatrix = {};
  for (const p of prices) {
    (matrix[p.productId] ??= {})[p.marketId] = p.value;
  }
  return delay(matrix);
}
