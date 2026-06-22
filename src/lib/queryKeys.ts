/**
 * Chaves de cache do React Query — centralizadas para consistência.
 *
 * Dados PRIVADOS (por usuário) usam o id do usuário na chave, evitando que
 * dados de uma conta apareçam em outra após logout/login. Dados PÚBLICOS
 * (catálogo, mercados) não dependem do usuário.
 */
export const queryKeys = {
  // Públicos
  products: ['products'] as const,
  categories: ['categories'] as const,
  markets: ['markets'] as const,
  priceMatrix: ['priceMatrix'] as const,
  // Privados
  lists: (userId: string | undefined) => ['lists', userId ?? 'anon'] as const,
  comparison: (listId: string) => ['comparison', listId] as const,
  analytics: ['analytics'] as const,
  savingsRecent: ['savings', 'recent'] as const,
  favorites: ['favorites'] as const,
};

/** Prefixos de queries PRIVADAS — removidas do cache ao trocar de usuário/logout. */
export const PRIVATE_QUERY_PREFIXES: readonly (readonly unknown[])[] = [
  ['lists'],
  ['comparison'],
  ['analytics'],
  ['savings'],
  ['favorites'],
];
