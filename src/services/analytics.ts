/**
 * Service de analytics — sem dados mockados.
 *
 * Esta tela ainda não tem endpoint no back-end. Em vez de métricas fictícias,
 * retorna um conjunto vazio (a UI exibe "sem dados"). Quando houver API, basta
 * trocar o corpo de `getAnalytics` por uma chamada real (ver `http.ts`).
 */
import type { AnalyticsData } from '@/types';

const EMPTY_ANALYTICS: AnalyticsData = {
  cheapestMarketByList: '—',
  avgSavingsPerUser: 0,
  manualPricesCount: 0,
  mostSearchedProducts: [],
  categoryShares: [],
  marketCompetitiveness: [],
  opportunities: [],
};

export async function getAnalytics(): Promise<AnalyticsData> {
  return EMPTY_ANALYTICS;
}
