/**
 * Garante que o catálogo da Home (cards + busca) NUNCA revela preços enquanto o
 * usuário monta a lista. As asserções são feitas dentro da região "Catálogo de
 * produtos" (os KPIs de economia histórica ficam fora e podem exibir valores).
 */
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { renderWithProviders, screen, waitFor, within } from '@/test/utils';
import { seedSession } from '@/test/fakeBackend';
import { HomePage } from './HomePage';

function renderHome() {
  return renderWithProviders(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  );
}

describe('Catálogo da Home — sem preços', () => {
  it('cards do catálogo não exibem preço nem "a partir de"', async () => {
    seedSession();
    renderHome();

    const catalog = await screen.findByRole('region', { name: 'Catálogo de produtos' });
    // Produtos do fake backend carregam de forma assíncrona.
    await within(catalog).findByText('Banana Prata');
    await within(catalog).findByText('Leite Integral');

    expect(within(catalog).queryByText(/R\$/)).not.toBeInTheDocument();
    expect(within(catalog).queryByText(/a partir de/i)).not.toBeInTheDocument();
    // 5,49 / 5,00 etc. (preços do seed) não podem vazar nos cards.
    expect(within(catalog).queryByText(/\d+,\d{2}/)).not.toBeInTheDocument();
  });

  it('busca no catálogo filtra sem revelar preços', async () => {
    seedSession();
    renderHome();

    const catalog = await screen.findByRole('region', { name: 'Catálogo de produtos' });
    await within(catalog).findByText('Banana Prata');

    const search = within(catalog).getByLabelText('Buscar produtos');
    await userEvent.type(search, 'Leite');

    // Filtra (debounce de 200ms): Banana some, Leite permanece — e sem preço.
    await waitFor(() => expect(within(catalog).queryByText('Banana Prata')).not.toBeInTheDocument());
    expect(within(catalog).getByText('Leite Integral')).toBeInTheDocument();
    expect(within(catalog).queryByText(/R\$/)).not.toBeInTheDocument();
  });
});
