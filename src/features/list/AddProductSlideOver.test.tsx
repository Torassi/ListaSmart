import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test/utils';
import { AddProductSlideOver } from './AddProductSlideOver';
import type { Market } from '@/types';

const markets: Market[] = [{ id: 'giassi', name: 'Giassi' }];

describe('AddProductSlideOver', () => {
  it('exibe erros de validação ao salvar vazio', async () => {
    renderWithProviders(<AddProductSlideOver open onClose={vi.fn()} markets={markets} />);

    await userEvent.click(screen.getByRole('button', { name: 'Adicionar à lista' }));

    expect(await screen.findByText('Informe o nome do produto.')).toBeInTheDocument();
    expect(screen.getByText('Selecione uma categoria.')).toBeInTheDocument();
    expect(screen.getByText('Selecione um mercado.')).toBeInTheDocument();
  });

  it('salva e fecha quando os dados são válidos', async () => {
    const onClose = vi.fn();
    renderWithProviders(<AddProductSlideOver open onClose={onClose} markets={markets} />);

    await userEvent.type(screen.getByLabelText(/^Produto/i), 'Arroz integral');
    await userEvent.selectOptions(screen.getByLabelText(/Categoria/i), 'Mercearia');
    await userEvent.selectOptions(screen.getByLabelText(/Mercado/i), 'giassi');
    await userEvent.type(screen.getByLabelText(/Preço/i), '24.90');
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar à lista' }));

    await vi.waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});
