import { describe, expect, it } from 'vitest';
import { renderWithProviders, screen } from '@/test/utils';
import { seedSession } from '@/test/fakeBackend';
import { registerSearchEvent } from '@/services';
import { AnalyticsPage } from './AnalyticsPage';

describe('AnalyticsPage — dashboard com dados reais', () => {
  it('recebe e renderiza indicadores agregados da API', async () => {
    seedSession();
    // Gera dados reais: uma busca por produto alimenta o ranking.
    await registerSearchEvent({ productId: 'p1' });

    renderWithProviders(<AnalyticsPage />);

    // Oportunidades e ranking exibem produtos reais do catálogo (ex.: Banana Prata).
    const banana = await screen.findAllByText(/Banana Prata/i);
    expect(banana.length).toBeGreaterThan(0);
    // KPI de preços manuais renderiza um número (0 no estado inicial).
    expect(screen.getByText('Preços cadastrados (manuais)')).toBeInTheDocument();
  });
});
