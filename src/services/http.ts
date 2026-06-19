/**
 * Camada HTTP isolada — cliente real da API (`apiGet/apiPost/apiPatch/apiDelete`).
 *
 * É o caminho ativo da aplicação: auth, catálogo, listas, preços e comparação
 * passam por aqui. O helper `delay()` permanece apenas para os mocks restantes
 * (analytics, economia recente, favoritos), que simulam latência de rede.
 *
 * SECURITY (aplicado aqui):
 * - Use SEMPRE HTTPS em produção (VITE_API_BASE_URL).
 * - Autenticação por cookie httpOnly + Secure + SameSite — nada de token em
 *   localStorage/sessionStorage (vulnerável a XSS).
 * - `credentials: 'include'` para o cookie de sessão acompanhar a requisição, e
 *   header anti-CSRF `X-CSRF-Token` em métodos que alteram estado (ver abaixo).
 * - Erros são tratados sem vazar detalhes internos ao usuário.
 */

/** Simula a latência de rede — usado apenas pelos mocks remanescentes. */
export function delay<T>(data: T, ms = 350): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}

/* ---------------------------------------------------------------------------
 * Cliente HTTP real (consumido pelos services em `services/api/*`).
 * ------------------------------------------------------------------------- */

/** Base da API. Ex.: http://localhost:8000/api (sem barra no final). */
const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

/** Nome do cookie CSRF (deve casar com `csrf_cookie_name` do back-end). */
const CSRF_COOKIE = 'listasmart_csrf';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/** Lê um cookie (não-httpOnly) do documento. SSR-safe. */
function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

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
  const method = (init.method ?? 'GET').toUpperCase();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    ...(init.headers as Record<string, string> | undefined),
  };

  // CSRF (double-submit): em métodos que alteram estado, reenvia o token do
  // cookie CSRF no header X-CSRF-Token (ver backend/app/csrf.py).
  if (!SAFE_METHODS.has(method)) {
    const token = readCookie(CSRF_COOKIE);
    if (token) headers['X-CSRF-Token'] = token;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    // Envia/recebe o cookie httpOnly de sessão (autenticação).
    credentials: 'include',
    ...init,
    headers,
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
