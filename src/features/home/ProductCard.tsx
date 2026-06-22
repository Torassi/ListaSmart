/**
 * ProductCard — card do catálogo: imagem, categoria, nome, menor preço e
 * botão "Adicionar à lista" com feedback imediato (toast + contador no topbar).
 */
import { useState } from 'react';
import { Check, Plus } from 'lucide-react';
import { Badge, Button, Card, ProductImage } from '@/components';
import { formatCurrency } from '@/lib/currency';
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
    <Card interactive className="flex flex-col overflow-hidden">
      <div className="relative">
        <ProductImage src={product.imageUrl} alt={product.name} className="h-36 w-full" />
        <Badge tone="secondary" className="absolute left-2 top-2">
          {product.category}
        </Badge>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-semibold leading-snug text-text">{product.name}</h3>
        <p className="text-xs text-text-subtle">
          {product.unit}
          {product.brand ? ` · ${product.brand}` : ''}
        </p>

        <div className="mt-3 flex items-end justify-between gap-2">
          <div>
            {product.lowestPrice != null ? (
              <>
                <p className="text-[11px] text-text-subtle">a partir de</p>
                <p className="money text-lg font-extrabold text-primary-active">
                  {formatCurrency(product.lowestPrice)}
                </p>
              </>
            ) : (
              <p className="text-xs text-text-subtle">Sem preço cadastrado</p>
            )}
          </div>
        </div>

        <Button
          onClick={handleAdd}
          variant={justAdded ? 'secondary' : 'primary'}
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
