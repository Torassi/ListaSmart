/**
 * ProductCard — card do catálogo: imagem, categoria, nome, unidade e botão
 * "Adicionar à lista" com feedback imediato (toast + contador no topbar).
 *
 * NÃO exibe preço: durante a montagem da lista o usuário escolhe pelos atributos
 * do produto (nome, imagem, categoria, unidade). Os valores só aparecem na etapa
 * explícita de comparação (`ComparePage`). O tipo `ProductWithPrice` é mantido
 * (o `lowestPrice` continua vindo da API), apenas não é renderizado aqui.
 */
import { useState } from 'react';
import { Check, Plus } from 'lucide-react';
import { Badge, Button, Card, ProductImage } from '@/components';
import { useToast } from '@/hooks/useToast';
import { useList } from '@/features/list/ListContext';
import { registerSearchEvent } from '@/services';
import type { ProductWithPrice } from '@/services';

export interface ProductCardProps {
  product: ProductWithPrice;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useList();
  const { toast } = useToast();
  const [justAdded, setJustAdded] = useState(false);

  function handleAdd() {
    addItem(product);
    // Telemetria: produto selecionado/adicionado (silenciosa, não bloqueia a UI).
    void registerSearchEvent({ productId: product.id }).catch(() => undefined);
    toast(`${product.name} adicionado à lista`, 'success');
    // Feedback visual temporário no botão (sem recarregar a página).
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1200);
  }

  return (
    <Card interactive className="group flex flex-col overflow-hidden">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-muted">
        <ProductImage
          src={product.imageUrl}
          alt={product.name}
          className="h-full w-full transition-transform duration-300 group-hover:scale-105"
        />
        <Badge
          tone="neutral"
          className="absolute left-2 top-2 bg-surface/90 shadow-card ring-0 backdrop-blur"
        >
          {product.category}
        </Badge>
      </div>

      <div className="flex flex-1 flex-col p-4">
        {product.brand && (
          <p className="text-[11px] font-bold uppercase tracking-wide text-secondary-active">
            {product.brand}
          </p>
        )}
        <h3 className="line-clamp-2 font-semibold leading-snug text-text">{product.name}</h3>
        <p className="mt-0.5 text-xs text-text-subtle">{product.unit}</p>

        <Button
          onClick={handleAdd}
          variant={justAdded ? 'primary' : 'secondary'}
          size="sm"
          className="mt-4 w-full"
          leftIcon={
            justAdded ? (
              <Check className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Plus className="h-4 w-4" aria-hidden="true" />
            )
          }
          aria-label={`Adicionar ${product.name} à lista`}
        >
          {justAdded ? 'Adicionado' : 'Adicionar à lista'}
        </Button>
      </div>
    </Card>
  );
}
