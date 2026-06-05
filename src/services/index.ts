/**
 * Barrel da camada de services. Importe daqui (`@/services`) para manter os
 * componentes desacoplados da implementação (mock hoje, API real depois).
 */
export * from './catalog';
export * from './home';
export * from './list';
export * from './analytics';
export { delay } from './http';
