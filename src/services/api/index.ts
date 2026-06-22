/**
 * Camada de services REAL (back-end FastAPI em `backend/`) — caminho ATIVO.
 *
 * Auth, catálogo, listas, preços e comparação da aplicação usam estes services
 * (diretamente ou via `@/services`, que delega catálogo/preços para cá). A base
 * da API vem de `VITE_API_BASE_URL` (ex.: `http://localhost:8000/api`) e as
 * requisições enviam o cookie httpOnly de sessão (`credentials: 'include'`).
 *
 * Favoritos seguem fora do backend nesta etapa (ver services/home.ts).
 */
export * as authApi from './auth';
export * as catalogApi from './catalog';
export * as listsApi from './lists';
export * as pricesApi from './prices';
export * as comparisonApi from './comparison';
export * as analyticsApi from './analytics';
export * as savingsApi from './savings';
