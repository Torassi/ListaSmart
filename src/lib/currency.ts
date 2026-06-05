/**
 * Formatação de moeda e números — sempre em pt-BR (R$).
 *
 * Use a classe utilitária `money` (ou `tabular-nums`) no elemento que exibe o
 * valor para manter o alinhamento das colunas financeiras.
 */

const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const PERCENT = new Intl.NumberFormat('pt-BR', {
  style: 'percent',
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

/** Formata um número como moeda brasileira: 12.5 -> "R$ 12,50". */
export function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return BRL.format(0);
  return BRL.format(value);
}

/** Formata uma fração (0..1) como porcentagem: 0.125 -> "13%". */
export function formatPercent(fraction: number): string {
  if (!Number.isFinite(fraction)) return PERCENT.format(0);
  return PERCENT.format(fraction);
}

/**
 * Calcula o percentual de economia entre dois totais (mais caro vs. escolhido).
 * Retorna fração 0..1 (ex.: 0.18 = 18%).
 */
export function savingsRatio(mostExpensive: number, chosen: number): number {
  if (!Number.isFinite(mostExpensive) || mostExpensive <= 0) return 0;
  const ratio = (mostExpensive - chosen) / mostExpensive;
  return ratio > 0 ? ratio : 0;
}
