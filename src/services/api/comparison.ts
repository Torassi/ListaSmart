/**
 * Service de comparação — implementação REAL (back-end FastAPI).
 *
 * O back-end já calcula totais por mercado, mais barato/caro e economia,
 * devolvendo o contrato `ListComparison` pronto para a UI.
 */
import type { ComparisonSnapshot, ListComparison } from '@/types';
import { apiGet, apiPost } from '../http';

export async function compareList(listId: string): Promise<ListComparison> {
  return apiGet<ListComparison>(`/lists/${encodeURIComponent(listId)}/comparison`);
}

/**
 * Registra um snapshot da comparação atual (histórico/economia). Exige cobertura
 * completa no back-end; ação explícita disparada pelo usuário.
 */
export async function createComparisonSnapshot(listId: string): Promise<ComparisonSnapshot> {
  return apiPost<ComparisonSnapshot>(
    `/lists/${encodeURIComponent(listId)}/comparison-snapshots`,
  );
}
