/**
 * Camada de services REAL (back-end FastAPI em `backend/`).
 *
 * ISOLADA de propósito: o app continua usando os mocks de `@/services` por
 * padrão. Esta pasta contém as implementações prontas para a integração da
 * PRÓXIMA ETAPA — auth, catálogo, listas, preços e comparação.
 *
 * Como ativar (resumo — ver README):
 * 1. Suba o back-end (pasta `backend/`).
 * 2. Defina `VITE_API_BASE_URL=http://localhost:8000/api` no `.env`.
 * 3. Troque os imports dos consumidores de `@/services/*` por `@/services/api/*`
 *    (auth, catálogo, listas, preços, comparação). Home/dashboard seguem no mock.
 *
 * NÃO inclui: analytics, economia recente, favoritos — seguem mockados.
 */
export * as authApi from './auth';
export * as catalogApi from './catalog';
export * as listsApi from './lists';
export * as pricesApi from './prices';
export * as comparisonApi from './comparison';
