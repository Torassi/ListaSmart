/**
 * CatalogContext — produtos cadastrados manualmente no catálogo pelo usuário.
 *
 * Mantém os produtos customizados e seus preços por mercado, mesclando-os ao
 * catálogo mockado nas telas (Home, Lista, Comparador).
 *
 * Persistência: localStorage (DADOS NÃO SENSÍVEIS). No mundo real isto é
 * responsabilidade do back-end, que ainda faria deduplicação e moderação do
 * catálogo compartilhado (ver `services/http.ts`). Aqui é uma simulação local:
 * os produtos só existem neste navegador, sem serem compartilhados.
 */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Product } from '@/types';
import type { PriceMatrix } from '@/services';
import type { CatalogProductInput } from '@/lib/validation';
import { productPlaceholder } from '@/lib/placeholder';

interface CatalogContextValue {
  /** Produtos adicionados manualmente (mais recentes primeiro). */
  products: Product[];
  /** Preços dos produtos customizados: productId -> (marketId -> valor). */
  prices: PriceMatrix;
  /** Cadastra um produto no catálogo; retorna o produto criado. `imageUrl` opcional. */
  addProduct: (input: CatalogProductInput, imageUrl?: string) => Product;
}

interface StoredCatalog {
  products: Product[];
  prices: PriceMatrix;
}

const STORAGE_KEY = 'lista-smart:catalog';
const EMPTY: StoredCatalog = { products: [], prices: {} };

function load(): StoredCatalog {
  if (typeof window === 'undefined') return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<StoredCatalog>;
    return {
      products: Array.isArray(parsed.products) ? parsed.products : [],
      prices: parsed.prices && typeof parsed.prices === 'object' ? parsed.prices : {},
    };
  } catch {
    return EMPTY;
  }
}

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState<StoredCatalog>(load);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(catalog));
    } catch {
      // storage indisponível — ignora.
    }
  }, [catalog]);

  const value = useMemo<CatalogContextValue>(
    () => ({
      products: catalog.products,
      prices: catalog.prices,
      addProduct: (input, imageUrl) => {
        const id = `cat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const product: Product = {
          id,
          name: input.name,
          category: input.category,
          unit: input.unit,
          // Usa a foto enviada (data URL) ou um placeholder por padrão.
          imageUrl: imageUrl || productPlaceholder('🛒'),
          ...(input.barcode ? { barcode: input.barcode } : {}),
        };
        setCatalog((prev) => ({
          products: [product, ...prev.products],
          prices: { ...prev.prices, [id]: { [input.marketId]: input.price } },
        }));
        return product;
      },
    }),
    [catalog],
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCatalogStore(): CatalogContextValue {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error('useCatalogStore deve ser usado dentro de <CatalogProvider>.');
  return ctx;
}
