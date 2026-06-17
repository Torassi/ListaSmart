/**
 * Service do catálogo — implementação REAL (back-end FastAPI).
 * Mesmas assinaturas do mock em `src/services/catalog.ts`.
 */
import type { Market, Product, ProductCategory } from '@/types';
import type { ProductWithPrice } from '../catalog';
import { apiGet } from '../http';

export type { ProductWithPrice } from '../catalog';

export interface ProductFilters {
  q?: string;
  category?: ProductCategory;
  barcode?: string;
}

export async function getProducts(filters: ProductFilters = {}): Promise<ProductWithPrice[]> {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.category) params.set('category', filters.category);
  if (filters.barcode) params.set('barcode', filters.barcode);
  const query = params.toString();
  return apiGet<ProductWithPrice[]>(`/products${query ? `?${query}` : ''}`);
}

export async function getProduct(id: string): Promise<Product> {
  return apiGet<Product>(`/products/${encodeURIComponent(id)}`);
}

export async function getCategories(): Promise<ProductCategory[]> {
  return apiGet<ProductCategory[]>('/categories');
}

export async function getMarkets(): Promise<Market[]> {
  return apiGet<Market[]>('/markets');
}
