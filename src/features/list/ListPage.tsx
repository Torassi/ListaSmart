/**
 * ListPage — montagem da lista de compras.
 *
 * Durante a edição, a tela mostra APENAS os atributos do produto (nome, imagem,
 * categoria, unidade) e a quantidade — sem preços, totais ou destaque de mercado.
 * Os valores aparecem só na etapa explícita de comparação ("Comparar preços").
 *
 * Produtos são adicionados pelo catálogo (Home), não por esta tela. Quando a
 * lista é finalizada (economia registrada no dashboard), ela fica somente-leitura.
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Scale, Trash2 } from 'lucide-react';
import { Badge, Button, Card, CardBody, ProductImage, SearchInput } from '@/components';
import { useList, useLists } from './ListContext';
import { QuantityStepper } from './QuantityStepper';
import { CollaboratorsAvatars } from './CollaboratorsAvatars';

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

export function ListPage() {
  const { items, setQuantity, removeItem } = useList();
  const { activeName, activeCollaborators, activeFinalized } = useLists();
  const [query, setQuery] = useState('');

  // Busca local nos itens da lista por nome, categoria ou código de barras.
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

  return (
    <div className="flex flex-col gap-6">
      {/* Cabeçalho */}
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-text">{activeName}</h1>
            {activeFinalized && (
              <Badge tone="primary" className="gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                Finalizada
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-text-muted">
            {activeFinalized
              ? 'Lista finalizada — entrou no dashboard e não pode mais ser editada.'
              : `${items.length} ${items.length === 1 ? 'item' : 'itens'} · adicione produtos pelo catálogo. Os preços aparecem só ao comparar.`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <CollaboratorsAvatars users={activeCollaborators} />
          <Link to="/comparar">
            <Button
              disabled={items.length === 0}
              leftIcon={<Scale className="h-4 w-4" aria-hidden="true" />}
            >
              {activeFinalized ? 'Ver comparação' : 'Comparar preços'}
            </Button>
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
        <EmptyState />
      ) : (
        <Card>
          <CardBody className="overflow-x-auto p-0">
            <table className="w-full border-collapse text-sm">
              <caption className="sr-only">Itens da lista de compras</caption>
              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-subtle">
                    Produto
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-subtle">
                    Unidade
                  </th>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-text-subtle">
                    Qtd.
                  </th>
                  {!activeFinalized && (
                    <th scope="col" className="px-4 py-3">
                      <span className="sr-only">Ações</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
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
                    <td className="px-4 py-3 text-left text-text-muted">{item.product.unit}</td>
                    <td className="px-4 py-3 text-center">
                      {activeFinalized ? (
                        <span className="font-semibold text-text">{item.quantity}</span>
                      ) : (
                        <QuantityStepper
                          value={item.quantity}
                          onChange={(q) => setQuantity(item.product.id, q)}
                          label={item.product.name}
                        />
                      )}
                    </td>
                    {!activeFinalized && (
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
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <Card className="p-10 text-center">
      <p className="text-base font-semibold text-text">Sua lista está vazia</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-text-muted">
        Adicione produtos pelo catálogo na Home para montar sua lista de compras.
      </p>
      <div className="mt-6 flex justify-center">
        <Link to="/">
          <Button variant="secondary">Ir ao catálogo</Button>
        </Link>
      </div>
    </Card>
  );
}
