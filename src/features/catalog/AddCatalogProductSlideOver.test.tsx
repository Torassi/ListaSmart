import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test/utils';
import { AddCatalogProductSlideOver } from './AddCatalogProductSlideOver';
import type { Market } from '@/types';

const markets: Market[] = [{ id: 'giassi', name: 'Giassi' }];

describe('AddCatalogProductSlideOver', () => {
  it('exibe erros de validação ao salvar vazio', async () => {
    renderWithProviders(<AddCatalogProductSlideOver open onClose={vi.fn()} markets={markets} />);

    await userEvent.click(screen.getByRole('button', { name: 'Adicionar ao catálogo' }));

    expect(await screen.findByText('Informe o nome do produto.')).toBeInTheDocument();
    expect(screen.getByText('Informe a unidade (ex.: 1 kg).')).toBeInTheDocument();
    expect(screen.getByText('Selecione um mercado.')).toBeInTheDocument();
  });

  it('salva e fecha quando os dados são válidos', async () => {
    const onClose = vi.fn();
    renderWithProviders(<AddCatalogProductSlideOver open onClose={onClose} markets={markets} />);

    await userEvent.type(screen.getByLabelText(/^Produto/i), 'Aveia');
    await userEvent.selectOptions(screen.getByLabelText(/Categoria/i), 'Mercearia');
    await userEvent.type(screen.getByLabelText(/Unidade/i), '500 g');
    await userEvent.selectOptions(screen.getByLabelText(/Mercado/i), 'giassi');
    await userEvent.type(screen.getByLabelText(/Preço/i), '8.49');
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar ao catálogo' }));

    await vi.waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});
