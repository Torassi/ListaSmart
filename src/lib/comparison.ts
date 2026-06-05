/**
 * Builder do comparativo de preços da lista.
 *
 * A partir dos itens da lista + matriz de preços (mock) + preços manuais, monta
 * as linhas (preço por mercado, com menor/maior destacados), os totais por
 * mercado (preço × quantidade) e identifica o mercado mais barato/mais caro e a
 * economia da melhor opção frente à pior.
 */
import type { ListItem, ListComparison, Market } from '@/types';
import type { PriceMatrix } from '@/services';
import { resolveRowPrices } from './pricing';

export function buildComparison(
  items: ListItem[],
  markets: Market[],
  matrix: PriceMatrix,
  customPrices: Record<string, Record<string, number>>,
): ListComparison {
  const rows = items.map((item) => {
    const cells = resolveRowPrices(item.product.id, markets, matrix, customPrices).map((c) => ({
      marketId: c.marketId,
      value: c.value,
      isCheapest: c.isCheapest,
      isMostExpensive: c.isMostExpensive,
    }));
    return { product: item.product, quantity: item.quantity, cells };
  });

  // Total por mercado = soma de (valor × quantidade) dos itens com preço naquele mercado.
  const totals = markets.map((m) => {
    let total = 0;
    for (const item of items) {
      const value = customPrices[item.product.id]?.[m.id] ?? matrix[item.product.id]?.[m.id] ?? null;
      if (value != null) total += value * item.quantity;
    }
    return { marketId: m.id, total };
  });

  const withValues = totals.filter((t) => t.total > 0);
  const cheapest = withValues.reduce<typeof withValues[number] | null>(
    (min, t) => (min === null || t.total < min.total ? t : min),
    null,
  );
  const mostExpensive = withValues.reduce<typeof withValues[number] | null>(
    (max, t) => (max === null || t.total > max.total ? t : max),
    null,
  );

  return {
    markets,
    rows,
    totals,
    cheapestMarketId: cheapest?.marketId ?? '',
    mostExpensiveMarketId: mostExpensive?.marketId ?? '',
    savedAmount: cheapest && mostExpensive ? mostExpensive.total - cheapest.total : 0,
  };
}
