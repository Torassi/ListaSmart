/**
 * Estado de listas de compras — INTEGRADO ao back-end.
 *
 * As listas e seus itens são persistidos no servidor (`/lists`). O React Query
 * cuida do cache; as mutações chamam a API e invalidam a query `['lists']`.
 *
 * Mantém a mesma API de hooks das etapas anteriores para minimizar mudanças nas
 * telas:
 *  - `useList()`  → opera na lista ATIVA (itens + quantidade).
 *  - `useLists()` → gerencia a coleção (criar/renomear/excluir/selecionar).
 *
 * Nada é guardado em localStorage: a fonte de verdade é o back-end. Apenas o id
 * da lista ATIVA (preferência de UI, não sensível) vive em memória.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ListItem, Product, ShoppingList, User } from '@/types';
import type { ProductPriceInput } from '@/lib/validation';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/features/auth/AuthContext';
import { queryKeys } from '@/lib/queryKeys';
import * as listsApi from '@/services/api/lists';
import { createProduct } from '@/services/api/catalog';

/* ---------- API da lista ativa (useList) ---------- */
interface ListContextValue {
  items: ListItem[];
  count: number;
  addItem: (product: Product, quantity?: number) => void;
  /** Cadastra produto + preço e adiciona à lista. Awaitable: o form trata erros. */
  addManualItem: (input: ProductPriceInput) => Promise<void>;
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
}

/* ---------- API da coleção (useLists) ---------- */
export interface ListSummary {
  id: string;
  name: string;
  itemCount: number;
  finalized: boolean;
  updatedAt: string;
}

interface ListsContextValue {
  lists: ListSummary[];
  activeId: string;
  activeName: string;
  /** True se a lista ativa foi finalizada (read-only, entrou no dashboard). */
  activeFinalized: boolean;
  /** Colaboradores da lista ativa (o dono é sempre o primeiro). */
  activeCollaborators: User[];
  /** Cria uma lista e a deixa ATIVA. Awaitable: navegue só após resolver, para
   *  já exibir a lista nova (vazia) em vez da anterior. */
  createList: (name: string) => Promise<void>;
  renameList: (id: string, name: string) => void;
  deleteList: (id: string) => void;
  selectList: (id: string) => void;
}

const ListContext = createContext<ListContextValue | null>(null);
const ListsContext = createContext<ListsContextValue | null>(null);

