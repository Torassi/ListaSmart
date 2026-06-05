import { describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { ListProvider, useList, useLists } from './ListContext';
import type { Product } from '@/types';

const product: Product = {
  id: 'p1',
  name: 'Arroz',
  category: 'Mercearia',
  unit: '5 kg',
  imageUrl: 'data:image/svg+xml;utf8,<svg/>',
};

function wrapper({ children }: { children: ReactNode }) {
  return <ListProvider>{children}</ListProvider>;
}

function setup() {
  return renderHook(() => ({ list: useList(), lists: useLists() }), { wrapper });
}

describe('múltiplas listas', () => {
  it('inicia com uma lista padrão ativa', () => {
    const { result } = setup();
    expect(result.current.lists.lists).toHaveLength(1);
    expect(result.current.lists.activeId).toBeTruthy();
  });

  it('cria nova lista, torna-a ativa e isola os itens entre listas', () => {
    const { result } = setup();

    act(() => result.current.list.addItem(product)); // item na lista A
    const firstId = result.current.lists.activeId;

    act(() => {
      result.current.lists.createList('Churrasco');
    });
    // Agora a lista ativa é a nova (vazia).
    expect(result.current.lists.activeId).not.toBe(firstId);
    expect(result.current.list.items).toHaveLength(0);

    // Volta para a primeira: itens preservados.
    act(() => result.current.lists.selectList(firstId));
    expect(result.current.list.items).toHaveLength(1);
  });

  it('nunca deixa zero listas ao excluir', () => {
    const { result } = setup();
    const onlyId = result.current.lists.activeId;
    act(() => result.current.lists.deleteList(onlyId));
    expect(result.current.lists.lists.length).toBeGreaterThanOrEqual(1);
  });
});
