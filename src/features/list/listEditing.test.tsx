/**
 * ListPage em edição: mostra os atributos do produto e a quantidade, NUNCA
 * preços/totais/destaque de mercado, e oferece a ação explícita "Comparar preços".
 */
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { act, renderWithProviders, screen, waitFor } from '@/test/utils';
import { seedSession } from '@/test/fakeBackend';
import type { Product } from '@/types';
import { useList, useLists } from './ListContext';
import { ListPage } from './ListPage';

const banana: Product = {
  id: 'p1',
  name: 'Banana Prata',
  category: 'Hortifrúti',
  unit: '1 kg',
  imageUrl: 'data:,',
};

// Captura as ações do contexto (mesma árvore = mesmo provider que a ListPage).
let api!: {
  createList: (name: string) => Promise<void>;
  addItem: (product: Product) => void;
  activeId: string;
};
function Capture() {
  const lists = useLists();
  const list = useList();
  api = { createList: lists.createList, addItem: list.addItem, activeId: lists.activeId };
  return null;
}

async function setupListWithBanana() {
  seedSession();
  renderWithProviders(
    <MemoryRouter>
      <Capture />
      <ListPage />
    </MemoryRouter>,
  );
  await act(async () => {
    await api.createList('Compra do mês');
  });
  await waitFor(() => expect(api.activeId).toBeTruthy());
  act(() => api.addItem(banana));
  await screen.findByText('Banana Prata');
}

describe('ListPage — montagem da lista sem preços', () => {
  it('exibe produto, unidade e quantidade, sem qualquer valor monetário', async () => {
    await setupListWithBanana();

    // Atributos visíveis durante a montagem.
    expect(screen.getByText('Banana Prata')).toBeInTheDocument();
    expect(screen.getByText('Hortifrúti')).toBeInTheDocument();
    expect(screen.getByText('1 kg')).toBeInTheDocument();

    // Nenhum preço/valor vaza enquanto a lista é montada (p1 custa 5,49/5,00).
    expect(screen.queryByText(/R\$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\d+,\d{2}/)).not.toBeInTheDocument();
    // Sem coluna de mercado nem linha de total.
    expect(screen.queryByText(/Total por mercado/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Giassi')).not.toBeInTheDocument();
    expect(screen.queryByText('Bistek')).not.toBeInTheDocument();
  });

  it('oferece a ação explícita "Comparar preços"', async () => {
    await setupListWithBanana();
    expect(screen.getByRole('button', { name: /Comparar preços/i })).toBeInTheDocument();
  });
});
