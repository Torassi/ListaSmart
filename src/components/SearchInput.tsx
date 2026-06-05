/**
 * SearchInput — campo de busca com ícone e botão de limpar.
 * Componente controlado (value/onChange) para uso na Home e na lista.
 */
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Rótulo acessível (vai para aria-label, já que normalmente não há <label> visível). */
  ariaLabel?: string;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Buscar...',
  ariaLabel = 'Buscar',
  className,
}: SearchInputProps) {
  return (
    <div className={cn('relative', className)}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle"
        aria-hidden="true"
      />
      <input
        type="search"
        role="searchbox"
        value={value}
        // maxLength espelha o limite do schema zod (defesa em profundidade).
        maxLength={80}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="input-base pl-9 pr-9"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Limpar busca"
          className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-text-subtle hover:bg-bg hover:text-text"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
