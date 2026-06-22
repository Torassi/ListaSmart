/**
 * Service da Home — economias recentes e favoritos.
 *
 * `getRecentSavings` é INTEGRADO (`GET /savings/recent`, baseado nos snapshots
 * de comparação do usuário). `getFavorites` ainda NÃO tem backend nesta etapa e
 * retorna vazio (documentado): favoritos seguem fora do servidor por enquanto.
 */
import type { Favorites } from '@/types';

export { getRecentSavings } from './api/savings';

/** Favoritos — fora do backend nesta etapa (retorna vazio, sem dados fictícios). */
export async function getFavorites(): Promise<Favorites> {
  return { products: [], markets: [] };
}
