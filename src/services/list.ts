/**
 * Service de preços da lista — matriz de preços por produto/mercado.
 *
 * INTEGRADO: delega para a API real (`services/api/prices.ts`). O tipo
 * `PriceMatrix` continua declarado aqui para manter o contrato estável.
 */

/** productId -> (marketId -> valor). */
export type PriceMatrix = Record<string, Record<string, number>>;

export { getPriceMatrix, registerPrice } from './api/prices';
export type { RegisterPriceInput } from './api/prices';
