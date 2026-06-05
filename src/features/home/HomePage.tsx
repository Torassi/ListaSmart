/**
 * HomePage — dashboard inicial com o catálogo de produtos em destaque.
 *
 * Seções: saudação + atalhos, KPIs de economia, catálogo (busca + filtro + grid),
 * e a faixa inferior com Favoritos e Economias recentes.
 */
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ListPlus, History, PiggyBank, Trophy, ShoppingBasket } from 'lucide-react';
import { Button, Card, CardBody, CardHeader, CardTitle, ErrorState, KpiCard } from '@/components';
import { formatCurrency } from '@/lib/currency';
import { useDebounce } from '@/hooks/useDebounce';
import { useAuth } from '@/features/auth/AuthContext';
import { useLists } from '@/features/list/ListContext';
import type { ProductCategory } from '@/types';
import { CatalogFilters } from './CatalogFilters';
import { ProductCard } from './ProductCard';
import { FavoritesPanel } from './FavoritesPanel';
import { SavingsCards } from './SavingsCards';
import { useCategories, useFavorites, useProducts, useRecentSavings } from './queries';

/** Normaliza texto para busca tolerante a acentos e caixa. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

export function HomePage() {
  const { user } = useAuth();
  const { createList } = useLists();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ProductCategory | 'all'>('all');
  const debouncedQuery = useDebounce(query, 200);

  const productsQuery = useProducts();
  const categoriesQuery = useCategories();
  const savingsQuery = useRecentSavings();
  const favoritesQuery = useFavorites();

  // Memoizados para manter referência estável entre renders (deps de useMemo abaixo).
  const products = useMemo(() => productsQuery.data ?? [], [productsQuery.data]);
  const savings = useMemo(() => savingsQuery.data ?? [], [savingsQuery.data]);

  // Filtragem de catálogo (memoizada) por categoria + termo de busca.
  const filtered = useMemo(() => {
    const term = normalize(debouncedQuery.trim());
    return products.filter((p) => {
      const matchesCategory = category === 'all' || p.category === category;
      const matchesTerm =
        term === '' ||
        normalize(p.name).includes(term) ||
        normalize(p.category).includes(term) ||
        (p.barcode ?? '').includes(term);
      return matchesCategory && matchesTerm;
    });
  }, [products, category, debouncedQuery]);

  // KPIs derivados das economias mockadas.
  const kpis = useMemo(() => {
    const totalSaved = savings.reduce((sum, s) => sum + s.savedAmount, 0);
    const byMarket = savings.reduce<Record<string, number>>((acc, s) => {
      acc[s.cheapestMarket] = (acc[s.cheapestMarket] ?? 0) + 1;
      return acc;
    }, {});
    const topMarket = Object.entries(byMarket).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
    return { totalSaved, topMarket, listCount: savings.length };
  }, [savings]);

  return (
    <div className="flex flex-col gap-8">
      {/* Cabeçalho + atalhos rápidos */}
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-text">
            Olá, {user?.name ?? 'visitante'} 👋
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Monte sua lista e compare preços nos mercados da região para economizar.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            leftIcon={<ListPlus className="h-4 w-4" aria-hidden="true" />}
            onClick={() => {
              createList('Nova lista');
              navigate('/lista');
            }}
          >
            Criar nova lista
          </Button>
          <Link to="/listas">
            <Button variant="secondary" leftIcon={<History className="h-4 w-4" aria-hidden="true" />}>
              Listas anteriores
            </Button>
          </Link>
        </div>
      </header>

      {/* KPIs de economia */}
      <section aria-label="Resumo de economias" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          label="Economia acumulada"
          value={formatCurrency(kpis.totalSaved)}
          icon={<PiggyBank className="h-5 w-5" aria-hidden="true" />}
          deltaLabel="↓ economizado"
          helpText="nas últimas listas"
        />
        <KpiCard
          label="Mercado campeão"
          value={kpis.topMarket}
          numeric={false}
          icon={<Trophy className="h-5 w-5" aria-hidden="true" />}
          helpText="mais barato com frequência"
        />
        <KpiCard
          label="Listas comparadas"
          value={String(kpis.listCount)}
          icon={<ShoppingBasket className="h-5 w-5" aria-hidden="true" />}
          helpText="histórico recente"
        />
      </section>

      {/* Catálogo de produtos (destaque prioritário) */}
      <section aria-label="Catálogo de produtos">
        <Card>
          <CardHeader className="flex-col items-start gap-4 sm:flex-row sm:items-center">
            <CardTitle>Catálogo de produtos</CardTitle>
          </CardHeader>
          <CardBody className="flex flex-col gap-5">
            <CatalogFilters
              query={query}
              onQueryChange={setQuery}
              categories={categoriesQuery.data ?? []}
              selected={category}
              onSelect={setCategory}
            />

            {productsQuery.isError ? (
              <ErrorState
                message="Não foi possível carregar o catálogo."
                onRetry={() => productsQuery.refetch()}
              />
            ) : productsQuery.isLoading ? (
              <CatalogSkeleton />
            ) : filtered.length === 0 ? (
              <p className="py-10 text-center text-sm text-text-subtle">
                Nenhum produto encontrado para os filtros atuais.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </section>

      {/* Faixa inferior: favoritos + economias recentes */}
      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <FavoritesPanel favorites={favoritesQuery.data} isLoading={favoritesQuery.isLoading} />
        </div>
        <div>
          <SavingsCards savings={savings} isLoading={savingsQuery.isLoading} />
        </div>
      </section>
    </div>
  );
}

/** Esqueleto de carregamento do grid de produtos. */
function CatalogSkeleton() {
  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      aria-hidden="true"
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="card-base h-72 animate-pulse bg-bg" />
      ))}
    </div>
  );
}
