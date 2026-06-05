/**
 * Estado global de listas de compras (Context API + useReducer).
 *
 * Gerencia VÁRIAS listas nomeadas; cada uma tem seus itens (produto + quantidade)
 * e os preços informados manualmente (`customPrices`). Expõe dois hooks:
 *  - `useList()`  → opera na lista ATIVA (mesma API das etapas anteriores).
 *  - `useLists()` → gerencia a coleção (criar/renomear/excluir/selecionar).
 *
 * Persistência: o estado é salvo em localStorage. Isso é aceitável porque são
 * DADOS NÃO SENSÍVEIS (itens de compra) — diferente de tokens de sessão, que
 * nunca devem ir para o storage (ver AuthContext). O back-end real assumirá a
 * persistência/sincronização entre dispositivos.
 */
import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import type { ReactNode } from 'react';
import type { ListItem, Product } from '@/types';
import type { ProductPriceInput } from '@/lib/validation';
import { productPlaceholder } from '@/lib/placeholder';

type CustomPrices = Record<string, Record<string, number>>;

interface StoredList {
  id: string;
  name: string;
  items: ListItem[];
  customPrices: CustomPrices;
  createdAt: string;
  updatedAt: string;
}

interface ListsState {
  lists: StoredList[];
  activeId: string;
}

const STORAGE_KEY = 'lista-smart:lists';

function now(): string {
  return new Date().toISOString();
}

