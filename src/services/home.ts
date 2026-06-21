/**
 * Service da Home — resumos de economia e favoritos.
 *
 * Estas seções ainda não têm endpoint no back-end. Em vez de dados fictícios,
 * retornam estado vazio (a UI exibe "sem dados ainda"). Quando houver API,
 * basta trocar o corpo destas funções por chamadas reais (ver `http.ts`).
 */
import type { Favorites, SavingsSummary } from '@/types';

/** Economias recentes do usuário (cards de resumo da Home). */
export async function getRecentSavings(): Promise<SavingsSummary[]> {
  return [];
}

/** Produtos e supermercados favoritos do usuário. */
export async function getFavorites(): Promise<Favorites> {
  return { products: [], markets: [] };
}
