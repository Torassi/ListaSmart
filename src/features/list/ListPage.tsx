/**
 * ListPage — gestão da lista de compras.
 *
 * Busca + tabela de itens com controle de quantidade e preços por mercado lado a
 * lado (menor em verde, maior em vermelho). Slide-over para adicionar produto/preço
 * manualmente e avatares dos colaboradores.
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Scale, Trash2 } from 'lucide-react';
import { Badge, Button, Card, CardBody, ProductImage, SearchInput } from '@/components';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/lib/currency';
import { resolveRowPrices } from '@/lib/pricing';
import { collaborators } from '@/services/mockData';
import { useList, useLists } from './ListContext';
import { useMarkets, usePriceMatrix } from './queries';
import { QuantityStepper } from './QuantityStepper';
import { CollaboratorsAvatars } from './CollaboratorsAvatars';
import { AddProductSlideOver } from './AddProductSlideOver';

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

export function ListPage() {
  const { items, customPrices, setQuantity, removeItem } = useList();
  const { activeName } = useLists();
  const marketsQuery = useMarkets();
  const matrixQuery = usePriceMatrix();
  const [query, setQuery] = useState('');
  const [slideOpen, setSlideOpen] = useState(false);

  const markets = useMemo(() => marketsQuery.data ?? [], [marketsQuery.data]);
  const matrix = useMemo(() => matrixQuery.data ?? {}, [matrixQuery.data]);

  // Busca por nome, categoria ou código de barras (id, como aproximação do mock).
  const filtered = useMemo(() => {
    const term = normalize(query.trim());
    if (!term) return items;
    return items.filter(
      (i) =>
        normalize(i.product.name).includes(term) ||
        normalize(i.product.category).includes(term) ||
        (i.product.barcode ?? '').includes(term),
    );
  }, [items, query]);

  // Totais por mercado (soma de preço × quantidade dos itens com preço naquele mercado).
  const totals = useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of items) {
      const cells = resolveRowPrices(item.product.id, markets, matrix, customPrices);
      for (const cell of cells) {
        if (cell.value != null) map[cell.marketId] = (map[cell.marketId] ?? 0) + cell.value * item.quantity;
      }
    }
    return map;
  }, [items, markets, matrix, customPrices]);

  const totalValues = Object.values(totals);
  const cheapestTotal = totalValues.length ? Math.min(...totalValues) : null;

  return (
    <div className="flex flex-col gap-6">
      {/* Cabeçalho */}
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-text">{activeName}</h1>
          <p className="mt-1 text-sm text-text-muted">
            {items.length} {items.length === 1 ? 'item' : 'itens'} · compare os preços por mercado.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <CollaboratorsAvatars users={collaborators} />
          <Button
            variant="secondary"
            onClick={() => setSlideOpen(true)}
            leftIcon={<Plus className="h-4 w-4" aria-hidden="true" />}
          >
            Adicionar produto
          </Button>
          <Link to="/comparar">
            <Button leftIcon={<Scale className="h-4 w-4" aria-hidden="true" />}>Comparar preços</Button>
          </Link>
        </div>
      </header>

      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Buscar na lista por nome, categoria ou código..."
        ariaLabel="Buscar na lista"
        className="max-w-md"
      />

      {/* Conteúdo */}
      {items.length === 0 ? (
        <EmptyState onAdd={() => setSlideOpen(true)} />
      ) : (
        <Card>
          <CardBody className="overflow-x-auto p-0">
            <table className="w-full border-collapse text-sm">
              <caption className="sr-only">Itens da lista com preços por mercado</caption>
              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-subtle">
                    Produto
                  </th>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-text-subtle">
                    Qtd.
                  </th>
                  {markets.map((m) => (
                    <th key={m.id} scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-text-subtle">
                      {m.name}
                    </th>
                  ))}
                  <th scope="col" className="px-4 py-3">
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const cells = resolveRowPrices(item.product.id, markets, matrix, customPrices);
                  return (
                    <tr key={item.product.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <ProductImage
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            className="h-10 w-10 shrink-0 rounded-md"
                          />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-text">{item.product.name}</p>
                            <Badge tone="secondary" className="mt-0.5">
                              {item.product.category}
                            </Badge>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <QuantityStepper
                          value={item.quantity}
                          onChange={(q) => setQuantity(item.product.id, q)}
                          label={item.product.name}
                        />
                      </td>
                      {cells.map((cell) => (
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
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => removeItem(item.product.id)}
                          aria-label={`Remover ${item.product.name} da lista`}
                          className="grid h-8 w-8 place-items-center rounded-md text-text-subtle hover:bg-danger/10 hover:text-danger"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {totalValues.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-border bg-bg/50">
                    <td className="px-4 py-3 font-bold text-text" colSpan={2}>
                      Total por mercado
                    </td>
                    {markets.map((m) => {
                      const total = totals[m.id];
                      const isCheapest = total != null && total === cheapestTotal;
                      return (
                        <td
                          key={m.id}
                          className={cn(
                            'money px-4 py-3 text-right font-extrabold',
                            isCheapest ? 'text-primary-active' : 'text-text',
                          )}
                        >
                          {total != null ? formatCurrency(total) : '—'}
                        </td>
                      );
                    })}
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </CardBody>
        </Card>
      )}

      <AddProductSlideOver open={slideOpen} onClose={() => setSlideOpen(false)} markets={markets} />
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <Card className="p-10 text-center">
      <p className="text-base font-semibold text-text">Sua lista está vazia</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-text-muted">
        Adicione produtos pelo catálogo na Home ou cadastre um item manualmente com o preço de um mercado.
      </p>
      <div className="mt-6 flex justify-center gap-2">
        <Link to="/">
          <Button variant="secondary">Ir ao catálogo</Button>
        </Link>
        <Button onClick={onAdd} leftIcon={<Plus className="h-4 w-4" aria-hidden="true" />}>
          Adicionar produto
        </Button>
      </div>
    </Card>
  );
}
