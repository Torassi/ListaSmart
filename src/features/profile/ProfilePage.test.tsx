import { afterEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { renderWithProviders, screen } from '@/test/utils';
import { seedSession } from '@/test/fakeBackend';
import { ProfilePage } from './ProfilePage';

function renderProfile() {
  return renderWithProviders(
    <MemoryRouter>
      <ProfilePage />
    </MemoryRouter>,
  );
}

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

describe('ProfilePage — atualização de perfil', () => {
  it('mostra sucesso somente após a API confirmar', async () => {
    seedSession({ name: 'Antigo' });
    renderProfile();

    const name = await screen.findByLabelText(/^Nome/i);
    await userEvent.clear(name);
    await userEvent.type(name, 'Nome Novo');
    await userEvent.type(screen.getByLabelText(/Região/i), 'Sul');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    expect(await screen.findByText('Perfil atualizado')).toBeInTheDocument();
  });

  it('mostra erro e mantém o formulário quando a API falha', async () => {
    seedSession({ name: 'Antigo' });
    renderProfile();

    const name = await screen.findByLabelText(/^Nome/i);
    await userEvent.clear(name);
    await userEvent.type(name, 'Falha');
    await userEvent.type(screen.getByLabelText(/Região/i), 'Sul');

    // Faz o PATCH /auth/me falhar; o restante segue no fake backend.
    globalThis.fetch = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('/auth/me') && (init?.method ?? 'GET').toUpperCase() === 'PATCH') {
        return Promise.resolve(
          new Response(JSON.stringify({ error: { message: 'Falha ao salvar.' } }), {
            status: 400,
            headers: { 'content-type': 'application/json' },
          }),
        );
      }
      return realFetch(input, init);
    }) as typeof fetch;

    await userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    expect(await screen.findByText('Falha ao salvar.')).toBeInTheDocument();
    // O formulário continua presente com o valor digitado (não fechou/limpou).
    expect(screen.getByLabelText(/^Nome/i)).toHaveValue('Falha');
  });
});
