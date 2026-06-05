import { describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { renderWithProviders, screen } from '@/test/utils';
import { ProtectedRoute } from './ProtectedRoute';

describe('ProtectedRoute', () => {
  it('redireciona para /login quando não autenticado', () => {
    renderWithProviders(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<p>Conteúdo protegido</p>} />
          </Route>
          <Route path="/login" element={<p>Tela de login</p>} />
        </Routes>
      </MemoryRouter>,
    );

    // Sem sessão (estado em memória inicia deslogado), deve cair na tela de login.
    expect(screen.getByText('Tela de login')).toBeInTheDocument();
    expect(screen.queryByText('Conteúdo protegido')).not.toBeInTheDocument();
  });
});
