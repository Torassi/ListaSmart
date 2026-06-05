/**
 * Topbar — barra superior do app shell.
 * Mostra o botão de menu (mobile), o contador da lista e o usuário atual.
 */
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Menu, ShoppingCart } from 'lucide-react';
import { Avatar } from '@/components';
import { useList } from '@/features/list/ListContext';
import { useAuth } from '@/features/auth/AuthContext';

interface TopbarProps {
  onOpenMenu: () => void;
}

export function Topbar({ onOpenMenu }: TopbarProps) {
  const { count } = useList();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-surface/80 px-4 backdrop-blur">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Abrir menu"
        className="grid h-10 w-10 place-items-center rounded-md text-text-muted hover:bg-bg lg:hidden"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      <div className="flex-1" />

      {/* Contador da lista (link para a tela de lista — Etapa 3). */}
      <Link
        to="/lista"
        className="relative grid h-10 w-10 place-items-center rounded-md text-text-muted hover:bg-bg"
        aria-label={`Minha lista, ${count} ${count === 1 ? 'item' : 'itens'}`}
      >
        <ShoppingCart className="h-5 w-5" aria-hidden="true" />
        {count > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-bold text-white"
            aria-hidden="true"
          >
            {count > 99 ? '99+' : count}
          </span>
        )}
      </Link>

      <div className="flex items-center gap-2">
        <Link
          to="/perfil"
          className="flex items-center gap-2 rounded-md p-1 hover:bg-bg"
          aria-label="Abrir perfil"
        >
          <Avatar name={user?.name ?? 'Usuário'} src={user?.avatarUrl} size="md" />
          <div className="hidden flex-col leading-tight pr-1 sm:flex">
            <span className="text-sm font-semibold text-text">{user?.name ?? 'Usuário'}</span>
            <span className="text-xs text-text-subtle">Ver perfil</span>
          </div>
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Sair"
          title="Sair"
          className="ml-1 grid h-10 w-10 place-items-center rounded-md text-text-muted hover:bg-bg hover:text-danger"
        >
          <LogOut className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
