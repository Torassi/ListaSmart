/**
 * AnalyticsPage — dashboard de inteligência de preços.
 * KPIs no topo + gráficos (rosca/barras) + tabelas (ranking e oportunidades).
 */
import { useQuery } from '@tanstack/react-query';
import { BadgeDollarSign, PiggyBank, Store } from 'lucide-react';
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  ErrorState,
  KpiCard,
  Table,
} from '@/components';
import type { Column } from '@/components';
import { formatCurrency } from '@/lib/currency';
import { getAnalytics } from '@/services';
import type { PriceOpportunity, RankedProduct } from '@/types';
import { CategoryDonut } from './CategoryDonut';
import { MarketBarChart } from './MarketBarChart';

const rankingColumns: Column<RankedProduct>[] = [
  {
    key: 'rank',
    header: '#',
    cell: (_row, i) => <span className="font-bold text-text-subtle">{i + 1}</span>,
    className: 'w-10',
  },
  { key: 'name', header: 'Produto', cell: (row) => row.product.name },
  {
    key: 'searches',
    header: 'Buscas',
    align: 'right',
    cell: (row) => <span className="money font-semibold">{row.searches.toLocaleString('pt-BR')}</span>,
  },
];

const opportunityColumns: Column<PriceOpportunity>[] = [
  { key: 'name', header: 'Produto', cell: (row) => row.product.name },
  {
    key: 'cheapest',
    header: 'Mais barato',
    cell: (row) => (
      <span className="text-primary-active">
        {row.cheapestMarket} <span className="money">{formatCurrency(row.minPrice)}</span>
      </span>
    ),
  },
  {
    key: 'expensive',
    header: 'Mais caro',
    cell: (row) => (
      <span className="text-danger">
        {row.mostExpensiveMarket} <span className="money">{formatCurrency(row.maxPrice)}</span>
      </span>
    ),
  },
  {
    key: 'diff',
    header: 'Diferença',
    align: 'right',
    cell: (row) => <Badge tone="warning">{formatCurrency(row.diff)}</Badge>,
  },
];

export function AnalyticsPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['analytics'],
    queryFn: getAnalytics,
  });

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-text">Inteligência de preços</h1>
        <p className="mt-1 text-sm text-text-muted">
          Tendências de busca, competitividade dos mercados e onde mais economizar.
        </p>
      </header>

      {isError && (
        <Card>
          <CardBody>
            <ErrorState message="Não foi possível carregar os indicadores." onRetry={() => refetch()} />
          </CardBody>
        </Card>
      )}

      {/* KPIs */}
      <section aria-label="Métricas" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          label="Mercado mais barato (geral)"
          value={data?.cheapestMarketByList ?? '—'}
          numeric={false}
          icon={<Store className="h-5 w-5" aria-hidden="true" />}
          helpText="campeão entre as listas"
        />
        <KpiCard
          label="Economia média por usuário"
          value={data ? formatCurrency(data.avgSavingsPerUser) : '—'}
          icon={<PiggyBank className="h-5 w-5" aria-hidden="true" />}
          helpText="por lista comparada"
        />
        <KpiCard
          label="Preços cadastrados (manuais)"
          value={data ? data.manualPricesCount.toLocaleString('pt-BR') : '—'}
          icon={<BadgeDollarSign className="h-5 w-5" aria-hidden="true" />}
          helpText="contribuições da comunidade"
        />
      </section>

      {/* Gráficos */}
      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Categorias mais pesquisadas</CardTitle>
          </CardHeader>
          <CardBody>
            {isLoading || !data ? (
              <ChartSkeleton />
            ) : data.categoryShares.length === 0 ? (
              <ChartEmpty />
            ) : (
              <CategoryDonut data={data.categoryShares} />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mercados mais competitivos</CardTitle>
          </CardHeader>
          <CardBody>
            {isLoading || !data ? (
              <ChartSkeleton />
            ) : data.marketCompetitiveness.length === 0 ? (
              <ChartEmpty />
            ) : (
              <MarketBarChart data={data.marketCompetitiveness} />
            )}
          </CardBody>
        </Card>
      </section>

      {/* Tabelas */}
      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Produtos mais pesquisados</CardTitle>
          </CardHeader>
          <CardBody className="p-0">
            <Table
              columns={rankingColumns}
              data={data?.mostSearchedProducts ?? []}
              rowKey={(row) => row.product.id}
              caption="Ranking de produtos mais pesquisados"
              emptyMessage={isLoading ? 'Carregando...' : 'Sem dados.'}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Oportunidades de economia</CardTitle>
          </CardHeader>
          <CardBody className="p-0">
            <Table
              columns={opportunityColumns}
              data={data?.opportunities ?? []}
              rowKey={(row) => row.product.id}
              caption="Produtos com maior diferença de preço entre mercados"
              emptyMessage={isLoading ? 'Carregando...' : 'Sem dados.'}
            />
          </CardBody>
        </Card>
      </section>
    </div>
  );
}

function ChartSkeleton() {
  return <div className="h-[280px] animate-pulse rounded-md bg-bg" aria-hidden="true" />;
}

function ChartEmpty() {
  return (
    <div className="grid h-[280px] place-items-center text-sm text-text-subtle">
      Sem dados para exibir ainda.
    </div>
  );
}
