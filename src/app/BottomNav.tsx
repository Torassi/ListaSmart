/**
 * BottomNav — barra de navegação inferior para mobile (toque).
 *
 * Aparece apenas abaixo de `lg` e complementa a Sidebar/drawer do desktop,
 * trazendo os destinos principais ao alcance do polegar. Alvos de toque
 * confortáveis (>= 44px), rótulo curto sob o ícone e destaque da rota atual
 * que não depende só da cor (indicador no topo + peso da fonte + aria-current).
 */
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { navItems } from './navigation';

// Rótulos curtos, otimizados para caber em telas estreitas (~360px).
const SHORT_LABELS: Record<string, string> = {
  '/': 'Início',
  '/lista': 'Lista',
  '/listas': 'Listas',
  '/comparar': 'Comparar',
  '/analytics': 'Dados',
};

export function BottomNav() {
  return (
    <nav
      aria-label="Navegação principal (mobile)"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 shadow-nav backdrop-blur lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="mx-auto flex max-w-content items-stretch justify-around px-1">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              aria-label={label}
              className={({ isActive }) =>
                cn(
                  'tap-target relative mx-auto flex h-14 flex-col items-center justify-center gap-1 px-1 text-[11px] font-semibold transition-colors',
                  isActive ? 'text-primary-active' : 'text-text-subtle hover:text-text',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    aria-hidden="true"
                    className={cn(
                      'absolute top-0 h-1 w-8 rounded-b-full bg-primary transition-opacity',
                      isActive ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  <span className="leading-none">{SHORT_LABELS[to] ?? label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