export function ListProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();

  // Chave de cache vinculada ao usuário — isola listas entre contas.
  const listsKey = useMemo(() => queryKeys.lists(user?.id), [user?.id]);
  const listsKeyRef = useRef(listsKey);
  listsKeyRef.current = listsKey;

  /** Executa uma ação assíncrona, evitando rejeições não tratadas e avisando o
   * usuário em caso de falha (as ações da UI são "fire-and-forget"). */
  const run = useCallback(
    (fn: () => Promise<void>) => {
      fn().catch(() => toast('Não foi possível salvar a alteração.', 'error'));
    },
    [toast],
  );

  const listsQuery = useQuery({
    queryKey: listsKey,
    queryFn: listsApi.getLists,
    enabled: isAuthenticated,
  });

  const lists = useMemo<ShoppingList[]>(() => listsQuery.data ?? [], [listsQuery.data]);

  const [activeId, setActiveId] = useState<string | null>(null);
  const activeIdRef = useRef<string | null>(null);
  activeIdRef.current = activeId;

  // Garante uma lista ativa válida assim que as listas carregam.
  useEffect(() => {
    if (lists.length === 0) return;
    if (!activeId || !lists.some((l) => l.id === activeId)) {
      setActiveId(lists[0].id);
    }
  }, [lists, activeId]);

  const active = useMemo(
    () => lists.find((l) => l.id === activeId) ?? lists[0] ?? null,
    [lists, activeId],
  );

  const invalidate = useCallback(
    () => qc.invalidateQueries({ queryKey: listsKeyRef.current }),
    [qc],
  );

  /** Invalida a lista + a comparação daquela lista (recalcula após mudanças). */
  const invalidateListAndComparison = useCallback(
    async (listId: string) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: listsKeyRef.current }),
        qc.invalidateQueries({ queryKey: queryKeys.comparison(listId) }),
      ]);
    },
    [qc],
  );

  /** Lista ativa mais recente do cache (evita closures defasadas nas mutações). */
  const resolveActive = useCallback((): ShoppingList | undefined => {
    const current = qc.getQueryData<ShoppingList[]>(listsKeyRef.current) ?? lists;
    return current.find((l) => l.id === activeIdRef.current) ?? current[0];
  }, [qc, lists]);

  /** Garante uma lista ativa EM EDIÇÃO.
   *
   * Reaproveita a lista ativa só se ainda não foi finalizada. Se não houver
   * lista, OU a ativa estiver finalizada (entrou no dashboard, read-only),
   * inicia automaticamente uma nova lista — sem o usuário precisar criá-la.
   */
  const ensureActiveList = useCallback(async (): Promise<ShoppingList> => {
    const existing = resolveActive();
    if (existing && !existing.finalized) return existing;

    const created = await listsApi.createList('Nova lista');
    activeIdRef.current = created.id;
    setActiveId(created.id);
    // Insere otimisticamente no cache para evitar duplicar listas em adições
    // rápidas em sequência (antes do refetch reconciliar).
    qc.setQueryData<ShoppingList[]>(listsKeyRef.current, (old) =>
      old ? [created, ...old] : [created],
    );
    if (existing?.finalized) {
      toast('Lista anterior finalizada — iniciamos uma nova lista.', 'info');
    }
    return created;
  }, [resolveActive, qc, toast]);

  /* ----- Ações da lista ativa ----- */
  const addItem = useCallback(
    (product: Product, quantity = 1) => {
      run(async () => {
        const list = await ensureActiveList();
        await listsApi.addItem(list.id, product.id, quantity);
        await invalidateListAndComparison(list.id);
      });
    },
    [run, ensureActiveList, invalidateListAndComparison],
  );

  // Awaitable (sem `run`): o formulário aguarda e trata sucesso/erro.
  const addManualItem = useCallback(
    async (input: ProductPriceInput): Promise<void> => {
      const list = await ensureActiveList();
      // Cria o produto no catálogo (+ preço inicial) e adiciona à lista.
      const product = await createProduct({
        name: input.name,
        category: input.category,
        unit: 'unidade',
        marketId: input.marketId,
        price: input.price,
      });
      await listsApi.addItem(list.id, product.id, input.quantity);
      // Mudança de preço/catálogo: invalida produtos, matriz, comparação,
      // analytics e economia recente, além da lista.
      await Promise.all([
        invalidateListAndComparison(list.id),
        qc.invalidateQueries({ queryKey: queryKeys.products }),
        qc.invalidateQueries({ queryKey: queryKeys.priceMatrix }),
        qc.invalidateQueries({ queryKey: queryKeys.analytics }),
        qc.invalidateQueries({ queryKey: queryKeys.savingsRecent }),
      ]);
    },
    [ensureActiveList, invalidateListAndComparison, qc],
  );

  const setQuantity = useCallback(
    (productId: string, quantity: number) => {
      run(async () => {
        const list = resolveActive();
        if (!list) return;
        if (quantity <= 0) await listsApi.removeItem(list.id, productId);
        else await listsApi.updateItemQuantity(list.id, productId, quantity);
        await invalidateListAndComparison(list.id);
      });
    },
    [run, resolveActive, invalidateListAndComparison],
  );

  const removeItem = useCallback(
    (productId: string) => {
      run(async () => {
        const list = resolveActive();
        if (!list) return;
        await listsApi.removeItem(list.id, productId);
        await invalidateListAndComparison(list.id);
      });
    },
    [run, resolveActive, invalidateListAndComparison],
  );

  const clear = useCallback(() => {
    run(async () => {
      const list = resolveActive();
      if (!list) return;
      await listsApi.clearList(list.id);
      await invalidateListAndComparison(list.id);
    });
  }, [run, resolveActive, invalidateListAndComparison]);

  /* ----- Ações da coleção ----- */
  // Awaitable: deixa a lista nova ATIVA antes de resolver, para a UI navegar e
  // já exibir a lista vazia (evita mostrar a anterior/finalizada e cliques
  // repetidos que duplicavam listas).
  const createList = useCallback(
    async (name: string): Promise<void> => {
      try {
        const created = await listsApi.createList(name.trim() || 'Nova lista');
        activeIdRef.current = created.id;
        setActiveId(created.id);
        // Insere otimisticamente no cache para a lista ativa já refletir a nova.
        qc.setQueryData<ShoppingList[]>(listsKeyRef.current, (old) =>
          old ? [created, ...old] : [created],
        );
        await invalidate();
      } catch {
        toast('Não foi possível criar a lista.', 'error');
      }
    },
    [invalidate, qc, toast],
  );

  const renameList = useCallback(
    (id: string, name: string) => {
      run(async () => {
        await listsApi.renameList(id, name);
        await invalidate();
      });
    },
    [run, invalidate],
  );

  const deleteList = useCallback(
    (id: string) => {
      run(async () => {
        await listsApi.deleteList(id);
        if (activeIdRef.current === id) setActiveId(null);
        await invalidate();
      });
    },
    [run, invalidate],
  );

  const selectList = useCallback((id: string) => setActiveId(id), []);

  const listValue = useMemo<ListContextValue>(() => {
    const items = active?.items ?? [];
    return {
      items,
      count: items.reduce((sum, i) => sum + i.quantity, 0),
      addItem,
      addManualItem,
      setQuantity,
      removeItem,
      clear,
    };
  }, [active, addItem, addManualItem, setQuantity, removeItem, clear]);

  const listsValue = useMemo<ListsContextValue>(
    () => ({
      lists: lists.map((l) => ({
        id: l.id,
        name: l.name,
        itemCount: l.items.reduce((sum, i) => sum + i.quantity, 0),
        finalized: l.finalized,
        updatedAt: l.updatedAt,
      })),
      activeId: active?.id ?? '',
      activeName: active?.name ?? '',
      activeFinalized: active?.finalized ?? false,
      activeCollaborators: active?.collaborators ?? [],
      createList,
      renameList,
      deleteList,
      selectList,
    }),
    [lists, active, createList, renameList, deleteList, selectList],
  );

  return (
    <ListContext.Provider value={listValue}>
      <ListsContext.Provider value={listsValue}>{children}</ListsContext.Provider>
    </ListContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useList(): ListContextValue {
  const ctx = useContext(ListContext);
  if (!ctx) throw new Error('useList deve ser usado dentro de <ListProvider>.');
  return ctx;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLists(): ListsContextValue {
  const ctx = useContext(ListsContext);
  if (!ctx) throw new Error('useLists deve ser usado dentro de <ListProvider>.');
  return ctx;
}
