/**
 * Service de analytics — implementação REAL (back-end FastAPI).
 *
 * `getAnalytics` traz os indicadores agregados (dados reais). `registerSearchEvent`
 * registra eventos de busca (produto/categoria/termo) para o ranking. Não envia
 * informações sensíveis.
 */
import type { AnalyticsData } from '@/types';
import { apiGet, apiPost } from '../http';

export interface SearchEventInput {
  productId?: string;
  category?: string;
  query?: string;
}

export async function getAnalytics(): Promise<AnalyticsData> {
  return apiGet<AnalyticsData>('/analytics');
}

/** Registra um evento de busca. Silencia erros: telemetria não deve quebrar a UI. */
export async function registerSearchEvent(input: SearchEventInput): Promise<void> {
  await apiPost('/analytics/search-events', input);
}
