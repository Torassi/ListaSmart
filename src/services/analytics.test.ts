import { describe, expect, it } from 'vitest';
import { getAnalytics, registerSearchEvent } from './analytics';
import { seedSession } from '@/test/fakeBackend';

describe('analytics (integrado à API)', () => {
  it('retorna o contrato AnalyticsData com dados reais agregados', async () => {
    seedSession();
    // Oportunidades vêm do catálogo (p1/p2 variam entre mercados); sem buscas
    // ainda, categorias/produtos pesquisados ficam vazios.
    const data = await getAnalytics();

    expect(data.manualPricesCount).toBe(0);
    expect(data.categoryShares).toEqual([]);
    expect(data.mostSearchedProducts).toEqual([]);
    expect(data.opportunities.length).toBeGreaterThan(0);
    expect(data.cheapestMarketByList).toBe('—');
  });

  it('agrega eventos de busca no ranking', async () => {
    seedSession();
    await registerSearchEvent({ productId: 'p1' });
    await registerSearchEvent({ productId: 'p1' });
    await registerSearchEvent({ category: 'Hortifrúti' });

    const data = await getAnalytics();
    expect(data.mostSearchedProducts[0].product.id).toBe('p1');
    expect(data.mostSearchedProducts[0].searches).toBe(2);
    expect(data.categoryShares.find((c) => c.category === 'Hortifrúti')?.searches).toBe(1);
  });
});
