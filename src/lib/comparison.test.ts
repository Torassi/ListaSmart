import { describe, expect, it } from 'vitest';
import { buildComparison } from './comparison';
import type { ListItem, Market, Product } from '@/types';
import type { PriceMatrix } from '@/services';

const markets: Market[] = [
  { id: 'a', name: 'Mercado A' },
  { id: 'b', name: 'Mercado B' },
];

function product(id: string): Product {
  return { id, name: id, category: 'Mercearia', unit: 'un', imageUrl: '' };
}

const items: ListItem[] = [
  { product: product('p1'), quantity: 2 },
  { product: product('p2'), quantity: 1 },
];

// A é mais barato em ambos os produtos.
const matrix: PriceMatrix = {
  p1: { a: 10, b: 12 },
  p2: { a: 5, b: 8 },
};

describe('buildComparison', () => {
  it('calcula totais por mercado considerando a quantidade', () => {
    const c = buildComparison(items, markets, matrix, {});
    expect(c.totals.find((t) => t.marketId === 'a')?.total).toBe(25); // 10*2 + 5*1
    expect(c.totals.find((t) => t.marketId === 'b')?.total).toBe(32); // 12*2 + 8*1
  });

  it('identifica o mais barato, o mais caro e a economia', () => {
    const c = buildComparison(items, markets, matrix, {});
    expect(c.cheapestMarketId).toBe('a');
    expect(c.mostExpensiveMarketId).toBe('b');
    expect(c.savedAmount).toBe(7); // 32 - 25
  });

  it('marca menor e maior preço por linha', () => {
    const c = buildComparison(items, markets, matrix, {});
    const row = c.rows[0];
    expect(row.cells.find((x) => x.marketId === 'a')?.isCheapest).toBe(true);
    expect(row.cells.find((x) => x.marketId === 'b')?.isMostExpensive).toBe(true);
  });

  it('prioriza preços manuais sobre a matriz', () => {
    const c = buildComparison(items, markets, matrix, { p1: { b: 1 } });
    // Agora B custa 1 no p1, virando o mais barato dessa linha.
    const row = c.rows[0];
    expect(row.cells.find((x) => x.marketId === 'b')?.isCheapest).toBe(true);
  });

  it('marca cobertura incompleta e exclui o mercado do "mais barato"', () => {
    // B só tem preço para p1 (falta p2) → incompleto, mesmo sendo mais barato no parcial.
    const partial: PriceMatrix = { p1: { a: 10, b: 1 }, p2: { a: 5 } };
    const c = buildComparison(items, markets, partial, {});

    const a = c.totals.find((t) => t.marketId === 'a');
    const b = c.totals.find((t) => t.marketId === 'b');
    expect(a?.complete).toBe(true);
    expect(b?.complete).toBe(false);

    // Apesar do total parcial de B ser menor, só A (completo) disputa.
    expect(c.cheapestMarketId).toBe('a');
    expect(c.mostExpensiveMarketId).toBe('a');
    expect(c.savedAmount).toBe(0);
  });
});
