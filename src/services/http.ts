/**
 * Camada HTTP isolada — ponto único de troca dos mocks pela API real.
 *
 * Hoje só expõe um helper `delay()` para simular latência de rede. Quando o
 * back-end existir, implemente aqui o cliente (fetch/axios) e os services
 * passarão a chamá-lo sem mudar suas assinaturas.
 *
 * SECURITY (diretrizes para a implementação real):
 * - Use SEMPRE HTTPS (VITE_API_BASE_URL).
 * - Autenticação por cookie httpOnly + Secure + SameSite — NÃO armazene tokens
 *   em localStorage/sessionStorage (vulnerável a XSS).
 * - Envie `credentials: 'include'` para que o cookie de sessão acompanhe a
 *   requisição, e inclua o header anti-CSRF (ex.: X-CSRF-Token) em métodos que
 *   alteram estado (POST/PUT/PATCH/DELETE).
 * - Trate erros sem vazar detalhes internos ao usuário (sem stack traces).
 */

/** Simula a latência de uma chamada de rede (apenas para os mocks). */
export function delay<T>(data: T, ms = 350): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}

/* ---------------------------------------------------------------------------
 * Cliente HTTP real (para os services em `services/api/*`).
 *
 * Usado quando o back-end (pasta `backend/`) está ativo. Os mocks continuam
 * existindo e usando apenas `delay()` acima — a troca é feita trocando o import
 * de `@/services` por `@/services/api` (ver services/api/index.ts).
 * ------------------------------------------------------------------------- */

/** Base da API. Ex.: http://localhost:8000/api (sem barra no final). */
const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

/** Erro de API com a mensagem amigável vinda do back-end (padrão `{error}`). */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiErrorBody {
  error?: { code?: string; message?: string };
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    // Envia/recebe o cookie httpOnly de sessão (autenticação).
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
    ...init,
  });

  if (res.status === 204) return undefined as T;

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    const body = (data ?? {}) as ApiErrorBody;
    throw new ApiError(
      body.error?.message ?? 'Não foi possível concluir a requisição.',
      res.status,
      body.error?.code ?? 'error',
    );
  }
  return data as T;
}

export function apiGet<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'GET' });
}

export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: 'PATCH',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export function apiDelete<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'DELETE' });
}
