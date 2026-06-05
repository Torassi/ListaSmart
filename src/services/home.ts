/**
 * Service da Home — resumos de economia e favoritos.
 * Substituível por chamadas reais (ver `http.ts`).
 */
import type { Favorites, SavingsSummary } from '@/types';
import { favorites, savings } from './mockData';
import { delay } from './http';

/** Economias recentes do usuário (cards de resumo da Home). */
export async function getRecentSavings(): Promise<SavingsSummary[]> {
  return delay(savings);
}

/** Produtos e supermercados favoritos do usuário. */
export async function getFavorites(): Promise<Favorites> {
  return delay(favorites);
}
