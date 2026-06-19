/**
 * Barrel da camada de services. Importe daqui (`@/services`) para manter os
 * componentes desacoplados da implementação.
 *
 * `catalog` e `list` (preços) delegam para a API real (`services/api/*`);
 * `home` (economia recente, favoritos) e `analytics` ainda são mocks.
 */
export * from './catalog';
export * from './home';
export * from './list';
export * from './analytics';
export { delay } from './http';
