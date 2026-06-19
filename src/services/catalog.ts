/**
 * Service do catálogo — produtos, categorias e mercados.
 *
 * INTEGRADO: delega para a API real (`services/api/catalog.ts`). O tipo
 * `ProductWithPrice` continua declarado aqui para manter o contrato estável
 * para os consumidores (`@/services`).
 */
import type { Product } from '@/types';

export interface ProductWithPrice extends Product {
  /** Menor preço encontrado entre os mercados (para destaque na Home). */
  lowestPrice: number | null;
}

export {
  getProducts,
  getProduct,
  getCategories,
  getMarkets,
  createProduct,
} from './api/catalog';
export type { ProductFilters, CreateProductInput } from './api/catalog';
