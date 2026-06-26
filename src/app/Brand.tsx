/**
 * Brand — logotipo do ListaSmart (marca + wordmark), reutilizado na Sidebar,
 * no drawer e na navegação mobile. Mantém a identidade consistente em um só lugar.
 *
 * A marca é uma cesta de compras sobre o gradiente da marca (verde economia →
 * azul confiança); o wordmark usa "Smart" em destaque.
 */
import { ShoppingBasket } from 'lucide-react';
import { cn } from '@/lib/cn';

interface BrandProps {
  /** Oculta o texto, exibindo só a marca (ícone). */
  iconOnly?: boolean;
  className?: string;
}

export function Brand({ iconOnly = false, className }: BrandProps) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <span className="brand-gradient grid h-9 w-9 place-items-center rounded-xl text-white shadow-card">
        <ShoppingBasket className="h-5 w-5" aria-hidden="true" />
      </span>
      {!iconOnly && (
        <span className="text-lg font-extrabold tracking-tight text-text">
          Lista<span className="text-primary">Smart</span>
        </span>
      )}
    </span>
  );
}
