/**
 * Dados mockados — usados apenas pelas partes ainda NÃO integradas à API.
 *
 * Catálogo, listas e preços vêm do back-end; o que ainda lê daqui é: analytics
 * (`analytics.ts`), economia recente e favoritos (`home.ts`) e a lista de
 * colaboradores exibida na tela de lista. Os tipos seguem `@/types`.
 */
import type {
  Favorites,
  Market,
  Price,
  Product,
  SavingsSummary,
  User,
} from '@/types';
import { productPlaceholder } from '@/lib/placeholder';

/* Mercados de exemplo da região (SC). brandColor é só um realce visual. */
export const markets: Market[] = [
  { id: 'giassi', name: 'Giassi', brandColor: '#E11D48' },
  { id: 'angeloni', name: 'Angeloni', brandColor: '#2563EB' },
  { id: 'bistek', name: 'Bistek', brandColor: '#F59E0B' },
  { id: 'comper', name: 'Comper', brandColor: '#16A34A' },
];

export const currentUser: User = {
  id: 'u1',
  name: 'Leonardo',
  email: 'leonardo@exemplo.com',
};

export const collaborators: User[] = [
  currentUser,
  { id: 'u2', name: 'Marina Souza', email: 'marina@exemplo.com' },
  { id: 'u3', name: 'Caio Ferreira', email: 'caio@exemplo.com' },
];

/* Catálogo. Imagens são placeholders locais por categoria (trocar por fotos reais). */
const catalogSeed: Product[] = [
  { id: 'p1', name: 'Banana Prata', category: 'Hortifrúti', unit: '1 kg', imageUrl: productPlaceholder('🍌') },
  { id: 'p2', name: 'Tomate Italiano', category: 'Hortifrúti', unit: '1 kg', imageUrl: productPlaceholder('🍅') },
  { id: 'p3', name: 'Alface Crespa', category: 'Hortifrúti', unit: 'unidade', imageUrl: productPlaceholder('🥬') },
  { id: 'p4', name: 'Picanha Bovina', category: 'Açougue', unit: '1 kg', imageUrl: productPlaceholder('🥩', '#FDECEC') },
  { id: 'p5', name: 'Peito de Frango', category: 'Açougue', unit: '1 kg', imageUrl: productPlaceholder('🍗', '#FDECEC') },
  { id: 'p6', name: 'Pão Francês', category: 'Padaria', unit: '1 kg', imageUrl: productPlaceholder('🥖', '#FEF3E2') },
  { id: 'p7', name: 'Leite Integral', category: 'Laticínios', unit: '1 L', brand: 'Tirol', imageUrl: productPlaceholder('🥛', '#EAF1FF') },
  { id: 'p8', name: 'Queijo Mussarela', category: 'Laticínios', unit: '500 g', imageUrl: productPlaceholder('🧀', '#EAF1FF') },
  { id: 'p9', name: 'Ovos Brancos', category: 'Mercearia', unit: 'dúzia', imageUrl: productPlaceholder('🥚', '#FEF3E2') },
  { id: 'p10', name: 'Arroz Branco', category: 'Mercearia', unit: '5 kg', brand: 'Tio João', imageUrl: productPlaceholder('🍚', '#FEF3E2') },
  { id: 'p11', name: 'Feijão Preto', category: 'Mercearia', unit: '1 kg', imageUrl: productPlaceholder('🫘', '#FEF3E2') },
  { id: 'p12', name: 'Café Torrado', category: 'Mercearia', unit: '500 g', brand: 'Melitta', imageUrl: productPlaceholder('☕', '#FEF3E2') },
  { id: 'p13', name: 'Macarrão Espaguete', category: 'Mercearia', unit: '500 g', imageUrl: productPlaceholder('🍝', '#FEF3E2') },
  { id: 'p14', name: 'Refrigerante Cola', category: 'Bebidas', unit: '2 L', imageUrl: productPlaceholder('🥤', '#EAF1FF') },
  { id: 'p15', name: 'Suco de Laranja', category: 'Bebidas', unit: '1 L', imageUrl: productPlaceholder('🧃', '#EAF1FF') },
  { id: 'p16', name: 'Detergente Neutro', category: 'Limpeza', unit: '500 ml', imageUrl: productPlaceholder('🧴', '#EAF1FF') },
  { id: 'p17', name: 'Sabão em Pó', category: 'Limpeza', unit: '1 kg', imageUrl: productPlaceholder('🧼', '#EAF1FF') },
  { id: 'p18', name: 'Papel Higiênico', category: 'Higiene', unit: '12 rolos', imageUrl: productPlaceholder('🧻', '#F4F7FB') },
  { id: 'p19', name: 'Creme Dental', category: 'Higiene', unit: '90 g', imageUrl: productPlaceholder('🪥', '#F4F7FB') },
  { id: 'p20', name: 'Pizza Congelada', category: 'Congelados', unit: '460 g', imageUrl: productPlaceholder('🍕', '#FDECEC') },
];

/* Catálogo final com código de barras (EAN-13 fictício, determinístico) por produto. */
export const products: Product[] = catalogSeed.map((p, i) => ({
  ...p,
  barcode: `789${String(1_000_000_000 + i).padStart(10, '0')}`,
}));

/*
 * Matriz de preços: para cada produto, um preço por mercado.
 * Pequena variação por mercado para alimentar o comparador/analytics.
 */
const basePrices: Record<string, number> = {
  p1: 5.49, p2: 8.9, p3: 3.49, p4: 64.9, p5: 18.9,
  p6: 14.9, p7: 5.29, p8: 27.9, p9: 12.5, p10: 27.9,
  p11: 8.49, p12: 15.9, p13: 4.29, p14: 8.99, p15: 7.49,
  p16: 2.99, p17: 12.9, p18: 23.9, p19: 4.49, p20: 19.9,
};

// Fatores por mercado para gerar diferenças realistas e determinísticas.
const marketFactor: Record<string, number> = {
  giassi: 1.0,
  angeloni: 1.06,
  bistek: 0.94,
  comper: 0.99,
};

export const prices: Price[] = products.flatMap((product) =>
  markets.map((market) => {
    const base = basePrices[product.id] ?? 9.9;
    const value = Math.round(base * (marketFactor[market.id] ?? 1) * 100) / 100;
    return {
      productId: product.id,
      marketId: market.id,
      value,
      updatedAt: '2026-06-01T10:00:00.000Z',
      source: 'crowd' as const,
    };
  }),
);

/** Menor preço de um produto entre todos os mercados (útil para destaque na Home). */
export function cheapestPriceFor(productId: string): { value: number; marketId: string } | null {
  const candidates = prices.filter((p) => p.productId === productId);
  if (candidates.length === 0) return null;
  return candidates.reduce((min, p) => (p.value < min.value ? p : min));
}

export const savings: SavingsSummary[] = [
  { id: 's1', listName: 'Compra do mês', cheapestMarket: 'Bistek', total: 432.18, savedAmount: 58.4, date: '2026-05-28T00:00:00.000Z' },
  { id: 's2', listName: 'Churrasco fim de semana', cheapestMarket: 'Comper', total: 189.9, savedAmount: 22.75, date: '2026-05-21T00:00:00.000Z' },
  { id: 's3', listName: 'Limpeza & higiene', cheapestMarket: 'Bistek', total: 96.4, savedAmount: 13.1, date: '2026-05-14T00:00:00.000Z' },
];

export const favorites: Favorites = {
  products: [products[3], products[6], products[11], products[9]],
  markets: [markets[2], markets[1]],
};
