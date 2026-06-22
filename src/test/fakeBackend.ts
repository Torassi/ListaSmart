/**
 * Fake backend em memória para os testes (instalado como mock global de `fetch`).
 *
 * Depois da integração, as telas/contextos falam com a API real. Nos testes não
 * há servidor, então este módulo implementa um back-end mínimo, fiel ao contrato
 * (auth por "sessão", listas, catálogo, preços e comparação), permitindo testar
 * o caminho real contexto → service → fetch de forma determinística.
 *
 * A sessão começa DESLOGADA a cada teste. Use `seedSession()` para autenticar.
 */
import type {
  AnalyticsData,
  ComparisonSnapshot,
  ListComparison,
  Market,
  Product,
  ProductCategory,
  SavingsSummary,
  ShoppingList,
  User,
} from '@/types';

interface Account extends User {
  password: string;
}

interface SearchEventRow {
  userId: string | null;
  productId: string | null;
  category: string | null;
  query: string | null;
}

interface SnapshotRow {
  id: number;
  userId: string;
  shoppingListId: string;
  listName: string;
  cheapestMarketId: string | null;
  mostExpensiveMarketId: string | null;
  cheapestTotal: number;
  mostExpensiveTotal: number;
  savedAmount: number;
  createdAt: string;
}

interface State {
  session: string | null;
  users: Account[];
  markets: Market[];
  products: Product[];
  prices: Record<string, Record<string, number>>;
  lists: ShoppingList[];
  searchEvents: SearchEventRow[];
  snapshots: SnapshotRow[];
  manualPriceKeys: Set<string>;
  seq: number;
}

let state: State;

function freshState(): State {
  const markets: Market[] = [
    { id: 'giassi', name: 'Giassi', brandColor: '#E11D48' },
    { id: 'bistek', name: 'Bistek', brandColor: '#F59E0B' },
  ];
  const products: Product[] = [
    {
      id: 'p1',
      name: 'Banana Prata',
      category: 'Hortifrúti',
      unit: '1 kg',
      imageUrl: 'data:,',
      barcode: '7891000000000',
    },
    {
      id: 'p2',
      name: 'Leite Integral',
      category: 'Laticínios',
      unit: '1 L',
      brand: 'Tirol',
      imageUrl: 'data:,',
      barcode: '7891000000001',
    },
  ];
  const prices = {
    p1: { giassi: 5.49, bistek: 5.0 },
    p2: { giassi: 5.29, bistek: 4.97 },
  };
  return {
    session: null,
    users: [],
    markets,
    products,
    prices,
    lists: [],
    searchEvents: [],
    snapshots: [],
    manualPriceKeys: new Set(),
    seq: 1,
  };
}

/** Reinicia o estado (chamar antes de cada teste). */
export function resetFakeBackend(): void {
  state = freshState();
}

/** Cria/loga um usuário de teste e devolve-o (autentica a sessão). */
export function seedSession(
  partial: Partial<Account> = {},
): User {
  const account: Account = {
    id: `u${state.seq++}`,
    name: partial.name ?? 'Teste',
    email: partial.email ?? 'teste@exemplo.com',
    password: partial.password ?? '12345678',
  };
  state.users.push(account);
  state.session = account.id;
  return toUser(account);
}

function toUser(a: Account): User {
  return { id: a.id, name: a.name, email: a.email, avatarUrl: a.avatarUrl };
}

/** Introspecção para testes: eventos de busca registrados. */
export function getRecordedSearchEvents(): ReadonlyArray<SearchEventRow> {
  return state.searchEvents;
}

const ERR = {
  unauthorized: () => json({ error: { code: 'unauthorized', message: 'Faça login.' } }, 401),
  notFound: () => json({ error: { code: 'not_found', message: 'Não encontrado.' } }, 404),
  conflict: (code: string, message: string) => json({ error: { code, message } }, 409),
  invalid: (message: string) => json({ error: { code: 'validation_error', message } }, 422),
};

