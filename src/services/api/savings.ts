/**
 * Service de economias recentes — implementação REAL (back-end FastAPI).
 * Baseado nos snapshots de comparação do usuário (`GET /savings/recent`).
 */
import type { SavingsSummary } from '@/types';
import { apiGet } from '../http';

export async function getRecentSavings(): Promise<SavingsSummary[]> {
  return apiGet<SavingsSummary[]>('/savings/recent');
}
