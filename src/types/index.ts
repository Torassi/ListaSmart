/**
 * Tipagens compartilhadas — rascunho do futuro contrato de dados da API.
 *
 * Estes tipos descrevem o formato que o back-end deverá retornar. Hoje são
 * consumidos pela camada `services/` (mockada). Quando a API real existir,
 * basta trocar a implementação dos services mantendo estes contratos.
 */

export type Id = string;

export type ProductCategory =
  | 'Hortifrúti'
  | 'Açougue'
  | 'Padaria'
  | 'Laticínios'
  | 'Mercearia'
  | 'Bebidas'
  | 'Limpeza'
  | 'Higiene'
  | 'Congelados';

export interface Product {
  id: Id;
  name: string;
  category: ProductCategory;
  /** URL da imagem do produto (validar/sanitizar antes de renderizar). */
  imageUrl: string;
  /** Unidade de venda exibida (ex.: "1 kg", "500 g", "unidade"). */
  unit: string;
  brand?: string;
  /** Código de barras (EAN) — usado na busca. */
  barcode?: string;
}

export interface Market {
  id: Id;
  name: string; // Giassi, Angeloni, Bistek, Comper, ...
  /** Cor de marca para realces sutis na UI (token visual, não preço). */
  brandColor?: string;
  logoUrl?: string;
}

export type PriceSource = 'manual' | 'crowd';

export interface Price {
  productId: Id;
  marketId: Id;
  /** Valor em reais (number; formatação fica na camada de UI). */
  value: number;
  updatedAt: string; // ISO 8601
  source: PriceSource;
}

export interface User {
  id: Id;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface ListItem {
  product: Product;
  quantity: number;
}

export interface ShoppingList {
  id: Id;
  name: string;
  items: ListItem[];
  collaborators: User[];
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

/** Resumo de economia recente exibido na Home. */
export interface SavingsSummary {
  id: Id;
  listName: string;
  cheapestMarket: string;
  total: number;
  savedAmount: number; // economia vs. o mercado mais caro
  date: string; // ISO 8601
}

/** Favoritos do usuário (produtos e supermercados). */
export interface Favorites {
  products: Product[];
  markets: Market[];
}

/* ---------------------------------------------------------------------------
 * Comparador de preços
 * ------------------------------------------------------------------------- */

export interface ComparisonCell {
  marketId: Id;
  value: number | null; // null = mercado não tem preço para o item
  isCheapest: boolean;
  isMostExpensive: boolean;
}

export interface ComparisonRow {
  product: Product;
  quantity: number;
  cells: ComparisonCell[];
}

export interface MarketTotal {
  marketId: Id;
  total: number;
}

export interface ListComparison {
  markets: Market[];
  rows: ComparisonRow[];
  totals: MarketTotal[];
  cheapestMarketId: Id;
  mostExpensiveMarketId: Id;
  /** Economia da melhor opção frente à mais cara. */
  savedAmount: number;
}

/* ---------------------------------------------------------------------------
 * Analytics / Inteligência
 * ------------------------------------------------------------------------- */

export interface RankedProduct {
  product: Product;
  searches: number;
}

export interface CategoryShare {
  category: ProductCategory;
  searches: number;
}

export interface MarketCompetitiveness {
  market: Market;
  /** Quantas vezes este mercado foi o mais barato. */
  cheapestWins: number;
}

export interface PriceOpportunity {
  product: Product;
  cheapestMarket: string;
  mostExpensiveMarket: string;
  minPrice: number;
  maxPrice: number;
  /** Diferença absoluta entre maior e menor preço. */
  diff: number;
}

export interface AnalyticsData {
  cheapestMarketByList: string;
  avgSavingsPerUser: number;
  manualPricesCount: number;
  mostSearchedProducts: RankedProduct[];
  categoryShares: CategoryShare[];
  marketCompetitiveness: MarketCompetitiveness[];
  opportunities: PriceOpportunity[];
}