function json(data: unknown, status = 200): Response {
  if (status === 204) return new Response(null, { status });
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function currentUser(): Account | null {
  return state.users.find((u) => u.id === state.session) ?? null;
}

function lowestPrice(productId: string): number | null {
  const byMarket = state.prices[productId];
  if (!byMarket) return null;
  const values = Object.values(byMarket);
  return values.length ? Math.min(...values) : null;
}

function withPrice(p: Product) {
  return { ...p, lowestPrice: lowestPrice(p.id) };
}

function serializeList(list: ShoppingList): ShoppingList {
  return list;
}

function findList(id: string): ShoppingList | undefined {
  const user = currentUser();
  return state.lists.find((l) => l.id === id && user && l.collaborators[0]?.id === user.id);
}

function touch(list: ShoppingList): void {
  list.updatedAt = new Date(Date.now() + state.seq++).toISOString();
}

function buildComparison(list: ShoppingList): ListComparison {
  const markets = state.markets;
  const rows = list.items.map((item) => {
    const raw = markets.map((m) => ({
      marketId: m.id,
      value: state.prices[item.product.id]?.[m.id] ?? null,
    }));
    const vals = raw.map((r) => r.value).filter((v): v is number => v != null);
    const min = vals.length ? Math.min(...vals) : null;
    const max = vals.length ? Math.max(...vals) : null;
    const variation = min != null && max != null && min < max;
    return {
      product: item.product,
      quantity: item.quantity,
      cells: raw.map((r) => ({
        ...r,
        isCheapest: variation && r.value === min,
        isMostExpensive: variation && r.value === max,
      })),
    };
  });
  const totals = markets.map((m) => {
    let total = 0;
    let covered = 0;
    for (const item of list.items) {
      const v = state.prices[item.product.id]?.[m.id];
      if (v != null) {
        total += v * item.quantity;
        covered += 1;
      }
    }
    return {
      marketId: m.id,
      total: Math.round(total * 100) / 100,
      complete: list.items.length > 0 && covered === list.items.length,
    };
  });
  const eligible = totals.filter((t) => t.complete);
  const cheapest = eligible.reduce<(typeof eligible)[number] | null>(
    (a, t) => (a === null || t.total < a.total ? t : a),
    null,
  );
  const expensive = eligible.reduce<(typeof eligible)[number] | null>(
    (a, t) => (a === null || t.total > a.total ? t : a),
    null,
  );
  return {
    markets,
    rows,
    totals,
    cheapestMarketId: cheapest?.marketId ?? '',
    mostExpensiveMarketId: expensive?.marketId ?? '',
    savedAmount: cheapest && expensive ? Math.round((expensive.total - cheapest.total) * 100) / 100 : 0,
  };
}

function _round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function serializeSnapshot(s: SnapshotRow): ComparisonSnapshot {
  return {
    id: s.id,
    shoppingListId: s.shoppingListId,
    listName: s.listName,
    cheapestMarketId: s.cheapestMarketId,
    mostExpensiveMarketId: s.mostExpensiveMarketId,
    cheapestTotal: s.cheapestTotal,
    mostExpensiveTotal: s.mostExpensiveTotal,
    savedAmount: s.savedAmount,
    createdAt: s.createdAt,
  };
}

function buildSavings(userId: string): SavingsSummary[] {
  const name = (id: string | null) =>
    state.markets.find((m) => m.id === id)?.name ?? '—';
  return state.snapshots
    .filter((s) => s.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 10)
    .map((s) => ({
      id: String(s.id),
      listName: s.listName,
      cheapestMarket: name(s.cheapestMarketId),
      total: s.cheapestTotal,
      savedAmount: s.savedAmount,
      date: s.createdAt,
    }));
}

function buildAnalytics(userId: string): AnalyticsData {
  const marketName = (id: string) =>
    state.markets.find((m) => m.id === id)?.name ?? id;

  // Oportunidades: produtos com maior diferença entre menor e maior preço.
  const opportunities = state.products
    .map((product) => {
      const byMarket = state.prices[product.id] ?? {};
      const ids = Object.keys(byMarket);
      if (ids.length < 2) return null;
      const minId = ids.reduce((a, b) => (byMarket[a] <= byMarket[b] ? a : b));
      const maxId = ids.reduce((a, b) => (byMarket[a] >= byMarket[b] ? a : b));
      const diff = byMarket[maxId] - byMarket[minId];
      if (diff <= 0) return null;
      return {
        product,
        cheapestMarket: marketName(minId),
        mostExpensiveMarket: marketName(maxId),
        minPrice: _round2(byMarket[minId]),
        maxPrice: _round2(byMarket[maxId]),
        diff: _round2(diff),
      };
    })
    .filter((o): o is NonNullable<typeof o> => o !== null)
    .sort((a, b) => b.diff - a.diff)
    .slice(0, 10);

  // Competitividade: vitórias por mercado nos snapshots do usuário.
  const wins = new Map<string, number>();
  const userSnaps = state.snapshots.filter((s) => s.userId === userId);
  for (const s of userSnaps) {
    if (s.cheapestMarketId) wins.set(s.cheapestMarketId, (wins.get(s.cheapestMarketId) ?? 0) + 1);
  }
  const marketCompetitiveness = state.markets
    .map((market) => ({ market, cheapestWins: wins.get(market.id) ?? 0 }))
    .sort((a, b) => b.cheapestWins - a.cheapestWins);
  const cheapestMarketByList =
    marketCompetitiveness[0]?.cheapestWins > 0 ? marketCompetitiveness[0].market.name : '—';
  const avgSavingsPerUser = userSnaps.length
    ? _round2(userSnaps.reduce((sum, s) => sum + s.savedAmount, 0) / userSnaps.length)
    : 0;

  // Buscas: categorias e produtos mais pesquisados (globais).
  const catCount = new Map<string, number>();
  const prodCount = new Map<string, number>();
  for (const e of state.searchEvents) {
    if (e.category) catCount.set(e.category, (catCount.get(e.category) ?? 0) + 1);
    if (e.productId) prodCount.set(e.productId, (prodCount.get(e.productId) ?? 0) + 1);
  }
  const categoryShares = [...catCount.entries()]
    .map(([category, searches]) => ({ category: category as ProductCategory, searches }))
    .sort((a, b) => b.searches - a.searches);
  const mostSearchedProducts = [...prodCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([productId, searches]) => {
      const product = state.products.find((p) => p.id === productId);
      return product ? { product, searches } : null;
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  return {
    cheapestMarketByList,
    avgSavingsPerUser,
    manualPricesCount: state.manualPriceKeys.size,
    mostSearchedProducts,
    categoryShares,
    marketCompetitiveness,
    opportunities,
  };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
async function handle(method: string, path: string, body: any): Promise<Response> {
  const [rawPath, queryString] = path.split('?');
  const params = new URLSearchParams(queryString ?? '');
  const segments = rawPath.replace(/^\//, '').split('/');

  // ---- Auth ----
  if (rawPath === '/auth/me' && method === 'GET') {
    const u = currentUser();
    return u ? json(toUser(u)) : ERR.unauthorized();
  }
  if (rawPath === '/auth/me' && method === 'PATCH') {
    const u = currentUser();
    if (!u) return ERR.unauthorized();
    if (body?.name != null) u.name = body.name;
    if (body?.avatarUrl != null) u.avatarUrl = body.avatarUrl || undefined;
    return json(toUser(u));
  }
  if (rawPath === '/auth/signup' && method === 'POST') {
    const email = String(body.email).trim().toLowerCase();
    if (state.users.some((u) => u.email.toLowerCase() === email)) {
      return ERR.conflict('email_taken', 'Este e-mail já está cadastrado.');
    }
    const account: Account = {
      id: `u${state.seq++}`,
      name: String(body.name).trim(),
      email,
      password: body.password,
    };
    state.users.push(account);
    state.session = account.id;
    return json(toUser(account), 201);
  }
  if (rawPath === '/auth/login' && method === 'POST') {
    const email = String(body.email).trim().toLowerCase();
    const account = state.users.find((u) => u.email.toLowerCase() === email);
    if (!account || account.password !== body.password) {
      return json(
        { error: { code: 'invalid_credentials', message: 'E-mail ou senha incorretos.' } },
        401,
      );
    }
    state.session = account.id;
    return json(toUser(account));
  }
  if (rawPath === '/auth/logout' && method === 'POST') {
    state.session = null;
    return json(null, 204);
  }

  // ---- Catálogo (público) ----
  if (rawPath === '/markets' && method === 'GET') return json(state.markets);
  if (rawPath === '/categories' && method === 'GET') {
    return json([...new Set(state.products.map((p) => p.category))].sort());
  }
  if (rawPath === '/products' && method === 'GET') {
    let list = state.products;
    const q = params.get('q');
    const category = params.get('category');
    const barcode = params.get('barcode');
    if (q) list = list.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
    if (category) list = list.filter((p) => p.category === category);
    if (barcode) list = list.filter((p) => p.barcode === barcode);
    return json(list.map(withPrice));
  }
  if (rawPath === '/products' && method === 'POST') {
    if (!currentUser()) return ERR.unauthorized();
    if (!state.markets.some((m) => m.id === body.marketId)) return ERR.notFound();
    if (body.barcode && state.products.some((p) => p.barcode === body.barcode)) {
      return ERR.conflict(
        'barcode_taken',
        'Já existe um produto com este código de barras.',
      );
    }
    if (!body.name || String(body.name).trim().length < 2) return ERR.invalid('name');
    const product: Product = {
      id: `prod_${state.seq++}`,
      name: String(body.name).trim(),
      category: body.category,
      unit: body.unit,
      imageUrl: body.imageUrl || 'data:,',
      barcode: body.barcode || undefined,
    };
    state.products.push(product);
    (state.prices[product.id] ??= {})[body.marketId] = body.price;
    state.manualPriceKeys.add(`${product.id}:${body.marketId}`);
    return json(withPrice(product), 201);
  }

  // ---- Preços ----
  if (rawPath === '/prices/matrix' && method === 'GET') return json(state.prices);
  if (rawPath === '/prices' && method === 'POST') {
    if (!currentUser()) return ERR.unauthorized();
    if (!state.products.some((p) => p.id === body.productId)) return ERR.notFound();
    if (!state.markets.some((m) => m.id === body.marketId)) return ERR.notFound();
    (state.prices[body.productId] ??= {})[body.marketId] = body.value;
    state.manualPriceKeys.add(`${body.productId}:${body.marketId}`);
    return json(
      {
        productId: body.productId,
        marketId: body.marketId,
        value: body.value,
        source: 'manual',
        updatedAt: new Date().toISOString(),
      },
      201,
    );
  }

  // ---- Analytics (privado) ----
  if (rawPath === '/analytics' && method === 'GET') {
    const user = currentUser();
    if (!user) return ERR.unauthorized();
    return json(buildAnalytics(user.id));
  }
  if (rawPath === '/analytics/search-events' && method === 'POST') {
    const user = currentUser();
    if (!user) return ERR.unauthorized();
    const productId = body?.productId ?? null;
    const category = body?.category ?? null;
    const query = body?.query?.trim() ? body.query.trim() : null;
    if (!productId && !category && !query) return ERR.invalid('evento vazio');
    state.searchEvents.push({
      userId: user.id,
      productId: state.products.some((p) => p.id === productId) ? productId : null,
      category,
      query,
    });
    return json({ ok: true }, 201);
  }

  // ---- Economia recente (privado) ----
  if (rawPath === '/savings/recent' && method === 'GET') {
    const user = currentUser();
    if (!user) return ERR.unauthorized();
    return json(buildSavings(user.id));
  }

  // ---- Listas (privadas) ----
  if (segments[0] === 'lists') {
    const user = currentUser();
    if (!user) return ERR.unauthorized();

    if (segments.length === 1 && method === 'GET') {
      const mine = state.lists
        .filter((l) => l.collaborators[0]?.id === user.id)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      return json(mine.map(serializeList));
    }
    if (segments.length === 1 && method === 'POST') {
      const now = new Date(Date.now() + state.seq++).toISOString();
      const list: ShoppingList = {
        id: `list_${state.seq++}`,
        name: String(body.name).trim(),
        items: [],
        collaborators: [toUser(user)],
        createdAt: now,
        updatedAt: now,
      };
      state.lists.push(list);
      return json(serializeList(list), 201);
    }

    const list = findList(segments[1]);
    if (!list) return ERR.notFound();

    if (segments.length === 2 && method === 'GET') return json(serializeList(list));
    if (segments.length === 2 && method === 'PATCH') {
      list.name = String(body.name).trim();
      return json(serializeList(list));
    }
    if (segments.length === 2 && method === 'DELETE') {
      state.lists = state.lists.filter((l) => l.id !== list.id);
      return json(null, 204);
    }

    // /lists/{id}/items ...
    if (segments[2] === 'items') {
      if (segments.length === 3 && method === 'POST') {
        const product = state.products.find((p) => p.id === body.productId);
        if (!product) return ERR.notFound();
        const qty = body.quantity ?? 1;
        const existing = list.items.find((i) => i.product.id === body.productId);
        if (existing) existing.quantity = Math.min(existing.quantity + qty, 999);
        else list.items.push({ product, quantity: qty });
        touch(list);
        return json(serializeList(list), 201);
      }
      if (segments.length === 3 && method === 'DELETE') {
        list.items = [];
        touch(list);
        return json(serializeList(list));
      }
      const productId = segments[3];
      const item = list.items.find((i) => i.product.id === productId);
      if (!item) return ERR.notFound();
      if (method === 'PATCH') {
        item.quantity = body.quantity;
        touch(list);
        return json(serializeList(list));
      }
      if (method === 'DELETE') {
        list.items = list.items.filter((i) => i.product.id !== productId);
        touch(list);
        return json(serializeList(list));
      }
    }

    if (segments[2] === 'comparison' && method === 'GET') {
      return json(buildComparison(list));
    }

    if (segments[2] === 'comparison-snapshots' && method === 'POST') {
      const comp = buildComparison(list);
      if (!comp.cheapestMarketId) {
        return json(
          { error: { code: 'incomplete_coverage', message: 'Cobertura incompleta.' } },
          400,
        );
      }
      const totals = new Map(comp.totals.map((t) => [t.marketId, t.total]));
      // Dedupe: snapshot recente da mesma lista é reaproveitado.
      const recent = state.snapshots.find(
        (s) => s.userId === user.id && s.shoppingListId === list.id,
      );
      if (recent) return json(serializeSnapshot(recent), 201);

      const snap: SnapshotRow = {
        id: state.seq++,
        userId: user.id,
        shoppingListId: list.id,
        listName: list.name,
        cheapestMarketId: comp.cheapestMarketId,
        mostExpensiveMarketId: comp.mostExpensiveMarketId || null,
        cheapestTotal: totals.get(comp.cheapestMarketId) ?? 0,
        mostExpensiveTotal: totals.get(comp.mostExpensiveMarketId) ?? 0,
        savedAmount: comp.savedAmount,
        createdAt: new Date(Date.now() + state.seq++).toISOString(),
      };
      state.snapshots.push(snap);
      return json(serializeSnapshot(snap), 201);
    }
  }

  return json({ error: { code: 'not_found', message: `Sem rota: ${method} ${rawPath}` } }, 404);
}

/** Instala o mock global de fetch que roteia para o fake backend. */
export function installFakeBackend(): void {
  resetFakeBackend();
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    // Remove a origin (se houver) e o prefixo /api da base da API
    // (VITE_API_BASE_URL=http://localhost:8000/api), deixando só a rota.
    const path = url
      .replace(/^https?:\/\/[^/]+/, '')
      .replace(/^\/api(?=\/|$)/, '');
    const method = (init?.method ?? 'GET').toUpperCase();
    const body = init?.body ? JSON.parse(init.body as string) : undefined;
    return handle(method, path, body);
  }) as typeof fetch;
}
