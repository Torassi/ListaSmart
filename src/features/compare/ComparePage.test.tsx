/**
 * ComparePage — etapa explícita de comparação. Aqui (e só aqui) os preços
 * aparecem: por mercado, totais, destaque do mais barato, economia e a sinalização
 * de cobertura incompleta. Também oferece o caminho de volta para editar a lista.
 */
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { act, renderWithProviders, screen, waitFor, within } from '@/test/utils';
import { seedSession } from '@/test/fakeBackend';
import { createProduct } from '@/services/api/catalog';
import type { Product } from '@/types';
import { useList, useLists } from '@/features/list/ListContext';
import { ComparePage } from './ComparePage';

const banana: Product = { id: 'p1', name: 'Banana Prata', category: 'Hortifrúti', unit: '1 kg', imageUrl: 'data:,' };
const leite: Product = { id: 'p2', name: 'Leite Integral', category: 'Laticínios', unit: '1 L', imageUrl: 'data:,' };

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

function renderCompare() {
  renderWithProviders(
    <MemoryRouter>
      <Capture />
      <ComparePage />
    </MemoryRouter>,
  );
}

async function newList() {
  await act(async () => {
    await api.createList('Comparar');
  });
  await waitFor(() => expect(api.activeId).toBeTruthy());
}

describe('ComparePage', () => {
  it('mostra preços por mercado, totais, mais barato (Bistek) e economia', async () => {
    seedSession();
    renderCompare();
    await newList();
    // Ambos os produtos têm preço nos dois mercados → cobertura completa.
    act(() => api.addItem(banana)); // giassi 5,49 / bistek 5,00
    act(() => api.addItem(leite)); //  giassi 5,29 / bistek 4,97

    await screen.findByText('Total da lista');

    // Preços por mercado aparecem (valor único do p2 no bistek).
    expect(screen.getAllByText(/4,97/).length).toBeGreaterThan(0);
    // Cabeçalho com os dois mercados.
    expect(screen.getAllByText('Bistek').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Giassi').length).toBeGreaterThan(0);

    // Banner destaca o mercado mais barato = Bistek (5,00+4,97 < 5,49+5,29).
    const banner = (await screen.findByText(/Sugestão: mercado mais barato/i)).closest('div');
    expect(banner).not.toBeNull();
    expect(within(banner as HTMLElement).getByText('Bistek')).toBeInTheDocument();
    // Economia entre o mais barato e o mais caro.
    expect(screen.getByText(/Você economiza/i)).toBeInTheDocument();

    // Caminho explícito para voltar e editar a lista.
    expect(screen.getByRole('button', { name: /Editar lista/i })).toBeInTheDocument();
  });

  it('sinaliza mercado incompleto e o exclui da escolha do mais barato', async () => {
    seedSession();
    // Produto com preço APENAS na giassi → bistek fica sem cobertura total.
    const exclusivo = await createProduct({
      name: 'Produto Exclusivo',
      category: 'Mercearia',
      unit: 'unidade',
      marketId: 'giassi',
      price: 3,
    });

    renderCompare();
    await newList();
    act(() => api.addItem(banana)); // os dois mercados têm preço
    act(() => api.addItem(exclusivo as Product)); // só giassi tem preço

    await screen.findByText('Total da lista');

    // Apesar de o bistek poder ser "mais barato" no parcial, ele está incompleto:
    // o mais barato deve ser a giassi (única com cobertura completa).
    const banner = (await screen.findByText(/Sugestão: mercado mais barato/i)).closest('div');
    expect(within(banner as HTMLElement).getByText('Giassi')).toBeInTheDocument();
    // Sem economia possível (só um mercado elegível).
    expect(screen.queryByText(/Você economiza/i)).not.toBeInTheDocument();
    // Nota de cobertura incompleta visível ao usuário.
    expect(screen.getByText(/não entra na escolha do mais barato/i)).toBeInTheDocument();
  });
});
