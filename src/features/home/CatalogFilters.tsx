/**
 * CatalogFilters — busca + filtro por categoria acima do grid de produtos.
 * Componente controlado; a lógica de filtragem fica na HomePage.
 */
import { SearchInput } from '@/components';
import { cn } from '@/lib/cn';
import type { ProductCategory } from '@/types';

interface CatalogFiltersProps {
  query: string;
  onQueryChange: (value: string) => void;
  categories: ProductCategory[];
  selected: ProductCategory | 'all';
  onSelect: (category: ProductCategory | 'all') => void;
}

export function CatalogFilters({
  query,
  onQueryChange,
  categories,
  selected,
  onSelect,
}: CatalogFiltersProps) {
  const chips: Array<{ key: ProductCategory | 'all'; label: string }> = [
    { key: 'all', label: 'Todos' },
    ...categories.map((c) => ({ key: c, label: c })),
  ];

  return (
    <div className="flex flex-col gap-3">
      <SearchInput
        value={query}
        onChange={onQueryChange}
        placeholder="Buscar produtos por nome..."
        ariaLabel="Buscar produtos"
        className="max-w-md"
      />

      <div
        className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
        role="group"
        aria-label="Filtrar por categoria"
      >
        {chips.map(({ key, label }) => {
          const active = selected === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              aria-pressed={active}
              className={cn(
                'whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors',
                active
                  ? 'border-primary bg-primary text-white'
                  : 'border-border bg-surface text-text-muted hover:border-primary/40 hover:text-text',
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
