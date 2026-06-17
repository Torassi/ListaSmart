/**
 * Service de comparação — implementação REAL (back-end FastAPI).
 *
 * O back-end já calcula totais por mercado, mais barato/caro e economia,
 * devolvendo o contrato `ListComparison` pronto para a UI.
 */
import type { ListComparison } from '@/types';
import { apiGet } from '../http';

export async function compareList(listId: string): Promise<ListComparison> {
  return apiGet<ListComparison>(`/lists/${encodeURIComponent(listId)}/comparison`);
}
