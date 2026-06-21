import { describe, expect, it } from 'vitest';
import { getAnalytics } from './analytics';

describe('getAnalytics (sem dados)', () => {
  it('retorna estado vazio enquanto não há endpoint no back-end', async () => {
    const data = await getAnalytics();

    expect(data.cheapestMarketByList).toBe('—');
    expect(data.avgSavingsPerUser).toBe(0);
    expect(data.manualPricesCount).toBe(0);
    expect(data.mostSearchedProducts).toEqual([]);
    expect(data.categoryShares).toEqual([]);
    expect(data.marketCompetitiveness).toEqual([]);
    expect(data.opportunities).toEqual([]);
  });
});
