/**
 * Service do catálogo — implementação REAL (back-end FastAPI), em uso pelo app
 * (consumido via `@/services/catalog`, que delega para cá).
 */
import type { Market, Product, ProductCategory } from '@/types';
import type { ProductWithPrice } from '../catalog';
import { apiGet, apiPost } from '../http';

export type { ProductWithPrice } from '../catalog';

export interface ProductFilters {
  q?: string;
  category?: ProductCategory;
  barcode?: string;
}

/** Cadastro manual de produto + preço inicial (espelha CreateProductInput do back). */
export interface CreateProductInput {
  name: string;
  category: ProductCategory;
  unit: string;
  marketId: string;
  price: number;
  barcode?: string;
  imageUrl?: string;
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

/** Cadastra um produto no catálogo e seu preço inicial; exige autenticação. */
export async function createProduct(input: CreateProductInput): Promise<ProductWithPrice> {
  return apiPost<ProductWithPrice>('/products', input);
}
