/**
 * Builder do comparativo de preços da lista.
 *
 * A partir dos itens da lista + matriz de preços (API) + preços manuais, monta
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
  // `complete` indica cobertura total (preço para todos os itens da lista).
  const totals = markets.map((m) => {
    let total = 0;
    let covered = 0;
    for (const item of items) {
      const value = customPrices[item.product.id]?.[m.id] ?? matrix[item.product.id]?.[m.id] ?? null;
      if (value != null) {
        total += value * item.quantity;
        covered += 1;
      }
    }
    return { marketId: m.id, total, complete: items.length > 0 && covered === items.length };
  });

  // Só mercados com cobertura completa disputam mais barato/mais caro e economia.
  const eligible = totals.filter((t) => t.complete);
  const cheapest = eligible.reduce<typeof eligible[number] | null>(
    (min, t) => (min === null || t.total < min.total ? t : min),
    null,
  );
  const mostExpensive = eligible.reduce<typeof eligible[number] | null>(
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
