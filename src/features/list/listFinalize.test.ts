/**
 * Fluxo de finalização da lista + dashboard global (serviços ↔ fakeBackend).
 *
 * Cobre: registrar economia uma única vez por lista (idempotente), finalização
 * bloqueando edição/exclusão, e o dashboard sendo GLOBAL (um usuário vê os dados
 * registrados por outro).
 */
import { describe, expect, it } from 'vitest';
import { seedSession } from '@/test/fakeBackend';
import { ApiError } from '@/services/http';
import { addItem, createList, deleteList, getList } from '@/services/api/lists';
import { createComparisonSnapshot } from '@/services/api/comparison';
import { getAnalytics } from '@/services/api/analytics';

async function fullCoverageList(name: string): Promise<string> {
  const list = await createList(name);
  await addItem(list.id, 'p1'); // p1 tem preço em giassi e bistek
  await addItem(list.id, 'p2'); // p2 também → cobertura completa
  return list.id;
}

describe('finalização da lista', () => {
  it('registra a economia UMA única vez por lista e finaliza', async () => {
    seedSession();
    const listId = await fullCoverageList('Compra do mês');

    const first = await createComparisonSnapshot(listId);
    const second = await createComparisonSnapshot(listId);
    // Idempotente por lista: mesmo snapshot, sem duplicar dados no dashboard.
    expect(second.id).toBe(first.id);

    const refreshed = await getList(listId);
    expect(refreshed.finalized).toBe(true);
  });

  it('lista finalizada não pode ser editada nem excluída', async () => {
    seedSession();
    const listId = await fullCoverageList('Trancada');
    await createComparisonSnapshot(listId);

    // Editar (adicionar item) é bloqueado.
    await expect(addItem(listId, 'p1')).rejects.toBeInstanceOf(ApiError);
    // Excluir é bloqueado com código claro.
    let err: unknown;
    try {
      await deleteList(listId);
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).code).toBe('list_finalized');
  });

  it('lista NÃO finalizada pode ser excluída', async () => {
    seedSession();
    const list = await createList('Rascunho');
    await expect(deleteList(list.id)).resolves.toBeUndefined();
  });
});

describe('dashboard de inteligência (global)', () => {
  it('mostra os dados de TODOS os usuários, não só do logado', async () => {
    // Usuário A finaliza uma lista (gera snapshot/economia).
    seedSession({ email: 'a@x.com' });
    const listId = await fullCoverageList('Lista A');
    await createComparisonSnapshot(listId);

    // Outro usuário loga e vê o dashboard com os dados do usuário A.
    seedSession({ email: 'b@x.com' });
    const data = await getAnalytics();
    expect(data.avgSavingsPerUser).toBeGreaterThan(0);
    expect(data.cheapestMarketByList).not.toBe('—');
    expect(data.marketCompetitiveness.some((m) => m.cheapestWins > 0)).toBe(true);
  });

  it('"produtos mais listados" conta presença em listas finalizadas, não buscas', async () => {
    seedSession();
    const listId = await fullCoverageList('Compra');

    // Antes de finalizar, o ranking está vazio (não conta listas em edição).
    expect((await getAnalytics()).mostSearchedProducts).toEqual([]);

    await createComparisonSnapshot(listId); // finaliza
    const ranked = (await getAnalytics()).mostSearchedProducts;
    const byId = Object.fromEntries(ranked.map((r) => [r.product.id, r.searches]));
    expect(byId.p1).toBe(1);
    expect(byId.p2).toBe(1);
  });
});
