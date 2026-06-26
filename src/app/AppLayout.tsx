/**
 * AppLayout — shell da aplicação: Sidebar + Topbar + área de conteúdo.
 * O conteúdo das rotas é renderizado via <Outlet/>.
 */
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { BottomNav } from './BottomNav';

export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Skip link: aparece ao receber foco (navegação por teclado). */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Pular para o conteúdo
      </a>

      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenMenu={() => setMenuOpen(true)} />

        <main id="main-content" className="flex-1">
          {/* Largura de conteúdo limitada a 1440px e centralizada (desktop-first).
              Padding inferior extra no mobile reserva espaço para a BottomNav. */}
          <div className="mx-auto w-full max-w-content px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Navegação inferior (apenas mobile). */}
      <BottomNav />
    </div>
  );
}
