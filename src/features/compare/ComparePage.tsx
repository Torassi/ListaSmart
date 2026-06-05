/**
 * ComparePage — comparador de preços da lista entre supermercados da região.
 * Banner do mais barato + tabela com colunas por mercado (menor verde / maior vermelho).
 */
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Crown } from 'lucide-react';
import { Badge, Button, Card, CardBody, ProductImage } from '@/components';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/lib/currency';
import { buildComparison } from '@/lib/comparison';
import { useList } from '@/features/list/ListContext';
import { useMarkets, usePriceMatrix } from '@/features/list/queries';
import { CheapestMarketBanner } from './CheapestMarketBanner';

export function ComparePage() {
  const { items, customPrices } = useList();
  const marketsQuery = useMarkets();
  const matrixQuery = usePriceMatrix();

  const markets = useMemo(() => marketsQuery.data ?? [], [marketsQuery.data]);
  const matrix = useMemo(() => matrixQuery.data ?? {}, [matrixQuery.data]);

  const comparison = useMemo(
    () => buildComparison(items, markets, matrix, customPrices),
    [items, markets, matrix, customPrices],
  );

  if (items.length === 0) {
    return (
      <Card className="mx-auto max-w-xl p-10 text-center">
        <h1 className="text-xl font-extrabold text-text">Nada para comparar ainda</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-text-muted">
          Adicione produtos à sua lista para comparar os preços entre os mercados da região.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Link to="/">
            <Button variant="secondary">Ir ao catálogo</Button>
          </Link>
          <Link to="/lista">
            <Button>Ver minha lista</Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-text">Comparador de preços</h1>
        <p className="mt-1 text-sm text-text-muted">
          Preços da sua lista lado a lado nos supermercados da região.
        </p>
      </header>

      {comparison.cheapestMarketId && <CheapestMarketBanner comparison={comparison} />}

      <Card>
        <CardBody className="overflow-x-auto p-0">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">Comparativo de preços por mercado</caption>
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-subtle">
                  Produto
                </th>
                <th scope="col" className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-text-subtle">
                  Qtd.
                </th>
                {markets.map((m) => {
                  const isCheapest = m.id === comparison.cheapestMarketId;
                  return (
                    <th
                      key={m.id}
                      scope="col"
                      className={cn(
                        'px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide',
                        isCheapest ? 'text-primary-active' : 'text-text-subtle',
                      )}
                    >
                      <span className="inline-flex items-center gap-1">
                        {isCheapest && <Crown className="h-3.5 w-3.5" aria-hidden="true" />}
                        {m.name}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {comparison.rows.map((row) => (
                <tr key={row.product.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <ProductImage
                        src={row.product.imageUrl}
                        alt={row.product.name}
                        className="h-10 w-10 shrink-0 rounded-md"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-text">{row.product.name}</p>
                        <Badge tone="secondary" className="mt-0.5">
                          {row.product.category}
                        </Badge>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center font-semibold text-text">{row.quantity}</td>
                  {row.cells.map((cell) => (
                    <td
                      key={cell.marketId}
                      className={cn(
                        'money px-4 py-3 text-right font-semibold',
                        cell.isCheapest && 'bg-primary-soft text-primary-active',
                        cell.isMostExpensive && 'bg-danger/10 text-danger',
                        !cell.isCheapest && !cell.isMostExpensive && 'text-text',
                      )}
                    >
                      {cell.value != null ? formatCurrency(cell.value) : '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border bg-bg/50">
                <td className="px-4 py-3 font-bold text-text" colSpan={2}>
                  Total da lista
                </td>
                {markets.map((m) => {
                  const total = comparison.totals.find((t) => t.marketId === m.id)?.total ?? 0;
                  const isCheapest = m.id === comparison.cheapestMarketId;
                  return (
                    <td
                      key={m.id}
                      className={cn(
                        'money px-4 py-3 text-right font-extrabold',
                        isCheapest ? 'text-primary-active' : 'text-text',
                      )}
                    >
                      {total > 0 ? formatCurrency(total) : '—'}
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
