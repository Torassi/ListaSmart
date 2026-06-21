/**
 * FavoritesPanel — grade de produtos e supermercados favoritos do usuário.
 */
import { Heart, Plus, Store } from 'lucide-react';
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, ProductImage } from '@/components';
import { useToast } from '@/hooks/useToast';
import { useList } from '@/features/list/ListContext';
import type { Favorites } from '@/types';

interface FavoritesPanelProps {
  favorites?: Favorites;
  isLoading?: boolean;
}

export function FavoritesPanel({ favorites, isLoading }: FavoritesPanelProps) {
  const { addItem } = useList();
  const { toast } = useToast();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-4 w-4 text-danger" aria-hidden="true" />
          Favoritos
        </CardTitle>
      </CardHeader>
      <CardBody className="flex flex-col gap-4">
        {isLoading && <p className="text-sm text-text-subtle">Carregando...</p>}

        {!isLoading && favorites && favorites.products.length === 0 && favorites.markets.length === 0 && (
          <p className="text-sm text-text-subtle">Você ainda não marcou favoritos.</p>
        )}

        {!isLoading && favorites && (favorites.products.length > 0 || favorites.markets.length > 0) && (
          <>
            {favorites.products.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-subtle">
                  Produtos
                </p>
                <ul className="flex flex-col gap-2">
                  {favorites.products.map((product) => (
                    <li
                      key={product.id}
                      className="flex items-center gap-3 rounded-md border border-border p-2"
                    >
                      <ProductImage
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-10 w-10 shrink-0 rounded-md"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-text">{product.name}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Adicionar ${product.name} à lista`}
                        onClick={() => {
                          addItem(product);
                          toast(`${product.name} adicionado à lista`, 'success');
                        }}
                      >
                        <Plus className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {favorites.markets.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-subtle">
                  Supermercados
                </p>
                <div className="flex flex-wrap gap-2">
                  {favorites.markets.map((market) => (
                    <Badge key={market.id} tone="neutral">
                      <Store className="h-3 w-3" aria-hidden="true" />
                      {market.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardBody>
    </Card>
  );
}
