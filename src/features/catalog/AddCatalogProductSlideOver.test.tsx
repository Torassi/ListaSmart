import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test/utils';
import { seedSession } from '@/test/fakeBackend';
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
    seedSession(); // POST /products exige autenticação
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

  it('mantém o formulário aberto e mostra a mensagem da API em caso de erro', async () => {
    seedSession();
    const onClose = vi.fn();
    renderWithProviders(<AddCatalogProductSlideOver open onClose={onClose} markets={markets} />);

    await userEvent.type(screen.getByLabelText(/^Produto/i), 'Repetido');
    await userEvent.selectOptions(screen.getByLabelText(/Categoria/i), 'Mercearia');
    await userEvent.type(screen.getByLabelText(/Unidade/i), 'un');
    await userEvent.selectOptions(screen.getByLabelText(/Mercado/i), 'giassi');
    await userEvent.type(screen.getByLabelText(/Preço/i), '5');
    // 7891000000000 já pertence ao produto "p1" do fake backend → 409.
    await userEvent.type(screen.getByLabelText(/Código de barras/i), '7891000000000');
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar ao catálogo' }));

    // Erro exibido; o form NÃO fecha (onClose não chamado) e mantém os dados.
    expect(await screen.findByText(/já existe um produto com este código/i)).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/^Produto/i)).toHaveValue('Repetido');
  });
});
