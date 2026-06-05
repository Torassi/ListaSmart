/**
 * Sidebar — navegação lateral.
 *
 * Desktop: fixa à esquerda. Mobile: vira um drawer sobreposto, controlado por
 * `open`/`onClose` (acessível: Esc fecha, overlay clicável, foco no fechar).
 */
import { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { navItems } from './navigation';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

function Brand() {
  return (
    <div className="flex items-center gap-2 px-2">
      <span className="grid h-9 w-9 place-items-center rounded-md bg-primary text-lg font-extrabold text-white">
        L
      </span>
      <span className="text-lg font-extrabold tracking-tight text-text">
        Lista<span className="text-primary">Smart</span>
      </span>
    </div>
  );
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1" aria-label="Navegação principal">
      {navItems.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors',
              isActive
                ? 'bg-primary-soft text-primary-active'
                : 'text-text-muted hover:bg-bg hover:text-text',
            )
          }
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

export function Sidebar({ open, onClose }: SidebarProps) {
  // Fecha o drawer com a tecla Esc (acessibilidade).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <>
      {/* Sidebar fixa (desktop) */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-surface lg:flex lg:flex-col">
        <div className="flex h-16 items-center border-b border-border px-4">
          <Brand />
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <NavList />
        </div>
      </aside>

      {/* Drawer (mobile) */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={onClose}
            className="absolute inset-0 bg-text/40 animate-fade-in"
          />
          <aside
            className="absolute left-0 top-0 flex h-full w-72 max-w-[80vw] flex-col bg-surface shadow-card-hover animate-slide-in-right"
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navegação"
          >
            <div className="flex h-16 items-center justify-between border-b border-border px-4">
              <Brand />
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar menu"
                className="grid h-9 w-9 place-items-center rounded-md text-text-muted hover:bg-bg"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <NavList onNavigate={onClose} />
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
