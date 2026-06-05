import { describe, expect, it } from 'vitest';
import { formatCurrency, formatPercent, savingsRatio } from './currency';

// O Intl pt-BR separa "R$" do numero por um NBSP (U+00A0), nao por espaco comum.
const NBSP = String.fromCharCode(160);

describe('formatCurrency', () => {
  it('formata valores em reais com 2 casas', () => {
    expect(formatCurrency(12.5)).toBe(`R$${NBSP}12,50`);
    expect(formatCurrency(1000)).toBe(`R$${NBSP}1.000,00`);
  });

  it('trata zero e negativos', () => {
    expect(formatCurrency(0)).toBe(`R$${NBSP}0,00`);
    expect(formatCurrency(-5)).toContain('5,00');
  });

  it('faz fallback seguro para valores nao-finitos', () => {
    expect(formatCurrency(Number.NaN)).toBe(`R$${NBSP}0,00`);
    expect(formatCurrency(Number.POSITIVE_INFINITY)).toBe(`R$${NBSP}0,00`);
  });
});

describe('formatPercent', () => {
  it('formata fracao como porcentagem', () => {
    expect(formatPercent(0.13)).toBe('13%');
  });
});

describe('savingsRatio', () => {
  it('calcula a economia relativa entre o mais caro e o escolhido', () => {
    expect(savingsRatio(100, 80)).toBeCloseTo(0.2);
  });

  it('retorna 0 quando nao ha economia ou entrada invalida', () => {
    expect(savingsRatio(100, 120)).toBe(0);
    expect(savingsRatio(0, 50)).toBe(0);
  });
});
