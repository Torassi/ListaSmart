import { describe, expect, it } from 'vitest';
import { getAnalytics } from './analytics';

describe('getAnalytics (mock)', () => {
  it('retorna métricas e coleções esperadas', async () => {
    const data = await getAnalytics();

    expect(data.cheapestMarketByList).toBeTruthy();
    expect(data.manualPricesCount).toBeGreaterThan(0);
    expect(data.mostSearchedProducts.length).toBeGreaterThan(0);
    expect(data.categoryShares.length).toBeGreaterThan(0);
    expect(data.marketCompetitiveness.length).toBe(4);
  });

  it('ordena oportunidades pela maior diferença de preço', async () => {
    const { opportunities } = await getAnalytics();
    expect(opportunities.length).toBeGreaterThan(0);
    for (let i = 1; i < opportunities.length; i++) {
      expect(opportunities[i - 1].diff).toBeGreaterThanOrEqual(opportunities[i].diff);
    }
  });
});
