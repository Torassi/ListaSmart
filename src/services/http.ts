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

/*
 * Exemplo de como o cliente real poderia ficar (mantido como referência):
 *
 * const BASE_URL = import.meta.env.VITE_API_BASE_URL;
 *
 * export async function apiGet<T>(path: string): Promise<T> {
 *   const res = await fetch(`${BASE_URL}${path}`, {
 *     method: 'GET',
 *     credentials: 'include', // envia o cookie httpOnly de sessão
 *     headers: { Accept: 'application/json' },
 *   });
 *   if (!res.ok) throw new Error('Não foi possível carregar os dados.');
 *   return (await res.json()) as T;
 * }
 */
