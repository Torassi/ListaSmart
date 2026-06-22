import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { renderWithProviders, screen, waitFor } from '@/test/utils';
import { getRecordedSearchEvents, seedSession } from '@/test/fakeBackend';
import { HomePage } from './HomePage';

describe('registro de busca com debounce (Home)', () => {
  it('registra UM evento com o termo final, não a cada tecla', async () => {
    seedSession();
    renderWithProviders(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    const search = await screen.findByLabelText('Buscar produtos');
    await userEvent.type(search, 'banana');

    // Após o debounce, deve haver exatamente um evento de busca por termo.
    await waitFor(
      () => {
        const queries = getRecordedSearchEvents().filter((e) => e.query);
        expect(queries).toHaveLength(1);
        expect(queries[0].query).toBe('banana');
      },
      { timeout: 2000 },
    );
  });
});
