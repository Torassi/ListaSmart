/**
 * Service do catálogo — produtos, categorias e mercados.
 *
 * Substituível por chamadas reais (ver `http.ts`). As assinaturas devem
 * permanecer estáveis quando o back-end for plugado.
 */
import type { Market, Product, ProductCategory } from '@/types';
import { cheapestPriceFor, markets, products } from './mockData';
import { delay } from './http';

export interface ProductWithPrice extends Product {
  /** Menor preço encontrado entre os mercados (para destaque na Home). */
  lowestPrice: number | null;
}

/** Retorna o catálogo completo de produtos com o menor preço de cada um. */
export async function getProducts(): Promise<ProductWithPrice[]> {
  const enriched = products.map((p) => ({
    ...p,
    lowestPrice: cheapestPriceFor(p.id)?.value ?? null,
  }));
  return delay(enriched);
}

/** Retorna as categorias distintas presentes no catálogo (ordenadas). */
export async function getCategories(): Promise<ProductCategory[]> {
  const set = new Set<ProductCategory>(products.map((p) => p.category));
  return delay([...set].sort((a, b) => a.localeCompare(b, 'pt-BR')));
}

/** Retorna os mercados disponíveis. */
export async function getMarkets(): Promise<Market[]> {
  return delay(markets);
}
