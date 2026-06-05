import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test/utils';
import { ProductCard } from './ProductCard';
import type { ProductWithPrice } from '@/services';

const product: ProductWithPrice = {
  id: 'p-test',
  name: 'Café Torrado',
  category: 'Mercearia',
  unit: '500 g',
  imageUrl: 'data:image/svg+xml;utf8,<svg/>',
  lowestPrice: 15.9,
};

describe('ProductCard', () => {
  it('exibe nome, categoria e menor preço', () => {
    renderWithProviders(<ProductCard product={product} />);
    expect(screen.getByText('Café Torrado')).toBeInTheDocument();
    expect(screen.getByText('Mercearia')).toBeInTheDocument();
    expect(screen.getByText(/15,90/)).toBeInTheDocument();
  });

  it('ao adicionar, dá feedback (toast + estado "Adicionado") sem recarregar', async () => {
    renderWithProviders(<ProductCard product={product} />);

    const addButton = screen.getByRole('button', { name: /Adicionar Café Torrado à lista/i });
    await userEvent.click(addButton);

    // Toast (role status) com a mensagem de confirmação.
    expect(await screen.findByText(/Café Torrado adicionado à lista/i)).toBeInTheDocument();
    // Estado temporário do botão.
    expect(screen.getByRole('button', { name: /Adicionar Café Torrado à lista/i })).toHaveTextContent(
      'Adicionado',
    );
  });
});
