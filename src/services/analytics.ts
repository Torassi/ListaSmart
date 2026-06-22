/**
 * Service de analytics — INTEGRADO (back-end FastAPI).
 *
 * Delega para a API real (`services/api/analytics.ts`): indicadores agregados a
 * partir de dados reais (preços, eventos de busca e snapshots de comparação).
 */
export { getAnalytics, registerSearchEvent } from './api/analytics';
export type { SearchEventInput } from './api/analytics';