function makeList(name: string): StoredList {
  const ts = now();
  return {
    id: `list-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    items: [],
    customPrices: {},
    createdAt: ts,
    updatedAt: ts,
  };
}

function defaultState(): ListsState {
  const first = makeList('Minha lista');
  return { lists: [first], activeId: first.id };
}

/** Carrega o estado do localStorage (com validação defensiva). */
function loadState(): ListsState {
  if (typeof window === 'undefined') return defaultState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as ListsState;
    if (!Array.isArray(parsed.lists) || parsed.lists.length === 0) return defaultState();
    const activeExists = parsed.lists.some((l) => l.id === parsed.activeId);
    return { lists: parsed.lists, activeId: activeExists ? parsed.activeId : parsed.lists[0].id };
  } catch {
    return defaultState();
  }
}

type ListAction =
  | { type: 'ADD'; product: Product; quantity?: number }
  | { type: 'ADD_MANUAL'; input: ProductPriceInput }
  | { type: 'SET_QUANTITY'; productId: string; quantity: number }
  | { type: 'REMOVE'; productId: string }
  | { type: 'CLEAR' }
  | { type: 'CREATE_LIST'; name: string; id: string }
  | { type: 'RENAME_LIST'; id: string; name: string }
  | { type: 'DELETE_LIST'; id: string }
  | { type: 'SELECT_LIST'; id: string };

/** Aplica `fn` à lista ativa, atualizando o timestamp. */
function updateActive(state: ListsState, fn: (list: StoredList) => StoredList): ListsState {
  return {
    ...state,
    lists: state.lists.map((l) => (l.id === state.activeId ? { ...fn(l), updatedAt: now() } : l)),
  };
}

function listsReducer(state: ListsState, action: ListAction): ListsState {
  switch (action.type) {
    case 'ADD':
      return updateActive(state, (list) => {
        const qty = action.quantity ?? 1;
        const existing = list.items.find((i) => i.product.id === action.product.id);
        const items = existing
          ? list.items.map((i) =>
              i.product.id === action.product.id ? { ...i, quantity: i.quantity + qty } : i,
            )
          : [...list.items, { product: action.product, quantity: qty }];
        return { ...list, items };
      });

    case 'ADD_MANUAL':
      return updateActive(state, (list) => {
        const { input } = action;
        const product: Product = {
          id: `manual-${Date.now()}`,
          name: input.name,
          category: input.category,
          unit: 'unidade',
          imageUrl: productPlaceholder('🛒'),
        };
        return {
          ...list,
          items: [...list.items, { product, quantity: input.quantity }],
          customPrices: { ...list.customPrices, [product.id]: { [input.marketId]: input.price } },
        };
      });

    case 'SET_QUANTITY':
      return updateActive(state, (list) => ({
        ...list,
        items:
          action.quantity <= 0
            ? list.items.filter((i) => i.product.id !== action.productId)
            : list.items.map((i) =>
                i.product.id === action.productId ? { ...i, quantity: action.quantity } : i,
              ),
      }));

    case 'REMOVE':
      return updateActive(state, (list) => ({
        ...list,
        items: list.items.filter((i) => i.product.id !== action.productId),
      }));

    case 'CLEAR':
      return updateActive(state, (list) => ({ ...list, items: [], customPrices: {} }));

    case 'CREATE_LIST': {
      const created: StoredList = { ...makeList(action.name), id: action.id };
      return { lists: [...state.lists, created], activeId: created.id };
    }

    case 'RENAME_LIST':
      return {
        ...state,
        lists: state.lists.map((l) =>
          l.id === action.id ? { ...l, name: action.name, updatedAt: now() } : l,
        ),
      };

    case 'DELETE_LIST': {
      const remaining = state.lists.filter((l) => l.id !== action.id);
      // Nunca deixa zero listas: recria uma vazia se necessário.
      const lists = remaining.length > 0 ? remaining : [makeList('Minha lista')];
      const activeId = lists.some((l) => l.id === state.activeId) ? state.activeId : lists[0].id;
      return { lists, activeId };
    }

    case 'SELECT_LIST':
      return state.lists.some((l) => l.id === action.id) ? { ...state, activeId: action.id } : state;

    default:
      return state;
  }
}

/* ---------- API da lista ativa (useList) ---------- */
interface ListContextValue {
  items: ListItem[];
  customPrices: CustomPrices;
  count: number;
  addItem: (product: Product, quantity?: number) => void;
  addManualItem: (input: ProductPriceInput) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
}

/* ---------- API da coleção (useLists) ---------- */
export interface ListSummary {
  id: string;
  name: string;
  itemCount: number;
  updatedAt: string;
}

interface ListsContextValue {
  lists: ListSummary[];
  activeId: string;
  activeName: string;
  /** Cria uma lista e a torna ativa; retorna o id criado. */
  createList: (name: string) => string;
  renameList: (id: string, name: string) => void;
  deleteList: (id: string) => void;
  selectList: (id: string) => void;
}

const ListContext = createContext<ListContextValue | null>(null);
const ListsContext = createContext<ListsContextValue | null>(null);

export function ListProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(listsReducer, undefined, loadState);

  // Persiste mudanças (dados não sensíveis).
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // storage indisponível (modo privado/quota) — ignora silenciosamente.
    }
  }, [state]);

  const active = useMemo(
    () => state.lists.find((l) => l.id === state.activeId) ?? state.lists[0],
    [state.lists, state.activeId],
  );

  const listValue = useMemo<ListContextValue>(() => {
    const count = active.items.reduce((sum, i) => sum + i.quantity, 0);
    return {
      items: active.items,
      customPrices: active.customPrices,
      count,
      addItem: (product, quantity) => dispatch({ type: 'ADD', product, quantity }),
      addManualItem: (input) => dispatch({ type: 'ADD_MANUAL', input }),
      setQuantity: (productId, quantity) => dispatch({ type: 'SET_QUANTITY', productId, quantity }),
      removeItem: (productId) => dispatch({ type: 'REMOVE', productId }),
      clear: () => dispatch({ type: 'CLEAR' }),
    };
  }, [active]);

  const listsValue = useMemo<ListsContextValue>(() => {
    return {
      lists: state.lists.map((l) => ({
        id: l.id,
        name: l.name,
        itemCount: l.items.reduce((sum, i) => sum + i.quantity, 0),
        updatedAt: l.updatedAt,
      })),
      activeId: state.activeId,
      activeName: active.name,
      createList: (name) => {
        const id = `list-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        dispatch({ type: 'CREATE_LIST', name, id });
        return id;
      },
      renameList: (id, name) => dispatch({ type: 'RENAME_LIST', id, name }),
      deleteList: (id) => dispatch({ type: 'DELETE_LIST', id }),
      selectList: (id) => dispatch({ type: 'SELECT_LIST', id }),
    };
  }, [state.lists, state.activeId, active.name]);

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
