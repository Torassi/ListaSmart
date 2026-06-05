/**
 * Service de analytics — MOCK (substituível pela API real, ver `http.ts`).
 *
 * Combina dados derivados do catálogo/preços (categorias e oportunidades, que
 * são calculados de verdade) com métricas curadas (rankings e competitividade),
 * já que com o mock atual alguns cálculos seriam degenerados.
 */
import type { AnalyticsData, PriceOpportunity, RankedProduct } from '@/types';
import { markets, prices, products } from './mockData';
import { delay } from './http';

const marketName = (id: string) => markets.find((m) => m.id === id)?.name ?? id;

/** Oportunidades: maior diferença de preço entre mercados, por produto. */
function computeOpportunities(): PriceOpportunity[] {
  return products
    .map((product) => {
      const values = prices
        .filter((p) => p.productId === product.id)
        .map((p) => ({ marketId: p.marketId, value: p.value }));
      if (values.length === 0) return null;

      const min = values.reduce((a, b) => (b.value < a.value ? b : a));
      const max = values.reduce((a, b) => (b.value > a.value ? b : a));
      return {
        product,
        cheapestMarket: marketName(min.marketId),
        mostExpensiveMarket: marketName(max.marketId),
        minPrice: min.value,
        maxPrice: max.value,
        diff: Math.round((max.value - min.value) * 100) / 100,
      } satisfies PriceOpportunity;
    })
    .filter((o): o is PriceOpportunity => o !== null)
    .sort((a, b) => b.diff - a.diff)
    .slice(0, 6);
}

/** Categorias mais pesquisadas: derivado da quantidade de produtos por categoria. */
function computeCategoryShares() {
  const counts = new Map<string, number>();
  for (const p of products) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
  return [...counts.entries()]
    .map(([category, n]) => ({ category: category as RankedProduct['product']['category'], searches: n * 37 }))
    .sort((a, b) => b.searches - a.searches);
}

/** Produtos mais pesquisados (curado, com contagem decrescente). */
function mostSearched(): RankedProduct[] {
  const ids = ['p4', 'p7', 'p10', 'p12', 'p1', 'p18', 'p8', 'p14'];
  const base = 980;
  return ids
    .map((id, i) => {
      const product = products.find((p) => p.id === id);
      return product ? { product, searches: base - i * 110 } : null;
    })
    .filter((r): r is RankedProduct => r !== null);
}

export async function getAnalytics(): Promise<AnalyticsData> {
  const data: AnalyticsData = {
    cheapestMarketByList: 'Bistek',
    avgSavingsPerUser: 47.9,
    manualPricesCount: 1284,
    mostSearchedProducts: mostSearched(),
    categoryShares: computeCategoryShares(),
    marketCompetitiveness: [
      { market: markets[2], cheapestWins: 142 }, // Bistek
      { market: markets[3], cheapestWins: 98 }, // Comper
      { market: markets[0], cheapestWins: 71 }, // Giassi
      { market: markets[1], cheapestWins: 44 }, // Angeloni
    ],
    opportunities: computeOpportunities(),
  };
  return delay(data, 400);
}
