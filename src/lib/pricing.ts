/**
 * Resolução de preços por mercado para um produto, combinando a matriz vinda da
 * API (mock) com os preços informados manualmente pelo usuário.
 * Marca o menor (verde) e o maior (vermelho) preço quando há variação.
 */
import type { Market } from '@/types';
import type { PriceMatrix } from '@/services';

export interface MarketPriceCell {
  marketId: string;
  value: number | null;
  isCheapest: boolean;
  isMostExpensive: boolean;
}

export function resolveRowPrices(
  productId: string,
  markets: Market[],
  matrix: PriceMatrix,
  customPrices: Record<string, Record<string, number>>,
): MarketPriceCell[] {
  const raw = markets.map((m) => {
    const value = customPrices[productId]?.[m.id] ?? matrix[productId]?.[m.id] ?? null;
    return { marketId: m.id, value };
  });

  const values = raw.map((c) => c.value).filter((v): v is number => v != null);
  const min = values.length ? Math.min(...values) : null;
  const max = values.length ? Math.max(...values) : null;
  const hasVariation = min != null && max != null && min < max;

  return raw.map((c) => ({
    ...c,
    isCheapest: hasVariation && c.value === min,
    isMostExpensive: hasVariation && c.value === max,
  }));
}
